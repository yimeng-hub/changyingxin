'use strict';
/**
 * 静态站导出：把当前数据 + EJS 模板渲染成纯静态 HTML（中英双语）
 * 输出目录：dist/
 *   dist/index.html              中文首页
 *   dist/about.html              中文关于页
 *   dist/product/<id>.html       中文商品详情
 *   dist/en/index.html           英文首页
 *   dist/en/about.html           英文关于页
 *   dist/en/product/<id>.html    英文商品详情
 *
 * 用法：
 *   node scripts/build-static.js
 *   SITE_URL=https://tecshin.com node scripts/build-static.js
 *
 * 说明：
 * - 去掉登录、留言提交、后台入口（staticMode=true）
 * - 询价改为 tel: / mailto: 直达
 * - 链接全部输出为 .html，静态托管无需任何 rewrite 规则
 */
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { dict, pick } = require('../src/i18n');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const SITE = (process.env.SITE_URL || 'https://tecshin.com').replace(/\/+$/, '');

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'db.json'), 'utf8'));
const active = (arr) => (arr || []).filter((x) => x.active !== false);
const bySort = (a, b) => (a.sort || 0) - (b.sort || 0);

const slides = active(data.slides).sort(bySort);
const categories = active(data.categories).sort(bySort);
const brands = active(data.brands).sort(bySort);
const products = active(data.products);
const promotions = active(data.promotions).sort(bySort);
const hotProducts = products
  .filter((x) => x.tags && (x.tags.includes('featured') || x.tags.includes('hot')))
  .sort((a, b) => (b.tags || []).length - (a.tags || []).length);

const newProducts = (() => {
  const manual = products.filter((x) => x.isNew).sort((a, b) => (b.newSort || 0) - (a.newSort || 0));
  if (manual.length >= 4) return manual.slice(0, 8);
  const auto = products
    .filter((x) => !x.isNew)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 8 - manual.length);
  return manual.concat(auto);
})();

/** slug: 'index.html' | 'about.html' | 'product/xxx.html' */
function urlOf(lang, slug) {
  const isIndex = slug === 'index.html';
  if (lang === 'en') return `${SITE}/en/${isIndex ? 'index.html' : slug}`;
  return isIndex ? `${SITE}/index.html` : `${SITE}/${slug}`;
}

/** 站内相对路径（用于语言切换，生产/本地都可用；一律显式 .html，避免依赖子目录首页） */
function relUrlOf(lang, slug) {
  if (lang === 'en') return `/en/${slug}`;
  return `/${slug}`;
}

function pageModel(lang, slug, extra = {}) {
  const canonical = urlOf(lang, slug);
  const altZh = urlOf('zh', slug);
  const altEn = urlOf('en', slug);
  return Object.assign(
    {
      lang,
      t: dict[lang],
      i18nDict: dict,
      settings: data.settings,
      slides,
      categories,
      brands,
      products,
      hotProducts,
      newProducts,
      promotions,
      pick,
      pagePath: lang === 'en' ? `/en/${slug}` : `/${slug}`,
      siteBase: SITE,
      staticMode: true,
      canonical,
      altZh,
      altEn,
      langSwitch: relUrlOf(lang === 'en' ? 'zh' : 'en', slug),
    },
    extra
  );
}

function relatedOf(p) {
  const others = products.filter((x) => x.id !== p.id);
  const sameBrand = others.filter((x) => p.brandId && x.brandId === p.brandId);
  const sameCat = others.filter((x) => !sameBrand.includes(x) && x.categoryId === p.categoryId);
  return sameBrand.concat(sameCat).slice(0, 4);
}

/** 站内链接改写：按语言写入对应静态路径 */
function rewrite(html, lang) {
  const pre = lang === 'en' ? '/en' : '';
  let out = html
    // 带 ?lang= 的链接 -> 对应语言目录
    .replace(/\/product\/([A-Za-z0-9_]+)\?lang=(zh|en)/g, (m, id, l) =>
      `${l === 'en' ? '/en' : ''}/product/${id}.html`)
    .replace(/\/about\?lang=(zh|en)/g, (m, l) => `${l === 'en' ? '/en' : ''}/about.html`)
    .replace(/\/\?lang=(zh|en)/g, (m, l) => `${l === 'en' ? '/en' : ''}/index.html`)
    // 无参数的绝对链接
    .replace(/href="\/product\/([A-Za-z0-9_]+)"/g, `href="${pre}/product/$1.html"`)
    .replace(/href="\/about"/g, `href="${pre}/about.html"`)
    // 注意：不要改写裸 href="/"，那是语言切换（中文首页）用的相对路径
    // 残留的后台入口
    .replace(/<a href="\/admin"[^>]*>[\s\S]*?<\/a>/g, '');
  // 首页 canonical 去掉 index.html 更好看
  out = out.replace(new RegExp(SITE + '/index\\.html', 'g'), SITE + '/');
  out = out.replace(new RegExp(SITE + '/en/index\\.html', 'g'), SITE + '/en/');
  return out;
}

async function render(view, model, outFile) {
  const html = await ejs.renderFile(path.join(ROOT, 'views', view), model);
  const full = path.join(DIST, outFile);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, rewrite(html, model.lang));
}

(async () => {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let count = 0;
  for (const lang of ['zh', 'en']) {
    const dir = lang === 'en' ? 'en/' : '';

    // 首页 / 关于
    await render('index.ejs', pageModel(lang, 'index.html'), `${dir}index.html`);
    await render('about.ejs', pageModel(lang, 'about.html'), `${dir}about.html`);
    count += 2;

    // 商品详情
    for (const p of products) {
      const slug = `product/${p.id}.html`;
      await render(
        'product.ejs',
        pageModel(lang, slug, {
          product: p,
          related: relatedOf(p),
          pageTitle: `${p.productCode || p.sku} ${lang === 'en' ? p.nameEn : p.name} | ${data.settings.shortName}`,
          pageDesc: lang === 'en' ? p.descriptionEn : p.description,
        }),
        `${dir}${slug}`
      );
      count++;
    }
  }

  // 404（中英各一份）
  await render('404.ejs', pageModel('zh', '404.html'), '404.html');
  await render('404.ejs', pageModel('en', '404.html'), 'en/404.html');
  count += 2;

  // 静态资源
  fs.cpSync(PUBLIC, DIST, { recursive: true });

  // sitemap（含双语 hreflang 注释版：同时列出中英 URL）
  const urls = [];
  const push = (zhSlug, enSlug) => {
    urls.push({ loc: urlOf('zh', zhSlug), p: '0.9', f: 'weekly' });
    if (enSlug) urls.push({ loc: urlOf('en', enSlug), p: '0.8', f: 'weekly' });
  };
  push('index.html', 'index.html');
  push('about.html', 'about.html');
  products.forEach((p) => push(`product/${p.id}.html`, `product/${p.id}.html`));

  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u.loc}</loc><changefreq>${u.f}</changefreq><priority>${u.p}</priority></url>`).join('\n') +
      `\n</urlset>\n`
  );
  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`
  );

  const size = (dir) => {
    let s = 0;
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f); else s += fs.statSync(f).size;
    });
    walk(dir);
    return Math.round(s / 1024 / 1024);
  };

  console.log(`\n[static] 构建完成 → dist/`);
  console.log(`  HTML: ${count} 个（中英各 ${count / 2 - 0.5} 页 + 404）`);
  console.log(`  商品: ${products.length} 个（中英双份）`);
  console.log(`  体积: ${size(DIST)} MB`);
  console.log(`  站点: ${SITE}`);
  console.log(`  首页: ${SITE}/   英文: ${SITE}/en/\n`);
})().catch((e) => {
  console.error('[static] 构建失败:', e);
  process.exit(1);
});
