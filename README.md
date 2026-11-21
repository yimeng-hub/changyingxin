# 北京长盈鑫科技有限公司 · 国际贸易电商网站

一个面向国际贸易的现代化电商站点（全栈），具备：响应式首页（轮播 / 分类 / 热门商品 / 促销 / 留言）、用户登录、后台内容管理（图片/文字可改，无需改代码）、SEO 优化，以及**云就绪**的数据与存储抽象层。

> 参考 AliExpress 简约现代风格：橙红主色 `#ff4742` + 橙色 `#ff6a00`，白底卡片式排版，电脑 / 手机自适应。

---

## 一、需求对照

| 需求 | 实现 |
|------|------|
| 轮播图 | 首页自动轮播 + 左右切换 + 圆点，后台可增删改 |
| 商品分类 | 11 个分类（覆盖营业执照全部经营范围），后台可管理 |
| 热门商品展示 | 卡片式商品墙，支持搜索 / 分类筛选 / 询盘 |
| 促销活动区域 | 促销卡片区，后台可配置折扣文案与 Banner |
| 支持用户登录 | 后台管理员登录（session 鉴权），前台「我的账户」入口 |
| 商品数据云端存储 | 数据层抽象（`src/db.js`），默认本地 JSON，可无缝切换云数据库 |
| 商品图片云端存储 | 存储抽象（`src/upload.js`），默认本地 `/uploads`，可切换 COS/OSS |
| 发布上线 | `node server.js` 一键启动；支持 Docker / 云主机 / CloudBase 等 |
| 响应式（电脑+手机） | 全站 Flex/Grid + 媒体查询，移动端自适应 |
| 留言表单（后台可见） | 前台留言 → 后台「留言管理」查看、标记已读、删除 |
| 图片文字后台可改 | 后台仪表盘可视化编辑全部内容 |
| SEO 友好 | SSR 首页 + 商品详情页、`sitemap.xml`、`robots.txt`、OG/JSON-LD、中英文双 URL |
| 用户留存 | 中英文切换、询盘引导、相关推荐、促销钩子、邮件/电话/WhatsApp 触达 |

---

## 二、本地运行

```bash
# 1. 安装依赖
npm install

# 2. 初始化种子数据（仅首次，生成公司信息/分类/商品/管理员）
npm run seed
npm run gen-placeholders   # 生成演示用 SVG 占位图（也可跳过，直接用真实图）

# 3. 启动
npm start                  # 默认 http://localhost:3000
```

- 前台首页：<http://localhost:3000/>
- 后台管理：<http://localhost:3000/admin>　（默认账号 `admin` / `admin123`，**请登录后立即修改密码**）

---

## 三、目录结构

```
.
├── server.js                 # 入口：会话 / 视图引擎 / 静态资源 / 路由
├── src/
│   ├── db.js                 # ★ 数据层抽象（云就绪，默认 JSON 文件）
│   ├── i18n.js               # 中英文界面文案 + 字段选择器
│   ├── upload.js             # ★ 图片上传抽象（云就绪，默认本地）
│   ├── seed.js               # 种子数据（公司/分类/商品/轮播/促销/管理员）
│   ├── gen-placeholders.js   # 生成 SVG 占位图
│   ├── middleware/auth.js    # 后台登录鉴权
│   └── routes/
│       ├── public.js         # 首页SSR / 详情页 / 公开API / 留言 / SEO
│       └── admin.js          # 登录 / 后台CRUD / 设置 / 密码
├── views/                    # EJS 模板（SSR，利于 SEO）
│   ├── index.ejs  about.ejs  product.ejs  404.ejs
│   ├── partials/ head | header | footer
│   └── admin/   login.ejs  dashboard.ejs
├── public/
│   ├── css/   style.css（前台）  admin.css（后台）
│   ├── js/    main.js（前台交互） admin.js（后台交互）
│   └── uploads/               # 上传的图片（云端存储抽象目录）
└── data/db.json              # 运行时数据（生产环境建议用云数据库）
```

---

## 四、上线部署（一键）

本项目是标准 Node.js 应用，已内置数据 / 存储云抽象，任选其一即可上线：

### 方案 A：Docker Compose（推荐，自带云端数据库选项）
已提供 `docker-compose.yml`。默认仅起应用（本地 JSON 数据）；把 `.env` 中 `DB_DRIVER=postgres` 即自动启用内置 PostgreSQL 作为云端数据库，数据持久化在卷中，开箱即用。
```bash
cp .env.example .env          # 按需修改 SESSION_SECRET 等
docker compose up -d          # 应用访问 http://<服务器IP>:3000
```

### 方案 B：Docker 单容器
```bash
docker build -t changyingxin-shop .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data -v $(pwd)/public/uploads:/app/public/uploads changyingxin-shop
```

### 方案 C：云主机 / CloudBase
上传源码（含 package.json、Dockerfile），`npm install && npm start` 即可。CloudBase 选「Node 应用」运行环境。

### 方案 D：Render / Railway / Fly.io 等 PaaS
连接 Git 仓库，构建 `npm install`，启动 `npm start`。

> 上线前必做：① 修改 `SESSION_SECRET`；② 修改后台管理员密码；③ 用 `DB_DRIVER=postgres` + `STORAGE_DRIVER=cos` 启用云端；④ 配置持久化卷（`data/` 与 `public/uploads/`）。

---

## 五、切换到「真正的云端数据库 / 云端存储」

代码已做成**可插拔驱动**，无需改动任何业务路由，仅配置环境变量（见 `.env.example`）：

### 云端数据库（商品数据）
- 默认 `DB_DRIVER=json`：本地 `data/db.json`。
- 改为 `DB_DRIVER=postgres` 并填 `PG_CONNECTION_STRING`（腾讯云 TencentDB for PostgreSQL / 任意 PostgreSQL）：
  - 启动时自动从云端加载到内存，运行时改动异步写回云端（jsonb 整存，结构 100% 兼容）。
  - 云端为空时用本地 `data/db.json` 自动初始化，无需手工迁移。
  - 实现见 `src/db.js`（同步 `read/save` + 异步 `init/flush`，路由层零改动）。

### 云端图片存储（商品图片）
- 默认 `STORAGE_DRIVER=local`：本地 `public/uploads`。
- 改为 `STORAGE_DRIVER=cos` 并填 `COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION / UPLOAD_PUBLIC_BASE`（腾讯云 COS，S3 兼容）：
  - 后台上传图片自动存入 COS，`req.file.url` 返回 COS 公网/自定义域名地址，前台直接展示。
  - 实现见 `src/upload.js`（统一 `req.file.url`，前台 / 后台零改动）。

> 接入其它云（阿里云 OSS、MongoDB 等）：在 `src/db.js` / `src/upload.js` 增加对应 driver 分支即可，接口不变。

---

## 六、安全与提示

- 默认管理员密码 `admin123` 属于演示账号，**上线前请务必修改**（后台「修改密码」）。
- `SESSION_SECRET` 请通过环境变量设置，避免会话被伪造。
- 上传限制 8MB、仅允许图片类型；生产环境建议在反向代理（Nginx）层再加一层限速与 WAF。
- 站点已内置 SEO 基础（sitemap/robots/结构化数据），上线后建议提交 sitemap 至 Google/Bing 站长平台，并补充 `og:image` 社交分享图以提升点击率。
