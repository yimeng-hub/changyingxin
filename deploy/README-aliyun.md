# 阿里云上线手册（北京长盈鑫科技电商站）

> 目标：把这个 Node.js 站点部署到阿里云，用你自己的域名对外访问。
> 全程约 **40–60 分钟**（不含备案等待时间）。

---

## 0. 先明确三件事（决定方案）

| 问题 | 说明 |
|---|---|
| **服务器在哪个地域** | 选**中国大陆**（北京/杭州/上海…）→ 域名必须 **ICP 备案**才能用 80/443 访问；选**中国香港 / 新加坡** → **无需备案**，但国内访问稍慢 |
| **数据存哪** | 首版建议：数据放在服务器磁盘（`data/db.json` + `public/uploads/`），每天定时备份。量大了再切 RDS + OSS（代码已支持，见第 8 节） |
| **怎么装** | 推荐 **轻量应用服务器**（简单便宜，自带防火墙面板）或 **ECS 云服务器**（更灵活）。配置 **2 核 2G、40G 系统盘、带宽 3M+** 足够起步 |

---

## 1. 买服务器 + 开端口

1. 阿里云控制台 → **轻量应用服务器** 或 **云服务器 ECS** → 创建实例
   - 镜像：**Ubuntu 22.04 LTS**（推荐）或 Alibaba Cloud Linux 3
   - 记住：**公网 IP**、root 密码（或绑定密钥）
2. 防火墙 / 安全组放行端口：**22（SSH）、80（HTTP）、443（HTTPS）**
   - 轻量：控制台 → 防火墙 → 添加规则
   - ECS：安全组 → 入方向 → 添加 80/443

---

## 2. 域名解析（DNS）

在阿里云 **云解析 DNS** 里给你的域名加两条 A 记录：

| 记录类型 | 主机记录 | 记录值 |
|---|---|---|
| A | `@` | 服务器公网 IP |
| A | `www` | 服务器公网 IP |

生效时间通常 1–10 分钟。验证：

```bash
ping www.你的域名.com     # 应解析到你的公网 IP
```

---

## 3. ICP 备案（仅中国大陆服务器需要）

- 阿里云控制台 → **ICP 备案** → 按指引提交（企业备案：营业执照、法人身份证、网站负责人信息、幕布拍照/核验）
- 时长一般 **7–20 个工作日**
- **未备案时**：域名用 80 端口访问会被拦截；可先用 `http://公网IP:3000` 自测（不建议长期开放 3000，见第 6 节）

> 不想等备案 → 服务器选**中国香港**地域，可立即用域名上线。

---

## 4. 服务器初始化（登录后执行）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装常用工具
sudo apt install -y git curl nginx ufw

# 安装 Node.js 22（NodeSource 官方源）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# 安装 PM2（进程守护 + 开机自启）
sudo npm install -g pm2

# 防火墙（若用 ufw）
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 5. 部署代码

```bash
# 5.1 拉代码（公开仓库，直接 clone；私有仓库需先在服务器配 SSH key 或使用 token）
sudo mkdir -p /var/www && sudo chown -R $USER:$USER /var/www
git clone https://github.com/yimeng-hub/changyingxin.git /var/www/changyingxin
cd /var/www/changyingxin

# 5.2 配置环境变量
cp .env.example .env
nano .env
```

`.env` 至少要改这几项：

```ini
PORT=3000
SITE_URL=https://www.你的域名.com        # 用于 sitemap / robots / canonical
SESSION_SECRET=用 openssl rand -hex 32 生成的一长串
NODE_ENV=production
# 数据库/存储先留空 = 本地文件
DB_DRIVER=json
STORAGE_DRIVER=local
```

```bash
# 生成随机密钥可执行：
openssl rand -hex 32

# 5.3 安装依赖 + 初始化数据
npm ci --omit=dev
npm run seed            # 首次：初始化分类/品牌/演示商品/管理员
npm run import:smc      # 导入 SMC 商品（可选，抓取前 3 页）

# 5.4 用 PM2 启动
sudo mkdir -p /var/log/changyingxin && sudo chown -R $USER:$USER /var/log/changyingxin
pm2 start deploy/ecosystem.config.js --env production
pm2 save
pm2 startup             # 按提示复制执行它输出的那行命令，实现开机自启
```

自测：

```bash
curl -I http://127.0.0.1:3000      # 应返回 HTTP/1.1 200
```

---

## 6. Nginx 反向代理（用域名访问 80/443）

```bash
sudo cp deploy/nginx.conf /etc/nginx/conf.d/changyingxin.conf
sudo nano /etc/nginx/conf.d/changyingxin.conf   # 改 server_name 为你的域名
sudo nginx -t                                   # 语法检查
sudo systemctl reload nginx
```

浏览器访问 `http://你的域名.com` 应该能看到站点。

> 此时 Node 只监听本机 3000，外网只能通过 Nginx 进来，更安全。
> 首次上线后建议在阿里云安全组**删除 3000 端口的公网放行**。

---

## 7. 开启 HTTPS

**方式 A：阿里云免费证书（推荐，国内速度稳）**

1. 阿里云控制台 → **数字证书管理服务** → 免费证书 → 申请（绑定你的域名，DNS 验证）
2. 下载 **Nginx 格式**证书，上传到服务器：

```bash
sudo mkdir -p /etc/nginx/ssl
# 把 .pem 和 .key 上传到 /etc/nginx/ssl/
```

3. 打开 `deploy/nginx.conf` 中的 HTTPS 段（文件里有完整模板），把 80 端口改成 301 跳转，然后：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**方式 B：Let's Encrypt（自动续期）**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com
```

完成后把 `.env` 里的 `SITE_URL` 改成 `https://...`，并 `pm2 restart changyingxin`。

---

## 8. 数据备份（务必做）

首版数据都在服务器本地，**丢了就没了**，建议每天打包上传到阿里云 OSS：

```bash
# 安装 ossutil（阿里云对象存储命令行）
# 参考：https://help.aliyun.com/zh/oss/developer-reference/ossutil

# 备份脚本 /home/你的用户/backup.sh
tar -czf /tmp/cyx-$(date +%F).tar.gz \
  -C /var/www/changyingxin data public/uploads
ossutil cp /tmp/cyx-$(date +%F).tar.gz oss://你的bucket/backup/ -f
rm -f /tmp/cyx-$(date +%F).tar.gz
```

```bash
chmod +x ~/backup.sh
crontab -e      # 加一行：每天 3:00 备份
0 3 * * * /home/你的用户/backup.sh
```

---

## 9. 后续更新代码（每次改完）

```bash
ssh 你的服务器
cd /var/www/changyingxin
bash deploy/deploy.sh          # 拉代码 + 装依赖 + 重启 + 健康检查
```

---

## 10. 上线检查清单

- [ ] 后台默认密码 `admin123` 已修改（`/admin` → 修改密码）
- [ ] `.env` 里 `SESSION_SECRET` 已改为随机长串
- [ ] `SITE_URL` 已填真实域名，`robots.txt` / `sitemap.xml` 输出的是正式域名
- [ ] 联系方式（电话 / 邮箱）已在后台「站点设置」改成真值
- [ ] 图片能正常上传（后台传一张测试图，确认 `/uploads/...` 可访问）
- [ ] 留言能提交且后台可见
- [ ] 手机浏览器打开排版正常
- [ ] 安全组已关闭 3000 端口公网访问
- [ ] 备份定时任务已生效
- [ ] 提交 sitemap 到百度搜索资源平台 / Google Search Console

---

## 11. 进阶：改成「云数据库 + 云存储」（访问量上来后）

代码已内置可插拔驱动，**改环境变量即可，无需改业务代码**：

```ini
# 阿里云 RDS PostgreSQL
DB_DRIVER=postgres
PG_CONNECTION_STRING=postgres://用户名:密码@rds地址:5432/库名
PG_SSL=true
```

> 首次切换时，RDS 里是空库，程序会自动用本地 `data/db.json` 初始化。

图片存 OSS 目前需要补一个驱动（现有代码支持本地 + 腾讯云 COS）。需要的话我可以加 `STORAGE_DRIVER=oss`，对接阿里云 OSS。

---

## 常见问题

| 现象 | 排查 |
|---|---|
| 域名打不开、IP 能开 | DNS 未生效 / 备案未通过 / 安全组没放 80 |
| 502 Bad Gateway | Node 没起来：`pm2 status`、`pm2 logs changyingxin` |
| 页面样式错乱 | Nginx 静态资源路径没配对，确认项目在 `/var/www/changyingxin` |
| 后台登录后立刻掉线 | `SITE_URL` 用 https 但实际访问 http，或 `SESSION_SECRET` 为空 |
| 上传图片 413 | Nginx `client_max_body_size` 调大 |
| 端口冲突 | 本项目已支持端口自动顺延，日志会打印实际端口 |
