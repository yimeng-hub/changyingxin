'use strict';
/**
 * 抓取 hhinte.com SMC 分类商品 -> 导入本站
 * 用法：
 *   node scripts/scrape-smc.js --pages=3           抓取前 N 页并写入数据库
 *   node scripts/scrape-smc.js --pages=3 --dry     只抓取、打印，不写库
 *
 * 说明：
 * - 每条商品保留来源页地址 sourceUrl，便于人工核对
 * - 价格取列表页展示价（原站需登录才显示会员价，此处按展示价标注）
 * - 图片下载到 public/uploads/products/，文件名用型号
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const db = require('../src/db');

const args = process.argv.slice(2);
const pages = Number((args.find((a) => a.startsWith('--pages=')) || '--pages=3').split('=')[1]) || 3;
const dry = args.includes('--dry');

const BASE = 'https://www.hhinte.com';
const CATEGORY = `${BASE}/category-36.html`;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const IMG_DIR = path.join(ROOT, 'public', 'uploads', 'products');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(600 * (i + 1));
    }
  }
}

function clean(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** 解析列表页：一条商品 = thumb 链接 + 图片 + 标题 + 价格 + 点击数 */
function parseList(html) {
  const items = [];
  const chunks = html.split('<div class="col-xs-6 col-sm-4 col-md-3">').slice(1);
  for (const chunk of chunks) {
    const link = chunk.match(/<a href="(https:\/\/www\.hhinte\.com\/product-\d+\.html)" class="st-thumb">/);
    if (!link) continue;
    const img = chunk.match(/<img[^>]*src="([^"]+)"/);
    const title = chunk.match(/<h5 title="([^"]*)"/);
    const price = chunk.match(/<del[^>]*>\s*¥?\s*([\d.,]+)\s*<\/del>/);
    const clicks = chunk.match(/([\d,]+)\s*次点击/);
    items.push({
      sourceUrl: link[1],
      sourceId: (link[1].match(/product-(\d+)\.html/) || [])[1],
      imageUrl: img ? img[1].split('?')[0] : '',
      title: title ? clean(title[1]) : '',
      price: price ? Number(price[1].replace(/,/g, '')) : 0,
      clicks: clicks ? Number(clicks[1].replace(/,/g, '')) : 0,
    });
  }
  return items;
}

/** 解析详情页：产品编号、货期 */
function parseDetail(html) {
  const code = html.match(/产品编号[:：]\s*([^<\n]+)/);
  const lead = html.match(/货期[:：]\s*([^<\n]+)/);
  return {
    productCode: code ? clean(code[1]) : '',
    leadTime: lead ? clean(lead[1]) : '',
  };
}

/** 型号 -> 安全文件名 */
function safeName(s) {
  return String(s).replace(/[^\w.\-]+/g, '_').slice(0, 60);
}

async function downloadImage(url, filename) {
  const target = path.join(IMG_DIR, filename);
  if (fs.existsSync(target) && fs.statSync(target).size > 1024) return filename;
  // images.hhinte.com 的证书已过期，改用同源 OSS 地址
  const ossUrl = url.replace('https://images.hhinte.com', 'https://hhinte.oss-cn-beijing.aliyuncs.com');
  const candidates = [ossUrl, url];
  let lastErr;
  for (const u of candidates) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': UA, Referer: BASE } });
      if (!res.ok) throw new Error('img HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 512) throw new Error('图片过小，可能被拦截');
      fs.writeFileSync(target, buf);
      return filename;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function mapLimit(list, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (i < list.length) {
      const idx = i++;
      out[idx] = await fn(list[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

(async () => {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  console.log(`[scrape] 分类页 ${CATEGORY}，抓取前 ${pages} 页`);

  // 1) 列表页
  const raw = [];
  for (let p = 1; p <= pages; p++) {
    const url = p === 1 ? CATEGORY : `${CATEGORY}?page=${p}`;
    const html = await get(url);
    const items = parseList(html);
    console.log(`  第 ${p} 页: ${items.length} 条`);
    raw.push(...items);
    await sleep(500);
  }

  // 去重（同一型号可能在多页出现）
  const seen = new Set();
  const uniq = raw.filter((x) => {
    if (!x.title || seen.has(x.title)) return false;
    seen.add(x.title);
    return true;
  });
  console.log(`[scrape] 去重后 ${uniq.length} 条`);

  // 2) 详情页 + 图片
  const enriched = await mapLimit(uniq, 4, async (it) => {
    let detail = { productCode: '', leadTime: '' };
    try {
      const html = await get(it.sourceUrl);
      detail = parseDetail(html);
    } catch (e) {
      console.warn(`  ! 详情页失败 ${it.sourceUrl}: ${e.message}`);
    }
    const model = (detail.productCode || it.title.replace(/^SMC\s*/i, '')).trim();
    let image = '';
    if (it.imageUrl) {
      try {
        const fname = `smc-${safeName(model)}.jpg`;
        await downloadImage(it.imageUrl, fname);
        image = `/uploads/products/${fname}`;
      } catch (e) {
        console.warn(`  ! 图片失败 ${model}: ${e.message}`);
      }
    }
    console.log(`  ✓ ${model} | ¥${it.price} | ${detail.leadTime || '-'} | ${image ? '图OK' : '无图'}`);
    return { ...it, ...detail, model, image };
  });

  fs.writeFileSync(path.join(__dirname, 'smc-products.json'), JSON.stringify(enriched, null, 2));

  if (dry) {
    console.log('[scrape] --dry 模式，未写入数据库');
    return;
  }

  // 3) 写入数据库（按 sku 幂等：已存在则更新价格/图片）
  await db.init();
  const d = db.read();
  const smc = d.brands.find((b) => b.code === 'SMC');
  const pneumaticCat = d.categories.find((c) => c.name.includes('气压')) || d.categories[0];

  let created = 0;
  let updated = 0;
  enriched.forEach((it) => {
    const sku = it.model || it.title;
    const exist = d.products.find((p) => p.sku === sku);
    const base = {
      sku,
      productCode: it.productCode || sku,
      brandId: smc ? smc.id : '',
      categoryId: pneumaticCat ? pneumaticCat.id : '',
      name: it.title,
      nameEn: it.title,
      price: it.price,
      originalPrice: 0,
      currency: 'CNY',
      currencySymbol: '¥',
      rating: 5,
      reviews: 0,
      clicks: it.clicks || 0,
      stock: 0,
      image: it.image || '/uploads/products/p1.svg',
      gallery: [],
      leadTime: it.leadTime || '',
      description: `${it.title}，SMC 原装正品，含税可开票，货期详询客服。`,
      descriptionEn: `${it.title}. Genuine SMC product, tax included, invoice available. Lead time on request.`,
      sourceUrl: it.sourceUrl,
      tags: [],
      active: true,
    };
    if (exist) {
      Object.assign(exist, base);
      updated++;
    } else {
      d.products.push({ id: db.uid('prod'), ...base, createdAt: new Date().toISOString() });
      created++;
    }
  });
  db.save();
  console.log(`[scrape] 完成：新增 ${created} 条，更新 ${updated} 条，当前商品总数 ${d.products.length}`);
})().catch((e) => {
  console.error('[scrape] 失败:', e);
  process.exit(1);
});
