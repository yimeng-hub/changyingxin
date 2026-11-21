'use strict';

/* ---------------- 轮播图 ---------------- */
(function () {
  const track = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  if (!track) return;
  const total = track.children.length;
  let idx = 0;
  let timer = null;

  function render() {
    track.style.transform = `translateX(-${idx * 100}%)`;
    if (dotsWrap) {
      [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    const slide = track.children[idx];
    if (slide) {
      const en = window.__lang === 'en';
      const t = document.getElementById('heroTitle');
      const s = document.getElementById('heroSub');
      if (t) t.textContent = en ? (slide.dataset.titleEn || slide.dataset.title) : (slide.dataset.title || '');
      if (s) s.textContent = en ? (slide.dataset.subEn || slide.dataset.sub) : (slide.dataset.sub || '');
    }
  }
  window.goSlide = function (i) { idx = i; render(); reset(); };
  window.moveSlide = function (step) { idx = (idx + step + total) % total; render(); reset(); };
  function reset() { clearInterval(timer); if (total > 1) timer = setInterval(() => window.moveSlide(1), 5000); }
  if (total > 1) reset();
})();

/* ---------------- 商品筛选（搜索 + 品牌 + 产品类型） ---------------- */
let currentCat = null;
let currentBrand = null;
let currentQuery = '';

function applyFilter() {
  const cards = document.querySelectorAll('#productGrid .product-card');
  let shown = 0;
  cards.forEach((c) => {
    const matchBrand = !currentBrand || c.dataset.brand === currentBrand;
    const matchCat = !currentCat || c.dataset.cat === currentCat;
    const matchQ = !currentQuery || c.dataset.search.includes(currentQuery);
    const ok = matchBrand && matchCat && matchQ;
    c.style.display = ok ? '' : 'none';
    if (ok) shown++;
  });
  const nr = document.getElementById('noResult');
  if (nr) nr.style.display = shown === 0 ? 'block' : 'none';
}

window.doSearch = function (e) {
  e.preventDefault();
  currentQuery = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  currentCat = null;
  currentBrand = null;
  document.querySelectorAll('#typeChips .chip').forEach((a) => a.classList.remove('active'));
  document.querySelectorAll('#brandTabs .brand-tab').forEach((a) => a.classList.remove('active'));
  document.querySelectorAll('.brand-card').forEach((c) => c.classList.remove('active'));
  applyFilter();
  const hot = document.getElementById('hot');
  if (hot) hot.scrollIntoView({ behavior: 'smooth' });
  return false;
};

window.filterByBrand = function (brandId, el) {
  if (currentBrand === brandId) { currentBrand = null; el && el.classList.remove('active'); }
  else {
    currentBrand = brandId;
    document.querySelectorAll('#brandTabs .brand-tab').forEach((a) => a.classList.remove('active'));
    document.querySelectorAll('.brand-card').forEach((c) => c.classList.remove('active'));
    el && el.classList.add('active');
  }
  currentQuery = '';
  const si = document.getElementById('searchInput'); if (si) si.value = '';
  applyFilter();
};

window.filterByCategory = function (catId, el) {
  if (currentCat === catId) { currentCat = null; el && el.classList.remove('active'); }
  else {
    currentCat = catId;
    document.querySelectorAll('#typeChips .chip').forEach((a) => a.classList.remove('active'));
    document.querySelectorAll('.cat-card').forEach((c) => c.classList.remove('active'));
    const chip = document.querySelector('#typeChips .chip[data-cat="' + catId + '"]');
    if (chip) chip.classList.add('active');
    el && el.classList.add('active');
  }
  currentQuery = '';
  const si = document.getElementById('searchInput'); if (si) si.value = '';
  applyFilter();
  // 从底部「产品分类」点击时，回滚到热卖商品区看结果
  if (el && el.classList && el.classList.contains('cat-card')) {
    const hot = document.getElementById('hot');
    if (hot) hot.scrollIntoView({ behavior: 'smooth' });
  }
};

/* 品牌条横向滚动 */
window.scrollBrands = function (dir) {
  const wrap = document.getElementById('brandTabs');
  if (wrap) wrap.scrollBy({ left: dir * 240, behavior: 'smooth' });
};

/* ---------------- 询盘（预填留言主题） ---------------- */
window.openInquiry = function (name) {
  const subj = document.getElementById('m_subject');
  if (subj) subj.value = (window.__lang === 'en' ? 'Inquiry: ' : '询盘：') + name;
  const contact = document.getElementById('contact');
  if (contact) contact.scrollIntoView({ behavior: 'smooth' });
};

/* ---------------- 留言提交 ---------------- */
window.submitMessage = function (e) {
  e.preventDefault();
  const msg = document.getElementById('formMsg');
  const btn = document.getElementById('m_submit');
  const payload = {
    name: document.getElementById('m_name').value,
    email: document.getElementById('m_email').value,
    phone: document.getElementById('m_phone').value,
    subject: document.getElementById('m_subject').value,
    content: document.getElementById('m_content').value,
  };
  if (!payload.name || !payload.email || !payload.content) {
    msg.className = 'form-msg err'; msg.textContent = (window.__lang === 'en' ? 'Please fill required fields' : '请填写必填项'); return false;
  }
  btn.disabled = true; btn.textContent = (window.__lang === 'en' ? 'Sending…' : '提交中…');
  fetch('/api/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (ok) {
        msg.className = 'form-msg ok'; msg.textContent = (window.__lang === 'en' ? 'Message sent. Thank you!' : '留言已提交，感谢您的咨询！');
        document.getElementById('contactForm').reset();
      } else {
        msg.className = 'form-msg err'; msg.textContent = (window.__lang === 'en' ? 'Failed to send.' : '提交失败，请稍后重试');
      }
    })
    .catch(() => { msg.className = 'form-msg err'; msg.textContent = (window.__lang === 'en' ? 'Network error.' : '网络错误，请重试'); })
    .finally(() => { btn.disabled = false; btn.textContent = (window.__lang === 'en' ? 'Send Message' : '提交留言'); });
  return false;
};

/* ---------------- 登录弹窗 ---------------- */
window.openLogin = function () { document.getElementById('loginMask').classList.add('show'); };
window.closeLogin = function () { document.getElementById('loginMask').classList.remove('show'); };
window.doLogin = function (e) {
  e.preventDefault();
  const err = document.getElementById('loginErr');
  err.style.display = 'none';
  fetch('/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: document.getElementById('l_user').value, password: document.getElementById('l_pass').value }),
  })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (ok) window.location.href = d.redirect || '/admin';
      else { err.style.display = 'block'; err.textContent = d.error || '登录失败'; }
    });
  return false;
};

/* 当前语言（供脚本内文案判断） */
window.__lang = document.documentElement.lang || 'zh';

/* 首屏「立即询价」：滚动到留言表单 */
window.gotoContact = function () {
  const contact = document.getElementById('contact');
  if (contact) contact.scrollIntoView({ behavior: 'smooth' });
};
