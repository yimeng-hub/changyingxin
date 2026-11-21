'use strict';
/**
 * PM2 进程配置
 * 用法：
 *   pm2 start deploy/ecosystem.config.js --env production
 *   pm2 save && pm2 startup
 *
 * 注意：本项目默认使用 JSON 文件数据库（data/db.json），
 * 多进程会同时写同一文件导致数据互相覆盖，因此固定 instances=1、fork 模式。
 * 若切换到 PostgreSQL（DB_DRIVER=postgres），可改为 cluster 模式并调大 instances。
 */
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'changyingxin',
      script: 'server.js',
      cwd: path.join(__dirname, '..'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '/var/log/changyingxin/out.log',
      error_file: '/var/log/changyingxin/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
