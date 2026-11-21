'use strict';
/**
 * 初始化种子数据。
 * 运行：node src/seed.js  （仅在 data/db.json 不存在时写入默认数据）
 * 如需重置，删除 data/db.json 后重新运行。
 */
const db = require('./db');
const bcrypt = require('bcryptjs');

(async () => {
  await db.init();
  const data = db.read();
if (data && data.settings && Object.keys(data.settings).length) {
  console.log('[seed] 数据库已存在，跳过初始化。如需重置请删除 data/db.json。');
  process.exit(0);
}

const now = new Date().toISOString();

const settings = {
  siteName: '北京长盈鑫科技有限公司',
  siteNameEn: 'Beijing Changyingxin Technology Co., Ltd.',
  shortName: '长盈鑫',
  shortNameEn: 'CYX Tech',
  slogan: '工业自动化与电子元器件全球供应商',
  sloganEn: 'Your Global Partner for Industrial Automation & Electronics',
  logoText: 'CYX',
  contactEmail: 'sales@cyx-tech.com',
  contactPhone: '+86-10-8888-8888',
  whatsapp: '+86-138-0000-0000',
  address: '北京市海淀区中关村科技园',
  addressEn: 'Zhongguancun Science Park, Haidian District, Beijing, China',
  seoTitle: '北京长盈鑫科技 | SMC·费斯托·CKD·西门子·基恩士·ABB 等国际品牌工业自动化与电子元器件全球供应',
  seoTitleEn: 'Beijing Changyingxin Tech | Authorized SMC·Festo·CKD·Siemens·ABB Brands — Industrial Automation & Components',
  seoDescription: '长盈鑫科技代理 SMC、费斯托、CKD、西克、西门子、基恩士、欧姆龙、ABB、安川、三菱等国际品牌，提供工业自动化、电子元器件、气动液压、传感测控与技术服务一站式国际贸易。',
  seoDescriptionEn: 'Changyingxin distributes SMC, Festo, CKD, SICK, Siemens, KEYENCE, Omron, ABB, Yaskawa, Mitsubishi and more — industrial automation, electronics, pneumatics, sensing and technical services worldwide.',
  seoKeywords: 'SMC,费斯托,CKD,西克,西门子,基恩士,欧姆龙,ABB,安川,三菱,工业自动化,电子元器件,气动元件,传感器,国际贸易',
  seoKeywordsEn: 'SMC,Festo,CKD,SICK,Siemens,KEYENCE,Omron,ABB,Yaskawa,Mitsubishi,industrial automation,electronic components,pneumatic,sensor,international trade',
  aboutText: '北京长盈鑫科技有限公司专注于工业自动化与电子元器件领域的国际贸易，代理及分销 SMC、费斯托、CKD、西门子、基恩士、ABB、欧姆龙、罗克韦尔等全球一线品牌，产品覆盖气动液压元件、传感器与测控仪表、运动控制与伺服系统、工业机器人及工业软件。我们为装备制造、电子、汽车、能源等行业客户提供选型咨询、批量采购、技术支持和全球物流一站式服务，致力于成为可靠的工业供应链伙伴。',
  aboutTextEn: 'Beijing Changyingxin Technology specializes in international trade of industrial automation and electronic components. We distribute world-leading brands — SMC, Festo, CKD, Siemens, KEYENCE, ABB, Omron, Rockwell and more — covering pneumatics, sensing & instruments, motion control & servo, industrial robots and software. We provide selection consulting, bulk sourcing, engineering support and global logistics for customers in equipment manufacturing, electronics, automotive and energy.',
  currency: 'USD',
  currencySymbol: '$',
  i18n: true,
};

// 轮播图（banner）
const slides = [
  {
    id: db.uid('slide'),
    title: '工业自动化与电子元器件全球供应商',
    titleEn: 'Global Supplier of Industrial Automation & Electronic Components',
    subtitle: '授权代理 SMC · 费斯托 · CKD · 西门子 · 基恩士 · ABB · 欧姆龙 等 26 个国际一线品牌',
    subtitleEn: 'Authorized distributor of 26 brands: SMC · Festo · CKD · Siemens · KEYENCE · ABB · OMRON…',
    image: '/uploads/slides/slide1.svg',
    link: '/?lang=zh#categories',
    sort: 1,
    active: true,
  },
  {
    id: db.uid('slide'),
    title: '电子元器件现货直发',
    titleEn: 'Electronic Components In Stock',
    subtitle: '全球仓库，7 天交付',
    subtitleEn: 'Global warehouses, 7-day delivery',
    image: '/uploads/slides/slide2.svg',
    link: '/?lang=zh#hot',
    sort: 2,
    active: true,
  },
  {
    id: db.uid('slide'),
    title: '技术服务 · 技术开发 · 技术转让',
    titleEn: 'Technical Services & Transfer',
    subtitle: '资深工程师团队，按需定制',
    subtitleEn: 'Senior engineers, customized on demand',
    image: '/uploads/slides/slide3.svg',
    link: '/?lang=zh#contact',
    sort: 3,
    active: true,
  },
];

// 产品类型（二级筛选维度）
const categories = [
  { id: db.uid('cat'), name: '技术服务与咨询', nameEn: 'Technical Services', icon: '🛠️', color: '#ff6a00', image: '/uploads/categories/cat1.svg', sort: 1, active: true },
  { id: db.uid('cat'), name: '电子元器件', nameEn: 'Electronic Components', icon: '🔌', color: '#ff4742', image: '/uploads/categories/cat2.svg', sort: 2, active: true },
  { id: db.uid('cat'), name: '工业自动控制系统', nameEn: 'Automation Control', icon: '⚙️', color: '#2b7de9', image: '/uploads/categories/cat3.svg', sort: 3, active: true },
  { id: db.uid('cat'), name: '工业控制计算机', nameEn: 'Industrial PCs', icon: '💻', color: '#7b5cff', image: '/uploads/categories/cat4.svg', sort: 4, active: true },
  { id: db.uid('cat'), name: '工业机器人', nameEn: 'Industrial Robots', icon: '🤖', color: '#00b386', image: '/uploads/categories/cat5.svg', sort: 5, active: true },
  { id: db.uid('cat'), name: '机械设备', nameEn: 'Machinery', icon: '🏭', color: '#e08600', image: '/uploads/categories/cat6.svg', sort: 6, active: true },
  { id: db.uid('cat'), name: '仪器仪表', nameEn: 'Instruments', icon: '📟', color: '#d6336c', image: '/uploads/categories/cat7.svg', sort: 7, active: true },
  { id: db.uid('cat'), name: '液气密元件及系统', nameEn: 'Fluid & Sealing', icon: '🔧', color: '#0c8599', image: '/uploads/categories/cat8.svg', sort: 8, active: true },
  { id: db.uid('cat'), name: '电子产品', nameEn: 'Electronics', icon: '📱', color: '#5c7cfa', image: '/uploads/categories/cat9.svg', sort: 9, active: true },
  { id: db.uid('cat'), name: '软件', nameEn: 'Software', icon: '💾', color: '#495057', image: '/uploads/categories/cat10.svg', sort: 10, active: true },
  { id: db.uid('cat'), name: '气压/液压动力机械', nameEn: 'Pneumatic/Hydraulic', icon: '🛢️', color: '#9c6644', image: '/uploads/categories/cat11.svg', sort: 11, active: true },
];

// 品牌（一级导航 / 一级 tab）
const brands = [
  { id: db.uid('brand'), code: 'SMC', name: 'SMC', nameEn: 'SMC', color: '#e2231a', sort: 1, active: true },
  { id: db.uid('brand'), code: 'FESTO', name: '费斯托', nameEn: 'Festo', color: '#009ee3', sort: 2, active: true },
  { id: db.uid('brand'), code: 'CKD', name: '喜开理', nameEn: 'CKD', color: '#005bac', sort: 3, active: true },
  { id: db.uid('brand'), code: 'SICK', name: '西克', nameEn: 'SICK', color: '#f39200', sort: 4, active: true },
  { id: db.uid('brand'), code: 'SIEMENS', name: '西门子', nameEn: 'Siemens', color: '#009999', sort: 5, active: true },
  { id: db.uid('brand'), code: 'KEYENCE', name: '基恩士', nameEn: 'KEYENCE', color: '#1c1c1c', sort: 6, active: true },
  { id: db.uid('brand'), code: 'OMRON', name: '欧姆龙', nameEn: 'Omron', color: '#0a4d8c', sort: 7, active: true },
  { id: db.uid('brand'), code: 'BANNER', name: '邦纳', nameEn: 'Banner', color: '#e31837', sort: 8, active: true },
  { id: db.uid('brand'), code: 'BALUFF', name: '巴鲁夫', nameEn: 'Balluff', color: '#ed1c24', sort: 9, active: true },
  { id: db.uid('brand'), code: 'PF', name: '倍加福', nameEn: 'Pepperl+Fuchs', color: '#e2001a', sort: 10, active: true },
  { id: db.uid('brand'), code: 'TURCK', name: '图尔克', nameEn: 'Turck', color: '#002b5c', sort: 11, active: true },
  { id: db.uid('brand'), code: 'PISCO', name: 'PISCO', nameEn: 'PISCO', color: '#0066b3', sort: 12, active: true },
  { id: db.uid('brand'), code: 'KOGANEI', name: '小金井', nameEn: 'Koganei', color: '#009640', sort: 13, active: true },
  { id: db.uid('brand'), code: 'AIRTAC', name: '亚德客', nameEn: 'AirTAC', color: '#005bab', sort: 14, active: true },
  { id: db.uid('brand'), code: 'YASKAWA', name: '安川', nameEn: 'Yaskawa', color: '#009cde', sort: 15, active: true },
  { id: db.uid('brand'), code: 'MITSUBISHI', name: '三菱', nameEn: 'Mitsubishi', color: '#e60012', sort: 16, active: true },
  { id: db.uid('brand'), code: 'INOVANCE', name: '汇川', nameEn: 'Inovance', color: '#0c8bce', sort: 17, active: true },
  { id: db.uid('brand'), code: 'HECHUAN', name: '禾川', nameEn: 'Hcfa', color: '#2b7de9', sort: 18, active: true },
  { id: db.uid('brand'), code: 'KINCO', name: '步科', nameEn: 'Kinco', color: '#f2a900', sort: 19, active: true },
  { id: db.uid('brand'), code: 'INVT', name: '英威腾', nameEn: 'INVT', color: '#1b6fb3', sort: 20, active: true },
  { id: db.uid('brand'), code: 'EMERSON', name: '爱默生', nameEn: 'Emerson', color: '#0072ce', sort: 21, active: true },
  { id: db.uid('brand'), code: 'SWAGELOK', name: '世伟洛克', nameEn: 'Swagelok', color: '#003a70', sort: 22, active: true },
  { id: db.uid('brand'), code: 'ASCO', name: 'ASCO', nameEn: 'ASCO', color: '#c8102e', sort: 23, active: true },
  { id: db.uid('brand'), code: 'LEGRIS', name: '乐可利', nameEn: 'Legris', color: '#00a651', sort: 24, active: true },
  { id: db.uid('brand'), code: 'ABB', name: 'ABB', nameEn: 'ABB', color: '#cc0000', sort: 25, active: true },
  { id: db.uid('brand'), code: 'AB', name: '罗克韦尔AB', nameEn: 'Rockwell AB', color: '#009ddc', sort: 26, active: true },
];

const cat = (i) => categories[i].id;
const bid = (code) => { const b = brands.find((x) => x.code === code); return b ? b.id : ''; };

// 热门商品（含品牌归属）
const products = [
  {
    id: db.uid('prod'), sku: 'CYX-PLC-1200', categoryId: cat(2), brandId: bid('SIEMENS'),
    name: 'CX-1200 系列可编程逻辑控制器', nameEn: 'CX-1200 Series PLC',
    price: 189, originalPrice: 239, rating: 4.8, reviews: 326,
    image: '/uploads/products/p1.svg', gallery: [], stock: 1200,
    description: '高性能小型 PLC，支持以太网通讯与多种扩展模块，适用于流水线自动化控制。', descriptionEn: 'High-performance compact PLC with Ethernet and rich I/O expansion for production-line automation.',
    tags: ['featured', 'hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-ROB-6A', categoryId: cat(4), brandId: bid('YASKAWA'),
    name: '六轴工业机器人臂（负载 10kg）', nameEn: '6-Axis Robot Arm 10kg',
    price: 8900, originalPrice: 10500, rating: 4.9, reviews: 88,
    image: '/uploads/products/p2.svg', gallery: [], stock: 60,
    description: '重复定位精度 ±0.03mm，适用于焊接、搬运、装配等场景，支持主流控制器集成。', descriptionEn: 'Repeatability ±0.03mm. Ideal for welding, handling and assembly; integrates with major controllers.',
    tags: ['featured', 'hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-SRV-750', categoryId: cat(2), brandId: bid('MITSUBISHI'),
    name: '交流伺服电机 750W 套装', nameEn: 'AC Servo Motor 750W Kit',
    price: 245, originalPrice: 299, rating: 4.7, reviews: 512,
    image: '/uploads/products/p3.svg', gallery: [], stock: 3000,
    description: '高响应伺服系统，内置编码器，低噪声，适配 CNC 与自动化产线。', descriptionEn: 'High-response servo system with encoder, low noise, ideal for CNC and automation.',
    tags: ['hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-SNS-T100', categoryId: cat(6), brandId: bid('SICK'),
    name: '高精度温度传感器 PT100', nameEn: 'Precision Temp Sensor PT100',
    price: 12.5, originalPrice: 16, rating: 4.6, reviews: 940,
    image: '/uploads/products/p4.svg', gallery: [], stock: 20000,
    description: '工业级铂电阻温度传感器，-50~400℃ 量程，精度 A 级，防护等级 IP67。', descriptionEn: 'Industrial platinum RTD, -50~400°C, class A accuracy, IP67.',
    tags: ['hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-INV-22', categoryId: cat(2), brandId: bid('INOVANCE'),
    name: '通用型变频器 22kW', nameEn: 'General VFD 22kW',
    price: 420, originalPrice: 520, rating: 4.7, reviews: 203,
    image: '/uploads/products/p5.svg', gallery: [], stock: 800,
    description: '矢量控制变频器，支持多种电机类型，内置 PID，适用于风机水泵与传动。', descriptionEn: 'Vector-control VFD supporting multiple motors with built-in PID for pumps and drives.',
    tags: ['featured'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-CNC-850', categoryId: cat(5), brandId: bid('MITSUBISHI'),
    name: '立式数控加工中心 VMC-850', nameEn: 'CNC Machining Center VMC-850',
    price: 23800, originalPrice: 26800, rating: 4.8, reviews: 41,
    image: '/uploads/products/p6.svg', gallery: [], stock: 18,
    description: '高精度三轴加工中心，标配刀库，适用于金属精密零件批量加工。', descriptionEn: 'High-precision 3-axis machining center with ATC for batch metal parts.',
    tags: ['featured'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-DMM-86', categoryId: cat(6), brandId: bid('OMRON'),
    name: '数字万用表 真有效值', nameEn: 'True-RMS Digital Multimeter',
    price: 38, originalPrice: 49, rating: 4.5, reviews: 1502,
    image: '/uploads/products/p7.svg', gallery: [], stock: 15000,
    description: '6000 计数真有效值万用表，支持电压/电流/电容/温度测量，CAT III 600V。', descriptionEn: '6000-count true-RMS DMM, CAT III 600V, multi-function.',
    tags: ['hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-HYC-100', categoryId: cat(7), brandId: bid('SWAGELOK'),
    name: '重型液压缸 100mm 行程', nameEn: 'Heavy Hydraulic Cylinder',
    price: 165, originalPrice: 198, rating: 4.6, reviews: 176,
    image: '/uploads/products/p8.svg', gallery: [], stock: 2400,
    description: '双作用重型液压缸，额定压力 16MPa，适用于工程机械与自动化夹具。', descriptionEn: 'Double-acting heavy cylinder, 16MPa, for machinery and fixtures.',
    tags: [], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-PNV-15', categoryId: cat(10), brandId: bid('SMC'),
    name: '气动电磁阀 5/2 接口', nameEn: 'Pneumatic Solenoid Valve 5/2',
    price: 22, originalPrice: 28, rating: 4.5, reviews: 688,
    image: '/uploads/products/p9.svg', gallery: [], stock: 12000,
    description: '工业级气动换向阀，响应快、寿命长，适配自动化气动回路。', descriptionEn: 'Industrial directional valve, fast response, long life.',
    tags: [], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-HMI-156', categoryId: cat(3), brandId: bid('SIEMENS'),
    name: '工业触控一体机 15.6"', nameEn: 'Industrial Touch Panel PC 15.6"',
    price: 560, originalPrice: 680, rating: 4.7, reviews: 134,
    image: '/uploads/products/p10.svg', gallery: [], stock: 500,
    description: '无风扇工业级一体机，IP65 前面板，支持 Win/Linux，适用于产线监控。', descriptionEn: 'Fanless industrial panel PC, IP65 front, Win/Linux, for HMI.',
    tags: ['featured'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-EGW-4G', categoryId: cat(9), brandId: bid('ABB'),
    name: '边缘计算网关（4G/以太网）', nameEn: 'Edge Computing Gateway',
    price: 198, originalPrice: 245, rating: 4.6, reviews: 212,
    image: '/uploads/products/p11.svg', gallery: [], stock: 3000,
    description: '支持 Modbus/OPC UA 的工业边缘网关，内置节点编排，轻松上云。', descriptionEn: 'Industrial edge gateway with Modbus/OPC UA and node orchestration.',
    tags: ['new'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CYX-SVC-TECH', categoryId: cat(0), brandId: '',
    name: '工业自动化技术咨询服务', nameEn: 'Automation Consulting Service',
    price: 0, originalPrice: 0, rating: 5.0, reviews: 57,
    image: '/uploads/products/p12.svg', gallery: [], stock: 9999,
    description: '提供产线自动化方案设计、系统集成与技术培训，按需定制报价。', descriptionEn: 'Line automation design, system integration and training. Custom quotation.',
    tags: ['featured'], active: true, createdAt: now,
  },

  // ---- 品牌化补充示例商品 ----
  {
    id: db.uid('prod'), sku: 'FESTO-DSNU-32', categoryId: cat(10), brandId: bid('FESTO'),
    name: 'Festo DSNU 系列双作用气缸', nameEn: 'Festo DSNU Double-Acting Cylinder',
    price: 35, originalPrice: 45, rating: 4.7, reviews: 420,
    image: '/uploads/products/p9.svg', gallery: [], stock: 9000,
    description: '标准紧凑型气缸，多种行程可选，免维护，适用于自动化夹持与搬运。', descriptionEn: 'Compact standard cylinder, multiple strokes, maintenance-free.',
    tags: ['hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'CKD-AB41-02', categoryId: cat(10), brandId: bid('CKD'),
    name: 'CKD AB41 系列气动电磁阀', nameEn: 'CKD AB41 Pneumatic Valve',
    price: 28, originalPrice: 36, rating: 4.6, reviews: 310,
    image: '/uploads/products/p9.svg', gallery: [], stock: 8000,
    description: '先导式电磁换向阀，低功耗、高寿命，适配 CKD 气动回路。', descriptionEn: 'Pilot solenoid valve, low power, long life.',
    tags: [], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'KEYENCE-LJ-V700', categoryId: cat(6), brandId: bid('KEYENCE'),
    name: 'KEYENCE LJ-V700 激光位移传感器', nameEn: 'KEYENCE LJ-V700 Laser Sensor',
    price: 980, originalPrice: 1150, rating: 4.9, reviews: 96,
    image: '/uploads/products/p4.svg', gallery: [], stock: 400,
    description: '高精度激光位移传感器，重复精度 0.2μm，适用于精密检测。', descriptionEn: 'High-precision laser displacement sensor, repeatability 0.2μm.',
    tags: ['featured'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'OMRON-E3Z-D62', categoryId: cat(6), brandId: bid('OMRON'),
    name: '欧姆龙 E3Z 光电开关', nameEn: 'Omron E3Z Photoelectric Sensor',
    price: 19, originalPrice: 25, rating: 4.7, reviews: 1320,
    image: '/uploads/products/p4.svg', gallery: [], stock: 16000,
    description: '通用型光电传感器，漫反射/对射可选，IP67 防护，易安装。', descriptionEn: 'General photoelectric sensor, diffuse/through-beam, IP67.',
    tags: ['hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'AIRTAC-SC-50', categoryId: cat(10), brandId: bid('AIRTAC'),
    name: '亚德客 SC 系列标准气缸', nameEn: 'AirTAC SC Standard Cylinder',
    price: 16, originalPrice: 21, rating: 4.6, reviews: 880,
    image: '/uploads/products/p9.svg', gallery: [], stock: 14000,
    description: '经济型标准气缸，性价比高，广泛用于自动化设备。', descriptionEn: 'Economical standard cylinder, widely used in automation.',
    tags: [], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'ABB-ACS550-22', categoryId: cat(2), brandId: bid('ABB'),
    name: 'ABB ACS550 变频器 22kW', nameEn: 'ABB ACS550 VFD 22kW',
    price: 560, originalPrice: 690, rating: 4.8, reviews: 175,
    image: '/uploads/products/p5.svg', gallery: [], stock: 600,
    description: '通用机械传动变频器，易调试，内置 PID 与节能控制。', descriptionEn: 'General-purpose drive, easy setup, built-in PID.',
    tags: ['featured'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'TURCK-BI5-M18', categoryId: cat(6), brandId: bid('TURCK'),
    name: '图尔克 BI5-M18 电感式接近开关', nameEn: 'Turck BI5-M18 Inductive Sensor',
    price: 14, originalPrice: 18, rating: 4.7, reviews: 1010,
    image: '/uploads/products/p4.svg', gallery: [], stock: 18000,
    description: 'M18 圆柱型接近开关，检测距离 5mm，IP67，抗干扰强。', descriptionEn: 'M18 inductive proximity sensor, 5mm range, IP67.',
    tags: ['hot'], active: true, createdAt: now,
  },
  {
    id: db.uid('prod'), sku: 'PISCO-KQ2-04', categoryId: cat(10), brandId: bid('PISCO'),
    name: 'PISCO KQ2 快插气管接头', nameEn: 'PISCO KQ2 Push-in Fitting',
    price: 1.8, originalPrice: 2.5, rating: 4.6, reviews: 2200,
    image: '/uploads/products/p9.svg', gallery: [], stock: 50000,
    description: '树脂快插接头，安装便捷、密封可靠，适配 φ4~φ12 气管。', descriptionEn: 'Resin push-in fitting, easy install, reliable seal.',
    tags: [], active: true, createdAt: now,
  },
];

// 「新产品」模块：手动指定（后台可改）+ 上架时间错开（自动推荐的排序依据）
const NEW_SKUS = ['CYX-EGW-4G', 'KEYENCE-LJ-V700', 'FESTO-DSNU-32', 'OMRON-E3Z-D62', 'TURCK-BI5-M18', 'ABB-ACS550-22'];
const baseTs = Date.parse(now);
products.forEach((p, i) => {
  // 数组越靠后的上架时间越新
  p.createdAt = new Date(baseTs - (products.length - i) * 86400000).toISOString();
  if (NEW_SKUS.includes(p.sku)) p.isNew = true;
});

// 促销活动
const promotions = [
  {
    id: db.uid('promo'), title: '新客首单立减', titleEn: 'New Customer Discount',
    subtitle: '注册即享首单 5% OFF', subtitleEn: '5% OFF first order on sign-up',
    image: '/uploads/promotions/promo1.svg', discountText: '5% OFF', link: '/?lang=zh#hot',
    startDate: now, endDate: '', sort: 1, active: true,
  },
  {
    id: db.uid('promo'), title: '批量采购特惠', titleEn: 'Bulk Order Deals',
    subtitle: '满 100 件享阶梯折扣', subtitleEn: 'Tiered discount over 100 pcs',
    image: '/uploads/promotions/promo2.svg', discountText: 'UP TO 15%', link: '/?lang=zh#hot',
    startDate: now, endDate: '', sort: 2, active: true,
  },
  {
    id: db.uid('promo'), title: '技术服务套餐', titleEn: 'Service Packages',
    subtitle: '方案设计 + 集成 + 培训', subtitleEn: 'Design + Integration + Training',
    image: '/uploads/promotions/promo3.svg', discountText: 'FREE QUOTE', link: '/?lang=zh#contact',
    startDate: now, endDate: '', sort: 3, active: true,
  },
];

const messages = [];
const admins = [
  {
    id: db.uid('admin'),
    username: 'admin',
    // 默认密码 admin123 —— 上线前请务必在后台修改
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: now,
  },
];

const full = { settings, slides, categories, brands, products, promotions, messages, admins };
// 写入缓存并持久化
Object.assign(db.read(), full);
db.save();

console.log('[seed] 初始化完成：');
console.log('  品牌:', brands.length, '| 产品类型:', categories.length, '| 商品:', products.length, '| 轮播:', slides.length, '| 促销:', promotions.length);
console.log('  后台管理员账号：admin / admin123（请尽快修改）');
  await db.flush();
})();
