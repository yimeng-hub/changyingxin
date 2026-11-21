'use strict';
const db = require('../db');

/** 后台管理员登录校验中间件 */
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    const admin = db.read().admins.find((a) => a.id === req.session.adminId);
    if (admin) {
      req.admin = admin;
      return next();
    }
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  return res.redirect('/admin/login');
}

module.exports = { requireAuth };
