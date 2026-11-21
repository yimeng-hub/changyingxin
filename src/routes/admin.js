'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const { single } = require('../upload');

// ---------- 登录 ----------
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', {});
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const admin = db.read().admins.find((a) => a.username === username);
  if (!admin || !bcrypt.compareSync(password || '', admin.passwordHash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  req.session.adminId = admin.id;
  res.json({ ok: true, redirect: '/admin' });
});

router.post('/logout', (req, res) => {
  req.session && req.session.destroy(() => {});
  res.redirect('/admin/login');
});

// ---------- 仪表盘（需登录） ----------
router.get('/', requireAuth, (req, res) => {
  const d = db.read();
  res.render('admin/dashboard', {
    admin: req.admin,
    counts: {
      products: d.products.length,
      categories: d.categories.length,
      slides: d.slides.length,
      promotions: d.promotions.length,
      messages: d.messages.length,
      newMessages: d.messages.filter((m) => m.status === 'new').length,
    },
  });
});

// 后台数据快照
router.get('/api/state', requireAuth, (req, res) => {
  const d = db.read();
  res.json({
    settings: d.settings,
    slides: d.slides.sort((a, b) => a.sort - b.sort),
    categories: d.categories.sort((a, b) => a.sort - b.sort),
    brands: d.brands.sort((a, b) => a.sort - b.sort),
    products: d.products,
    promotions: d.promotions.sort((a, b) => a.sort - b.sort),
    messages: d.messages.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  });
});

// 类型纠正：active->布尔，sort->数字
function coerce(key, val) {
  if (key === 'active') return val === true || val === 'true' || val === 'on';
  if (key === 'sort') return Number(val) || 0;
  return val;
}

// 通用 CRUD 工厂（支持图片上传 multipart）
function crud(collection, subdir, fields) {
  const list = () => db.read()[collection];
  router.get(`/api/${collection}`, requireAuth, (req, res) => res.json(list()));
  router.post(`/api/${collection}`, requireAuth, single('image', subdir), (req, res) => {
    const item = { id: db.uid(collection.slice(0, 3)) };
    fields.forEach((f) => (item[f.key] = coerce(f.key, req.body[f.key] !== undefined ? req.body[f.key] : f.def)));
    if (req.file) item.image = req.file.url;
    list().push(item);
    db.save();
    res.json(item);
  });
  router.put(`/api/${collection}/:id`, requireAuth, single('image', subdir), (req, res) => {
    const arr = list();
    const item = arr.find((x) => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: '未找到' });
    fields.forEach((f) => {
      if (req.body[f.key] !== undefined) item[f.key] = coerce(f.key, req.body[f.key]);
    });
    if (req.file) item.image = req.file.url;
    db.save();
    res.json(item);
  });
  router.delete(`/api/${collection}/:id`, requireAuth, (req, res) => {
    const arr = list();
    const i = arr.findIndex((x) => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: '未找到' });
    arr.splice(i, 1);
    db.save();
    res.json({ ok: true });
  });
}

// 轮播
crud('slides', 'slides', [
  { key: 'title', def: '' }, { key: 'titleEn', def: '' }, { key: 'subtitle', def: '' }, { key: 'subtitleEn', def: '' },
  { key: 'link', def: '' }, { key: 'sort', def: 1 }, { key: 'active', def: true },
]);
// 分类（产品类型）
crud('categories', 'categories', [
  { key: 'name', def: '' }, { key: 'nameEn', def: '' }, { key: 'icon', def: '📦' }, { key: 'color', def: '#ff6a00' },
  { key: 'sort', def: 1 }, { key: 'active', def: true },
]);
// 品牌（一级导航）
crud('brands', 'brands', [
  { key: 'code', def: '' }, { key: 'name', def: '' }, { key: 'nameEn', def: '' }, { key: 'color', def: '#ff4742' },
  { key: 'sort', def: 1 }, { key: 'active', def: true },
]);
// 促销
crud('promotions', 'promotions', [
  { key: 'title', def: '' }, { key: 'titleEn', def: '' }, { key: 'subtitle', def: '' }, { key: 'discountText', def: '' },
  { key: 'link', def: '' }, { key: 'sort', def: 1 }, { key: 'active', def: true },
]);

// 商品列表（后台）
router.get('/api/products', requireAuth, (req, res) => res.json(db.read().products));

// 商品（含图片上传 + 标签/图集）
router.post('/api/products', requireAuth, single('image', 'products'), (req, res) => {
  const b = req.body || {};
  const item = {
    id: db.uid('prod'),
    sku: b.sku || '',
    categoryId: b.categoryId || '',
    brandId: b.brandId || '',
    name: b.name || '',
    nameEn: b.nameEn || '',
    price: Number(b.price) || 0,
    originalPrice: Number(b.originalPrice) || 0,
    rating: Number(b.rating) || 5,
    reviews: Number(b.reviews) || 0,
    stock: Number(b.stock) || 0,
    image: req.file ? req.file.url : (b.image || ''),
    gallery: (b.gallery || '').split(',').map((s) => s.trim()).filter(Boolean),
    description: b.description || '',
    descriptionEn: b.descriptionEn || '',
    tags: (b.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
    active: b.active === 'false' || b.active === false ? false : true,
    // 手动指定为「新产品」；newSort 越大越靠前
    isNew: b.isNew === 'true' || b.isNew === true,
    newSort: Number(b.newSort) || 0,
    createdAt: new Date().toISOString(),
  };
  db.read().products.push(item);
  db.save();
  res.json(item);
});

router.put('/api/products/:id', requireAuth, single('image', 'products'), (req, res) => {
  const b = req.body || {};
  const item = db.read().products.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: '未找到' });
  ['sku', 'categoryId', 'brandId', 'name', 'nameEn', 'description', 'descriptionEn'].forEach((k) => {
    if (b[k] !== undefined) item[k] = b[k];
  });
  ['price', 'originalPrice', 'rating', 'reviews', 'stock'].forEach((k) => {
    if (b[k] !== undefined) item[k] = Number(b[k]) || 0;
  });
  if (b.tags !== undefined) item.tags = String(b.tags).split(',').map((s) => s.trim()).filter(Boolean);
  if (b.gallery !== undefined) item.gallery = String(b.gallery).split(',').map((s) => s.trim()).filter(Boolean);
  if (b.active !== undefined) item.active = !(b.active === 'false' || b.active === false);
  if (b.isNew !== undefined) item.isNew = b.isNew === 'true' || b.isNew === true;
  if (b.newSort !== undefined) item.newSort = Number(b.newSort) || 0;
  if (req.file) item.image = req.file.url;
  db.save();
  res.json(item);
});

router.delete('/api/products/:id', requireAuth, (req, res) => {
  const arr = db.read().products;
  const i = arr.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  arr.splice(i, 1);
  db.save();
  res.json({ ok: true });
});

// 留言管理
router.get('/api/messages', requireAuth, (req, res) =>
  res.json(db.read().messages.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
);
router.put('/api/messages/:id', requireAuth, (req, res) => {
  const item = db.read().messages.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: '未找到' });
  if (req.body.status !== undefined) item.status = req.body.status;
  db.save();
  res.json(item);
});
router.delete('/api/messages/:id', requireAuth, (req, res) => {
  const arr = db.read().messages;
  const i = arr.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  arr.splice(i, 1);
  db.save();
  res.json({ ok: true });
});

// 站点设置
router.get('/api/settings', requireAuth, (req, res) => res.json(db.read().settings));
router.put('/api/settings', requireAuth, (req, res) => {
  const s = db.read().settings;
  Object.keys(req.body || {}).forEach((k) => {
    if (k in s) s[k] = req.body[k];
  });
  db.save();
  res.json(s);
});

// 修改密码
router.put('/api/password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const admin = db.read().admins.find((a) => a.id === req.admin.id);
  if (!bcrypt.compareSync(oldPassword || '', admin.passwordHash)) {
    return res.status(400).json({ error: '原密码错误' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' });
  }
  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  db.save();
  res.json({ ok: true });
});

module.exports = router;
