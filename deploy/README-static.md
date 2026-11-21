# 纯静态版上线手册（tecshin.com · 阿里云）

> 当前版本：**静态站**。登录、留言提交、后台管理已移除，商品/分类/详情/中英文/询价（电话+邮件）全部保留。
> 没有服务器也能跑，一年成本可以做到 **几元到几十元**。

---

## 一、先构建

```bash
cd /Users/fanxiaoxu/Documents/project/changyingxin
npm run build:static          # 输出到 dist/
```

产物结构：

```
dist/
├── index.html                 中文首页
├── about.html                 中文关于页
├── product/<id>.html          中文商品详情（56 个）
├── en/                        英文版（结构同上）
├── css/ js/ uploads/          静态资源与商品图
├── sitemap.xml  robots.txt
└── 404.html
```

> 链接全部是 `.html` 形式，**不需要任何 rewrite / 伪静态规则**。
> 域名通过环境变量控制（默认 `https://tecshin.com`）：
> `SITE_URL=https://tecshin.com npm run build:static`

---

## 二、三条上线路线（按推荐度排序）

### 路线 A：阿里云 OSS 静态网站托管 + CDN（阿里云生态内，推荐）

**适合**：域名已备案、想全部放在阿里云。

| 步骤 | 操作 |
|---|---|
| 1. 建 Bucket | OSS 控制台 → 创建 Bucket：地域选**华东1（杭州）**，读写权限 **公共读** |
| 2. 开静态托管 | Bucket → 数据管理 → **静态页面**：默认首页 `index.html`，默认 404 页 `404.html`，子目录首页 `index.html` |
| 3. 传文件 | 把 `dist/` **里面的内容**（不是 dist 文件夹本身）全部上传到 Bucket 根目录 |
| 4. 绑域名 | Bucket → 域名管理 → 绑定 `tecshin.com` 和 `www.tecshin.com` |
| 5. DNS 解析 | 阿里云云解析加 `CNAME`：`@` 和 `www` → OSS 给的 CNAME 地址 |
| 6. HTTPS | 域名管理里上传/申请**免费 SSL 证书**，开启强制 HTTPS |
| 7. 加速（可选） | 加 CDN，源站指向该 Bucket，缓存 `.html` 短、`/uploads/` 长 |

> ⚠️ OSS 绑定自定义域名（大陆地域）**要求域名已完成 ICP 备案**。
> 命令上传更省事：`ossutil cp -r dist/ oss://你的bucket/ --update`

**成本**：存储 3MB 几乎为 0，外网流量 ¥0.25–0.5/GB，一年通常 **几十元内**。

---

### 路线 B：EdgeOne Pages（零运维，自动 HTTPS，无需服务器）

**适合**：不想备案 / 想要「连上传都不用」的自动部署。

1. 打开 **EdgeOne Pages** → 新建项目 → 关联 GitHub 仓库 `yimeng-hub/changyingxin`
2. 构建配置：
   - 构建命令：`npm run build:static`
   - 输出目录：`dist`
3. 部署完成后在「自定义域名」里绑定 `tecshin.com`，按提示在阿里云 DNS 加它给的 CNAME
4. 证书自动签发

> 大陆节点加速需备案；用海外/全球节点则**无需备案**，首次上线最快。

---

### 路线 C：Vercel（最快验证，免费）

1. 打开 vercel.com → Import Git Repository → 选 `changyingxin`
2. Framework 选 **Other**，Build Command `npm run build:static`，Output Directory `dist`
3. 部署后 Settings → Domains → 添加 `tecshin.com`
4. 到阿里云 DNS 按 Vercel 提示加记录（通常是 `A @ → 76.76.21.21`、`CNAME www → cname.vercel-dns.com`）

> 无需备案。缺点：国内访问速度不稳定，**外贸站（客户在海外）反而合适**。

---

## 三、DNS 记录怎么填（阿里云云解析）

| 路线 | 记录类型 | 主机记录 | 记录值 |
|---|---|---|---|
| A OSS | CNAME | `@` | 控制台给的 OSS 域名（如 `xxx.oss-cn-hangzhou.aliyuncs.com`） |
| A OSS | CNAME | `www` | 同上 |
| B EdgeOne | CNAME | `@` / `www` | 控制台给的 CNAME |
| C Vercel | A | `@` | `76.76.21.21` |
| C Vercel | CNAME | `www` | `cname.vercel-dns.com` |

> 你的 DNS 是 `dns21/dns22.hichina.com`，就是阿里云云解析，直接在控制台「域名解析」里加记录即可，通常 1–10 分钟生效。

---

## 四、上线前检查

- [ ] `dist/index.html` 打开正常，图片显示（`/uploads/...` 路径已随 dist 一起上传）
- [ ] 点商品卡进入详情页正常
- [ ] 右上角 `EN` 能切到 `/en/`，且英文版链接不再跳回中文
- [ ] `https://tecshin.com/sitemap.xml`、`/robots.txt` 可访问，内容是正式域名
- [ ] 联系方式是真实电话/邮箱（`src/seed.js` 的 settings 或后台改完再构建）
- [ ] 404 页面正常（OSS 需在静态页面设置里指定 `404.html`）
- [ ] 提交 sitemap 到百度搜索资源平台 / Google Search Console

---

## 五、以后怎么更新内容

静态版的代价：**改内容要重新构建上传**（没有后台了）。

```bash
# 1. 改数据（src/seed.js 里的文案/商品，或重新抓取）
npm run import:smc              # 需要新增商品时
# 2. 重新构建
npm run build:static
# 3. 上传
ossutil cp -r dist/ oss://你的bucket/ --update
```

如果以后要恢复「后台可视化改内容 + 留言」，随时可以切回动态版（`npm start` + 服务器部署，见 `deploy/README-aliyun.md`）。

---

## 六、静态版的取舍（务必知情）

| 保留 | 去掉 |
|---|---|
| 首页 / 品牌筛选 / 商品分类 / 热门 / 新品 / 促销 | 后台管理 `/admin` |
| 商品详情页（56 个 × 中英） | 用户登录 |
| 中英文双语（`/` 与 `/en/`） | 在线留言表单（改为邮件/电话直达） |
| SEO：sitemap、robots、canonical、hreflang、JSON-LD | 商品数据实时更新（需重新构建） |
