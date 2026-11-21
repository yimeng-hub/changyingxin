'use strict';
/**
 * 图片上传 —— 云端存储可插拔抽象
 * ------------------------------------------------------------------
 * 通过环境变量选择存储后端：
 *   STORAGE_DRIVER=local （默认）本地 public/uploads（与静态资源同源，零成本）
 *   STORAGE_DRIVER=cos   腾讯云 COS（S3 兼容对象存储）
 *
 * 无论哪种后端，single() 处理结束后都会给 req.file.url 赋值为「可公网访问的 URL」，
 * 路由层统一使用 req.file.url，无需关心底层是本地还是云端。
 *
 * COS 所需环境变量：
 *   COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION
 *   UPLOAD_PUBLIC_BASE（Bucket 公网域名或自定义 CDN 域名，如 https://cdn.example.com）
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const PUBLIC_BASE = (process.env.UPLOAD_PUBLIC_BASE || '').replace(/\/$/, '');

let cos = null;
if (DRIVER === 'cos') {
  try {
    const COS = require('cos-nodejs-sdk-v5');
    cos = new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });
    console.log('[storage] 已启用腾讯云 COS 存储驱动');
  } catch (e) {
    console.error('[storage] 加载 cos-nodejs-sdk-v5 失败，请先执行 npm install cos-nodejs-sdk-v5:', e.message);
    process.exit(1);
  }
}

const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    // 通过路由把目标子目录挂在 req.uploadDir 上
    const sub = (req.uploadDir || 'misc').replace(/[^a-z0-9_-]/gi, '');
    const dir = path.join(UPLOAD_ROOT, sub);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = (path.extname(file.originalname) || '').toLowerCase().slice(0, 10);
    const name = crypto.randomBytes(10).toString('hex') + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter(req, file, cb) {
    if (/^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片文件 (jpg/png/gif/webp/svg)'));
  },
});

/** 单图上传，结束后 req.file.url 即为可访问地址 */
function single(field, subDir) {
  const m = upload.single(field);
  return (req, res, next) => {
    req.uploadDir = subDir;
    m(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return next();

      if (DRIVER === 'cos' && cos) {
        try {
          const key = `${subDir}/${req.file.filename}`;
          const body = fs.readFileSync(req.file.path);
          await cos.putObject({
            Bucket: process.env.COS_BUCKET,
            Region: process.env.COS_REGION,
            Key: key,
            Body: body,
            ContentType: req.file.mimetype,
          });
          fs.unlinkSync(req.file.path); // 删除本地临时文件
          req.file.url = `${PUBLIC_BASE}/${key}`;
        } catch (e) {
          return res.status(500).json({ error: '上传到云端存储失败: ' + e.message });
        }
      } else {
        req.file.url = `/uploads/${subDir}/${req.file.filename}`;
      }
      next();
    });
  };
}

module.exports = { upload, single, DRIVER };
