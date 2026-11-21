FROM node:20-alpine

WORKDIR /app

# 先装依赖（利用层缓存）
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# 再拷贝源码
COPY . .

# 初始化种子（若已有 data/db.json 则不覆盖）
RUN node src/gen-placeholders.js || true

ENV PORT=3000
ENV SESSION_SECRET=change-me-in-production
EXPOSE 3000

# 数据目录与上传目录请挂载为卷，保证重启不丢数据
CMD ["node", "server.js"]
