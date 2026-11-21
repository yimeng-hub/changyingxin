#!/usr/bin/env bash
# 一键发布脚本（在服务器上执行）
# 用法：bash deploy/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/changyingxin}"
BRANCH="${BRANCH:-main}"
PM2_NAME="changyingxin"

cd "$APP_DIR"

echo "==> 1/5 拉取最新代码 ($BRANCH)"
git fetch --all --prune
git reset --hard "origin/$BRANCH"

echo "==> 2/5 安装生产依赖"
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

echo "==> 3/5 确保数据目录存在"
mkdir -p data public/uploads/products public/uploads/slides public/uploads/categories public/uploads/promotions
# 首次部署且没有数据时，自动初始化种子数据
if [ ! -f data/db.json ]; then
  echo "    未发现 data/db.json，执行种子初始化"
  npm run seed
fi

echo "==> 4/5 重启进程"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.js --env production
else
  pm2 start deploy/ecosystem.config.js --env production
fi
pm2 save

echo "==> 5/5 健康检查"
sleep 2
CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || true)
if [ "$CODE" = "200" ]; then
  echo "✅ 发布成功：http://127.0.0.1:3000/ 返回 200"
  pm2 status
else
  echo "❌ 健康检查失败（HTTP $CODE），请查看日志：pm2 logs $PM2_NAME --lines 50"
  exit 1
fi
