'use strict';

let STATE = null;
let tab = 'overview';

const SCHEMAS = {
  slides: {
    endpoint: 'slides', title: '轮播图管理',
    fields: [
      { k: 'title', l: '标题(中文)' }, { k: 'titleEn', l: '标题(英文)' },
      { k: 'subtitle', l: '副标题(中文)' }, { k: 'subtitleEn', l: '副标题(英文)' },
      { k: 'link', l: '跳转链接', hint: '例如 /?lang=zh#hot 或 https://...' },
      { k: 'image', l: '图片', type: 'image' },
      { k: 'sort', l: '排序', type: 'number', hint: '数字越小越靠前' },
      { k: 'active', l: '是否启用', type: 'bool' },
    ],
    cols: [{ k: 'title', l: '标题' }, { k: 'image', l: '图片', type: 'image' }, { k: 'sort', l: '排序' }, { k: 'active', l: '状态', type: 'bool' }],
  },
  categories: {
    endpoint: 'categories', title: '产品类型管理',
    fields: [
      { k: 'name', l: '名称(中文)' }, { k: 'nameEn', l: '名称(英文)' },
      { k: 'icon', l: '图标(emoji)', hint: '例如 🔌 ⚙️ 🤖' },
      { k: 'color', l: '主题色', type: 'color' },
      { k: 'image', l: '图片', type: 'image' },
      { k: 'sort', l: '排序', type: 'number' },
      { k: 'active', l: '是否启用', type: 'bool' },
    ],
    cols: [{ k: 'name', l: '名称' }, { k: 'icon', l: '图标' }, { k: 'sort', l: '排序' }, { k: 'active', l: '状态', type: 'bool' }],
  },
  brands: {
    endpoint: 'brands', title: '品牌管理（一级导航）',
    fields: [
      { k: 'code', l: '品牌代码', hint: '例如 SMC / ABB / FESTO' },
      { k: 'name', l: '名称(中文)' }, { k: 'nameEn', l: '名称(英文)' },
      { k: 'color', l: '主题色', type: 'color' },
      { k: 'sort', l: '排序', type: 'number', hint: '数字越小越靠前' },
      { k: 'active', l: '是否启用', type: 'bool' },
    ],
    cols: [{ k: 'code', l: '代码' }, { k: 'name', l: '名称' }, { k: 'sort', l: '排序' }, { k: 'active', l: '状态', type: 'bool' }],
  },
  products: {
    endpoint: 'products', title: '商品管理',
    fields: [
      { k: 'sku', l: 'SKU / 型号', hint: '例如 CYX-PLC-1200' },
      { k: 'productCode', l: '产品编号', hint: '详情页展示，留空则用 SKU' },
      { k: 'leadTime', l: '货期', hint: '例如：交期详询客服' },
      { k: 'name', l: '名称(中文)' }, { k: 'nameEn', l: '名称(英文)' },
      { k: 'categoryId', l: '所属产品类型', type: 'select', optionsKey: 'categories' },
      { k: 'brandId', l: '所属品牌', type: 'select', optionsKey: 'brands' },
      { k: 'price', l: '价格', type: 'number', hint: '填 0 表示“询价”' },
      { k: 'originalPrice', l: '原价', type: 'number' },
      { k: 'rating', l: '评分', type: 'number' }, { k: 'reviews', l: '评价数', type: 'number' },
      { k: 'stock', l: '库存', type: 'number' },
      { k: 'tags', l: '标签', hint: '逗号分隔：featured, hot, new' },
      { k: 'isNew', l: '设为新产品', type: 'bool', hint: '勾选后出现在首页「新产品」模块（手动优先）' },
      { k: 'newSort', l: '新产品排序', type: 'number', hint: '数字越大越靠前，默认 0' },
      { k: 'image', l: '主图', type: 'image' },
      { k: 'gallery', l: '图集URL', hint: '逗号分隔多个图片地址' },
      { k: 'description', l: '描述(中文)', type: 'textarea' },
      { k: 'descriptionEn', l: '描述(英文)', type: 'textarea' },
      { k: 'active', l: '是否上架', type: 'bool' },
    ],
    cols: [{ k: 'image', l: '图片', type: 'image' }, { k: 'name', l: '名称' }, { k: 'sku', l: 'SKU' }, { k: 'price', l: '价格' }, { k: 'isNew', l: '新品', type: 'bool' }, { k: 'active', l: '状态', type: 'bool' }],
  },
  promotions: {
    endpoint: 'promotions', title: '促销活动管理',
    fields: [
      { k: 'title', l: '标题(中文)' }, { k: 'titleEn', l: '标题(英文)' },
      { k: 'subtitle', l: '副标题(中文)' }, { k: 'discountText', l: '折扣文案', hint: '例如 5% OFF / UP TO 15%' },
      { k: 'image', l: '图片', type: 'image' },
      { k: 'link', l: '跳转链接' },
      { k: 'sort', l: '排序', type: 'number' },
      { k: 'active', l: '是否启用', type: 'bool' },
    ],
    cols: [{ k: 'title', l: '标题' }, { k: 'discountText', l: '折扣' }, { k: 'sort', l: '排序' }, { k: 'active', l: '状态', type: 'bool' }],
  },
};

const SETTINGS_LABELS = {
  siteName: '公司名称(中文)', siteNameEn: '公司名称(英文)', shortName: '简称(中文)', shortNameEn: '简称(英文)',
  slogan: '标语(中文)', sloganEn: '标语(英文)', logoText: 'Logo 文字',
  contactEmail: '联系邮箱', contactPhone: '联系电话', whatsapp: 'WhatsApp', address: '地址(中文)', addressEn: '地址(英文)',
  seoTitle: 'SEO 标题', seoTitleEn: 'SEO 标题(英文)', seoDescription: 'SEO 描述', seoDescriptionEn: 'SEO 描述(英文)',
  seoKeywords: 'SEO 关键词(逗号分隔)', seoKeywordsEn: 'SEO 关键词(英文)', currency: '货币代码', currencySymbol: '货币符号',
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function loadState() {
  const r = await fetch('/admin/api/state');
  STATE = await r.json();
  render();
}

function render() {
  const main = document.getElementById('main');
  if (tab === 'overview') return renderOverview(main);
  if (tab === 'messages') return renderMessages(main);
  if (tab === 'settings') return renderSettings(main);
  if (tab === 'password') return renderPassword(main);
  return renderEntity(main, tab);
}

function renderOverview(main) {
  const c = {
    products: STATE.products.length, categories: STATE.categories.length, brands: STATE.brands.length,
    slides: STATE.slides.length, promotions: STATE.promotions.length,
    messages: STATE.messages.length, newMsgs: STATE.messages.filter((m) => m.status === 'new').length,
  };
  const recent = STATE.messages.slice(0, 5).map((m) => `<li>${esc(m.name)} · ${esc(m.subject || m.content.slice(0, 24))} <span style="color:#999">${new Date(m.createdAt).toLocaleString()}</span></li>`).join('') || '<li class="empty">暂无留言</li>';
  main.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="n">${c.products}</div><div class="l">商品</div></div>
      <div class="stat"><div class="n">${c.brands}</div><div class="l">品牌</div></div>
      <div class="stat"><div class="n">${c.categories}</div><div class="l">产品类型</div></div>
      <div class="stat"><div class="n">${c.slides}</div><div class="l">轮播</div></div>
      <div class="stat"><div class="n">${c.promotions}</div><div class="l">促销</div></div>
      <div class="stat"><div class="n">${c.newMsgs}</div><div class="l">新留言</div></div>
    </div>
    <div class="admin-card">
      <h3>最近留言 <button class="btn-sm" onclick="switchTab('messages')">查看全部</button></h3>
      <ul style="padding-left:18px;line-height:2;">${recent}</ul>
    </div>`;
}

function renderEntity(main, key) {
  const sc = SCHEMAS[key];
  const list = STATE[sc.endpoint] || [];
  const rows = list.map((it) => {
    const tds = sc.cols.map((col) => {
      const v = it[col.k];
      if (col.type === 'image') return `<td>${v ? `<img class="thumb-sm" src="${esc(v)}"/>` : '-'}</td>`;
      if (col.type === 'bool') return `<td><span class="tag-dot ${v ? 'tag-on' : 'tag-off'}">${v ? '启用' : '停用'}</span></td>`;
      return `<td>${esc(v)}</td>`;
    }).join('');
    return `<tr>${tds}<td><button class="btn-sm edit" onclick="editEntity('${key}','${it.id}')">编辑</button>
      <button class="btn-sm del" onclick="deleteEntity('${key}','${it.id}')">删除</button></td></tr>`;
  }).join('');

  const head = '<tr>' + sc.cols.map((c) => `<th>${c.l}</th>`).join('') + '<th>操作</th></tr>';
  main.innerHTML = `
    <div class="admin-card">
      <h3>${sc.title} <button class="btn-primary" onclick="openForm('${key}')">+ 新增</button></h3>
      ${list.length ? `<table><thead>${head}</thead><tbody>${rows}</tbody></table>` : '<div class="empty">暂无数据，点击右上角新增</div>'}
    </div>`;
}

function openForm(key, id) {
  const sc = SCHEMAS[key];
  const item = id ? (STATE[sc.endpoint] || []).find((x) => x.id === id) : null;
  const fields = sc.fields.map((f) => fieldHtml(f, item)).join('');
  document.getElementById('modalBox').innerHTML = `
    <h3>${item ? '编辑' : '新增'} · ${sc.title}</h3>
    <form id="adminForm">${fields}
      <div class="modal-actions">
        <button type="button" class="btn-sm" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-primary">保存</button>
      </div>
    </form>`;
  document.getElementById('adminForm').onsubmit = (e) => { e.preventDefault(); saveEntity(key, item); };
  document.getElementById('modal').classList.add('show');
}

function fieldHtml(f, item) {
  const v = item ? item[f.k] : '';
  if (f.type === 'image') {
    return `<div class="field"><label>${f.l}</label><div class="field-img">${v ? `<img src="${esc(v)}"/>` : ''}<input type="file" name="image" accept="image/*"/></div>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
  }
  if (f.type === 'bool') {
    return `<div class="field"><label>${f.l}</label><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}/></div>`;
  }
  if (f.type === 'color') {
    return `<div class="field"><label>${f.l}</label><input type="color" name="${f.k}" value="${esc(v || '#ff6a00')}"/></div>`;
  }
  if (f.type === 'number') {
    return `<div class="field"><label>${f.l}</label><input type="number" step="any" name="${f.k}" value="${esc(v)}"/>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
  }
  if (f.type === 'textarea') {
    return `<div class="field"><label>${f.l}</label><textarea name="${f.k}">${esc(v)}</textarea></div>`;
  }
  if (f.type === 'select') {
    const opts = (STATE[f.optionsKey] || []).map((o) => `<option value="${o.id}" ${v === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('');
    return `<div class="field"><label>${f.l}</label><select name="${f.k}">${opts}</select></div>`;
  }
  return `<div class="field"><label>${f.l}</label><input type="text" name="${f.k}" value="${esc(v)}"/>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
}

function saveEntity(key, item) {
  const sc = SCHEMAS[key];
  const form = document.getElementById('adminForm');
  const fd = new FormData(form);
  // 未选择新图片则不提交 image，保留原图
  if (!(form.image && form.image.files && form.image.files[0])) fd.delete('image');
  const url = '/admin/api/' + sc.endpoint + (item ? '/' + item.id : '');
  const method = item ? 'PUT' : 'POST';
  fetch(url, { method, body: fd })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (ok) { closeModal(); loadState(); } else alert(d.error || '保存失败');
    });
}

function deleteEntity(key, id) {
  if (!confirm('确定删除？')) return;
  const sc = SCHEMAS[key];
  fetch('/admin/api/' + sc.endpoint + '/' + id, { method: 'DELETE' })
    .then(() => loadState());
}

function editEntity(key, id) { openForm(key, id); }

function renderMessages(main) {
  const list = STATE.messages;
  const rows = list.map((m) => `<tr>
    <td>${esc(m.name)}</td><td>${esc(m.email)}</td><td>${esc(m.phone || '-')}</td>
    <td>${esc(m.subject || '-')}</td><td>${esc(m.content)}</td>
    <td>${new Date(m.createdAt).toLocaleString()}</td>
    <td><span class="tag-dot ${m.status === 'new' ? 'tag-on' : 'tag-off'}">${m.status === 'new' ? '未读' : '已读'}</span></td>
    <td>
      <button class="btn-sm edit" onclick="toggleMsg('${m.id}')">${m.status === 'new' ? '标记已读' : '标为未读'}</button>
      <button class="btn-sm del" onclick="delMsg('${m.id}')">删除</button>
    </td></tr>`).join('');
  const head = '<tr><th>姓名</th><th>邮箱</th><th>电话</th><th>主题</th><th>内容</th><th>时间</th><th>状态</th><th>操作</th></tr>';
  main.innerHTML = `<div class="admin-card"><h3>留言管理（用户提交，后台可见）</h3>
    ${list.length ? `<table><thead>${head}</thead><tbody>${rows}</tbody></table>` : '<div class="empty">暂无留言</div>'}</div>`;
}

function toggleMsg(id) {
  const m = STATE.messages.find((x) => x.id === id);
  fetch('/admin/api/messages/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: m.status === 'new' ? 'read' : 'new' }) })
    .then(() => loadState());
}
function delMsg(id) {
  if (!confirm('删除该留言？')) return;
  fetch('/admin/api/messages/' + id, { method: 'DELETE' }).then(() => loadState());
}

function renderSettings(main) {
  const s = STATE.settings;
  const fields = Object.keys(SETTINGS_LABELS).map((k) => `<div class="field"><label>${SETTINGS_LABELS[k]}</label>
    <input type="text" name="${k}" value="${esc(s[k])}"/></div>`).join('');
  main.innerHTML = `<div class="admin-card"><h3>站点设置（公司信息 / SEO）</h3>
    <form id="setForm" style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;">${fields}
      <div class="modal-actions" style="grid-column:1/-1;"><button type="submit" class="btn-primary">保存设置</button></div>
    </form></div>`;
  document.getElementById('setForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = {};
    new FormData(e.target).forEach((v, k) => (fd[k] = v));
    fetch('/admin/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd) })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (ok) { alert('已保存'); loadState(); } else alert(d.error || '失败'); });
  };
}

function renderPassword(main) {
  main.innerHTML = `<div class="admin-card" style="max-width:420px;">
    <h3>修改管理员密码</h3>
    <form id="pwForm">
      <div class="field"><label>原密码</label><input type="password" name="oldPassword" required/></div>
      <div class="field"><label>新密码（至少 6 位）</label><input type="password" name="newPassword" required/></div>
      <div class="modal-actions"><button type="submit" class="btn-primary">更新密码</button></div>
    </form></div>`;
  document.getElementById('pwForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = {};
    new FormData(e.target).forEach((v, k) => (fd[k] = v));
    fetch('/admin/api/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd) })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (ok) alert('密码已更新'); else alert(d.error || '失败'); });
  };
}

function switchTab(t) {
  tab = t;
  document.querySelectorAll('#side button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
  render();
}

function closeModal() { document.getElementById('modal').classList.remove('show'); }

function logout() {
  fetch('/admin/logout', { method: 'POST' }).then(() => (location.href = '/admin/login'));
}

document.querySelectorAll('#side button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

loadState();
