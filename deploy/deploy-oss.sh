#!/usr/bin/env bash
# 上传静态站到阿里云 OSS 并设置正确的缓存策略
# 依赖：ossutil（阿里云官方命令行）
#   安装：https://help.aliyun.com/zh/oss/developer-reference/ossutil
#   macOS：brew install ossutil   （或下载二进制放到 /usr/local/bin/ossutil）
#
# 用法：
#   BUCKET=tecshin-web bash deploy/deploy-oss.sh
#   BUCKET=tecshin-web CDN_PURGE=1 bash deploy/deploy-oss.sh    # 顺便刷新 CDN（需先配好 CDN 域名）
#
# 首次使用前先配置密钥：
#   ossutil config
#     endpoint = oss-cn-hangzhou.aliyuncs.com
#     accessKeyID / accessKeySecret = 阿里云 RAM 用户的 AK
set -euo pipefail

BUCKET="${BUCKET:?请指定 BUCKET，例如 BUCKET=tecshin-web bash deploy/deploy-oss.sh}"
ENDPOINT="${ENDPOINT:-oss-cn-hangzhou.aliyuncs.com}"
DIST="$(cd "$(dirname "$0")/.." && pwd)/dist"
CDN_DOMAIN="${CDN_DOMAIN:-}"

if ! command -v ossutil >/dev/null 2>&1; then
  echo "❌ 未找到 ossutil，请先安装：https://help.aliyun.com/zh/oss/developer-reference/ossutil"
  exit 1
fi

if [ ! -f "$DIST/index.html" ]; then
  echo "❌ 未找到 dist/index.html，请先执行：npm run build:static"
  exit 1
fi

echo "==> 上传静态文件到 oss://$BUCKET/"
# 先传静态资源：长缓存（文件名不含 hash，所以用 7 天，兼顾更新）
ossutil cp -r "$DIST/css/"     "oss://$BUCKET/css/"     -f --meta "Cache-Control:public,max-age=604800" --endpoint "$ENDPOINT"
ossutil cp -r "$DIST/js/"      "oss://$BUCKET/js/"      -f --meta "Cache-Control:public,max-age=604800" --endpoint "$ENDPOINT"
ossutil cp -r "$DIST/uploads/" "oss://$BUCKET/uploads/" -f --meta "Cache-Control:public,max-age=2592000" --endpoint "$ENDPOINT"

# HTML 与 SEO 文件：短缓存，改完能马上生效
ossutil cp -r "$DIST/" "oss://$BUCKET/" -f --update \
  --exclude "css/*" --exclude "js/*" --exclude "uploads/*" \
  --meta "Cache-Control:public,max-age=600" --endpoint "$ENDPOINT"

echo "==> 校验"
for f in index.html about.html sitemap.xml robots.txt 404.html en/index.html; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://$BUCKET.$ENDPOINT/$f" || true)
  printf "  %-18s HTTP %s\n" "$f" "$code"
done

if [ "${CDN_PURGE:-0}" = "1" ] && [ -n "$CDN_DOMAIN" ]; then
  echo "==> 刷新 CDN：$CDN_DOMAIN"
  ossutil refresh-cdn --cdn-domain "$CDN_DOMAIN" --path "/" -r 2>/dev/null || \
    echo "  （ossutil 版本不支持 refresh-cdn，请到 CDN 控制台手动刷新）"
fi

echo "✅ 完成。若已绑定自定义域名，访问 https://tecshin.com/"
