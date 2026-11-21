'use strict';
/**
 * 生成 SVG 占位图（轮播 / 分类 / 商品 / 促销）。
 * 仅用于演示，后台上传真实图片后会自动覆盖。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public', 'uploads');

function write(rel, svg) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, svg);
}

function slide(title, sub, c1, c2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="1600" height="600" fill="url(#g)"/>
  <g fill="#ffffff" opacity="0.12">
    <circle cx="1300" cy="120" r="220"/><circle cx="1450" cy="480" r="160"/><rect x="1180" y="360" width="320" height="320" rx="40" transform="rotate(20 1340 520)"/>
  </g>
  <text x="120" y="270" font-family="Arial,Helvetica,sans-serif" font-size="72" font-weight="800" fill="#ffffff">${title}</text>
  <text x="122" y="350" font-family="Arial,Helvetica,sans-serif" font-size="40" fill="#ffffff" opacity="0.92">${sub}</text>
  <rect x="122" y="400" width="240" height="64" rx="32" fill="#ffffff"/>
  <text x="242" y="442" font-family="Arial" font-size="30" font-weight="700" fill="${c1}" text-anchor="middle">了解更多 →</text>
</svg>`;
}

function category(icon, name, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}"/>
  <rect width="400" height="400" fill="#000" opacity="0.04"/>
  <text x="200" y="180" font-size="120" text-anchor="middle">${icon}</text>
  <text x="200" y="300" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle">${name}</text>
</svg>`;
}

function product(label, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#f5f6f8"/>
  <rect x="60" y="60" width="480" height="480" rx="28" fill="#ffffff" stroke="#ececf0"/>
  <rect x="60" y="60" width="480" height="480" rx="28" fill="${color}" opacity="0.06"/>
  <g transform="translate(300 270)">
    <rect x="-150" y="-110" width="300" height="200" rx="18" fill="${color}" opacity="0.85"/>
    <rect x="-90" y="-60" width="180" height="100" rx="10" fill="#ffffff" opacity="0.9"/>
    <circle cx="0" cy="0" r="34" fill="#ffffff" opacity="0.95"/>
    <rect x="-150" y="110" width="300" height="22" rx="11" fill="${color}" opacity="0.4"/>
  </g>
  <text x="300" y="500" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="#333" text-anchor="middle">${label}</text>
</svg>`;
}

function promo(title, discount, c1, c2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
  <defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="800" height="400" rx="24" fill="url(#p)"/>
  <text x="60" y="170" font-family="Arial,Helvetica,sans-serif" font-size="52" font-weight="800" fill="#fff">${title}</text>
  <text x="62" y="240" font-family="Arial" font-size="34" fill="#fff" opacity="0.92">${discount}</text>
  <circle cx="660" cy="200" r="130" fill="#fff" opacity="0.14"/>
</svg>`;
}

// 轮播
write('slides/slide1.svg', slide('工业自动化整体方案', 'PLC · 机器人 · 传感测控', '#ff6a00', '#ff4742'));
write('slides/slide2.svg', slide('电子元器件现货直发', '全球仓库 7 天交付', '#2b7de9', '#0c8599'));
write('slides/slide3.svg', slide('技术服务 · 技术开发', '资深工程师团队', '#7b5cff', '#495057'));

// 分类
const cats = [
  ['🛠️', '技术服务', '#ff6a00'], ['🔌', '电子元器件', '#ff4742'], ['⚙️', '自动控制系统', '#2b7de9'],
  ['💻', '工业计算机', '#7b5cff'], ['🤖', '工业机器人', '#00b386'], ['🏭', '机械设备', '#e08600'],
  ['📟', '仪器仪表', '#d6336c'], ['🔧', '液气密元件', '#0c8599'], ['📱', '电子产品', '#5c7cfa'],
  ['💾', '软件', '#495057'], ['🛢️', '气压液压', '#9c6644'],
];
cats.forEach((c, i) => write(`categories/cat${i + 1}.svg`, category(c[0], c[1], c[2])));

// 商品
const prods = [
  ['PLC 控制器', '#ff6a00'], ['机器人臂', '#00b386'], ['伺服电机', '#ff4742'], ['温度传感器', '#0c8599'],
  ['变频器', '#2b7de9'], ['加工中心', '#e08600'], ['数字万用表', '#5c7cfa'], ['液压缸', '#9c6644'],
  ['气动阀', '#0c8599'], ['触控一体机', '#7b5cff'], ['边缘网关', '#495057'], ['技术服务', '#ff6a00'],
];
prods.forEach((p, i) => write(`products/p${i + 1}.svg`, product(p[0], p[1])));

// 促销
write('promotions/promo1.svg', promo('新客首单立减', '5% OFF', '#ff6a00', '#ff4742'));
write('promotions/promo2.svg', promo('批量采购特惠', 'UP TO 15%', '#2b7de9', '#0c8599'));
write('promotions/promo3.svg', promo('技术服务套餐', 'FREE QUOTE', '#7b5cff', '#495057'));

console.log('[gen-placeholders] 占位图已生成到 public/uploads/');
