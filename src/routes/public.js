'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { dict, pick } = require('../i18n');

const SUPPORTED = ['zh', 'en'];
function langOf(req) {
  let l = (req.query.lang || '').toLowerCase();
  if (!SUPPORTED.includes(l)) l = 'zh';
  return l;
}

function publicModel(req, extra = {}) {
  const d = db.read();
  const lang = langOf(req);
  const t = dict[lang];
  const s = d.settings;
  return {
    pagePath: req.path,
    lang,
    t,
    i18nDict: dict,
    settings: s,
    slides: d.slides.filter((x) => x.active).sort((a, b) => a.sort - b.sort),
    categories: d.categories.filter((x) => x.active).sort((a, b) => a.sort - b.sort),
    brands: d.brands.filter((x) => x.active).sort((a, b) => a.sort - b.sort),
    products: d.products.filter((x) => x.active),
    hotProducts: d.products
      .filter((x) => x.active && x.tags && (x.tags.includes('featured') || x.tags.includes('hot')))
      .sort((a, b) => (b.tags || []).length - (a.tags || []).length),
    // 新产品：后台手动指定（isNew）优先；未指定时自动按上架时间推荐最新 8 件
    newProducts: (() => {
      const act = d.products.filter((x) => x.active);
      const manual = act.filter((x) => x.isNew).sort((a, b) => (b.newSort || 0) - (a.newSort || 0));
      if (manual.length >= 4) return manual.slice(0, 8);
      const auto = act
        .filter((x) => !x.isNew)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        .slice(0, 8 - manual.length);
      return manual.concat(auto);
    })(),
    promotions: d.promotions.filter((x) => x.active).sort((a, b) => a.sort - b.sort),
    pick,
    ...extra,
  };
}

// 首页（服务端渲染，利于 SEO）
router.get('/', (req, res) => {
  const model = publicModel(req);
  res.render('index', model);
});

// 关于页（轻量，利于收录）
router.get('/about', (req, res) => {
  const model = publicModel(req);
  res.render('about', model);
});

// 公开 API：分类（产品类型）
router.get('/api/categories', (req, res) => {
  const d = db.read();
  res.json(d.categories.filter((x) => x.active).sort((a, b) => a.sort - b.sort));
});

// 公开 API：品牌（一级导航）
router.get('/api/brands', (req, res) => {
  const d = db.read();
  res.json(d.brands.filter((x) => x.active).sort((a, b) => a.sort - b.sort));
});

// 公开 API：商品（支持品牌 / 分类 / 关键词 / 精选过滤）
router.get('/api/products', (req, res) => {
  const d = db.read();
  let list = d.products.filter((x) => x.active);
  const { brand, category, q, featured } = req.query;
  if (brand) list = list.filter((p) => p.brandId === brand);
  if (category) list = list.filter((p) => p.categoryId === category);
  if (featured === '1') list = list.filter((p) => p.tags && (p.tags.includes('featured') || p.tags.includes('hot')));
  if (q) {
    const k = q.toLowerCase();
    list = list.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(k) ||
        (p.nameEn || '').toLowerCase().includes(k) ||
        (p.sku || '').toLowerCase().includes(k) ||
        (p.description || '').toLowerCase().includes(k)
    );
  }
  res.json(list);
});

// 公开 API：轮播 / 促销
router.get('/api/slides', (req, res) => res.json(db.read().slides.filter((x) => x.active)));
router.get('/api/promotions', (req, res) => res.json(db.read().promotions.filter((x) => x.active)));

// 留言提交（用户提交，后台可见）
router.post('/api/messages', (req, res) => {
  const { name, email, phone, subject, content } = req.body || {};
  if (!name || !email || !content) {
    return res.status(400).json({ error: '请填写姓名、邮箱与留言内容' });
  }
  const d = db.read();
  d.messages.push({
    id: db.uid('msg'),
    name: String(name).slice(0, 80),
    email: String(email).slice(0, 120),
    phone: String(phone || '').slice(0, 40),
    subject: String(subject || '').slice(0, 120),
    content: String(content).slice(0, 2000),
    status: 'new',
    createdAt: new Date().toISOString(),
  });
  db.save();
  res.json({ ok: true, message: '留言已提交' });
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`
  );
});

// sitemap.xml（动态生成，利于 SEO 收录）
router.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const d = db.read();
  const urls = [];
  urls.push({ loc: `${base}/?lang=zh`, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${base}/?lang=en`, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${base}/about?lang=zh`, changefreq: 'monthly', priority: '0.6' });
  d.products.filter((p) => p.active).forEach((p) => {
    urls.push({ loc: `${base}/product/${p.id}?lang=zh`, changefreq: 'weekly', priority: '0.8' });
    urls.push({ loc: `${base}/product/${p.id}?lang=en`, changefreq: 'weekly', priority: '0.8' });
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n') +
    `\n</urlset>`;
  res.type('application/xml').send(xml);
});

// 商品详情页（SSR，利于收录与留存）
router.get('/product/:id', (req, res) => {
  const d = db.read();
  const p = d.products.find((x) => x.id === req.params.id && x.active);
  if (!p) return res.status(404).render('404', publicModel(req));
  const model = publicModel(req, { product: p, related: d.products.filter((x) => x.active && (x.brandId === p.brandId || x.categoryId === p.categoryId) && x.id !== p.id).slice(0, 4) });
  res.render('product', model);
});

module.exports = router;
