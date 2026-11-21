'use strict';
// ---- 轻量 .env 加载（零依赖，必须在读取 process.env 之前执行）----
(function loadEnv() {
  const fs = require('fs');
  const p = require('path');
  const file = p.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) return;
    if (process.env[m[1]] !== undefined) return;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
})();

const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

// 解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 会话（管理员登录）
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'changyingxin-ecommerce-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 12, httpOnly: true, sameSite: 'lax' },
  })
);

// 静态资源（含上传的图片）
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/', require('./src/routes/public'));
app.use('/admin', require('./src/routes/admin'));

// 404
app.use((req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'zh';
  const d = db.read();
  res.status(404).render('404', {
    lang,
    t: require('./src/i18n').dict[lang],
    settings: d.settings,
    categories: d.categories,
    brands: d.brands,
    siteBase: (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, ''),
    pagePath: req.originalUrl || '/',
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).send('服务器错误');
});

// 启动监听：端口被占用时自动顺延（最多尝试 10 个），避免直接崩溃
function startServer(port, attempt = 0) {
  const server = app.listen(port);

  server.on('listening', () => {
    const actual = server.address().port;
    console.log(`\n  北京长盈鑫科技 · 电商站点已启动`);
    console.log(`  前台首页:  http://localhost:${actual}/`);
    console.log(`  后台管理:  http://localhost:${actual}/admin   (admin / admin123)`);
    if (actual !== Number(PORT)) {
      console.log(`  提示: 端口 ${PORT} 已被占用，已自动改用 ${actual}`);
    }
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 10) {
      const next = Number(port) + 1;
      console.warn(`[warn] 端口 ${port} 已被占用，尝试 ${next} …`);
      return startServer(next, attempt + 1);
    }
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[error] 端口 ${port} 及后续端口均被占用，请先关闭占用进程，或用 PORT=4000 npm start 指定端口。`);
    } else {
      console.error('[error] 服务启动失败:', err);
    }
    process.exit(1);
  });
}

db.init()
  .then(() => startServer(Number(PORT)))
  .catch((e) => {
    console.error('[db] 初始化失败，服务未启动:', e);
    process.exit(1);
  });
