# tecshin.com 上线清单（你照着点，约 10 分钟）

产物已就绪：`/Users/fanxiaoxu/Documents/project/changyingxin/dist`（190 个文件 / 3.1MB）

---

## ① 创建 Bucket（约 1 分钟）

阿里云控制台 → **对象存储 OSS** → Bucket 列表 → **创建 Bucket**

| 项目 | 填什么 |
|---|---|
| Bucket 名称 | `tecshin-web`（记下来） |
| 地域 | **华东1（杭州）** |
| 读写权限 | **公共读** |
| 其余 | 默认，直接创建 |

---

## ② 开启静态网站托管（约 30 秒）

进入 Bucket → 左侧 **数据管理 → 静态页面**

- 默认首页：`index.html`
- 默认 404 页：`404.html`
- 子目录首页：`index.html`（若显示此项）
- 保存

---

## ③ 上传文件（约 2 分钟）

Bucket → **文件管理 → 文件列表 → 上传文件**

- 把 **`dist` 文件夹里面的所有内容**（`index.html`、`en`、`product`、`css`、`js`、`uploads`、`sitemap.xml`、`robots.txt`、`404.html`、`favicon.svg`）全选拖进去
- ⚠️ 不要上传 `dist` 这个文件夹本身，要上传它里面的东西（保证 Bucket 根目录能直接看到 `index.html`）

---

## ④ 绑定域名（约 2 分钟）

Bucket → 左侧 **数据传输 → 域名管理 → 绑定域名**

依次绑定两个：
- `tecshin.com`
- `www.tecshin.com`

绑定成功后，页面会给你一个 **CNAME 值**（形如 `tecshin-web.oss-cn-hangzhou.aliyuncs.com`），**复制下来**。

---

## ⑤ 配置 DNS（约 1 分钟）

阿里云控制台 → **云解析 DNS** → `tecshin.com` → 解析设置 → 添加记录

| 记录类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | `@` | ④ 里复制的 CNAME |
| CNAME | `www` | 同上 |

> 如果原来有 A 记录/CNAME 占用 `@` 或 `www`，先删掉再加。

---

## ⑥ 开启 HTTPS（约 3 分钟）

Bucket → 域名管理 → 对应域名 → **证书管理**

- 没有证书 → 点「**免费证书**」跳转数字证书管理服务申请（选 DNS 验证，自动签发）
- 有证书 → 直接上传
- 绑定后开启 **强制 HTTPS 跳转**

---

## ⑦ 告诉我「好了」

我会立刻帮你验证这些（不用你做）：
- `https://tecshin.com/`、`https://tecshin.com/en/index.html` 是否 200
- 商品详情页、图片、CSS 是否正常
- `sitemap.xml`、`robots.txt` 是否为正式域名
- 语言切换、404 页面是否正常

有问题我直接告诉你在哪一步改。

---

## 附：以后更新内容（不需要我）

```bash
cd /Users/fanxiaoxu/Documents/project/changyingxin
npm run build:static        # 重新生成 dist
```
然后把 `dist` 里的文件重新拖到 OSS 覆盖即可（或在 OSS 里删掉旧文件再传）。

配置好 ossutil 后可以一条命令：
```bash
BUCKET=tecshin-web bash deploy/deploy-oss.sh
```
