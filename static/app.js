/* HOK Filling Station — transaction-oriented administration client. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = {
    user: null, permissions: [], csrf: '', settings: {}, base: {}, active: 'dashboard',
    collapsed: false, mobileOpen: false, period: 'today', start: '', end: '', report: null,
    saleEdit: null, searchTimer: null, tableQuery: '',
  };
  const appRoot = $('#app');
  const toastRoot = $('#toast-stack');
  const PERM = {
    dashboard: 'dashboard:view', daily_sales: 'sales:view', sales_history: 'sales:view', pumps: 'products:view', meters: 'inventory:view',
    stock: 'inventory:view', tanks: 'inventory:view', purchases: 'purchases:view', suppliers: 'purchases:view', customers: 'customers:manage',
    customer_due: 'customers:manage', cashbook: 'cashbook:view', banks: 'cashbook:view', expenses: 'cashbook:view', employees: 'employees:manage',
    shifts: 'shifts:manage', products: 'products:view', prices: 'products:view', pnl: 'reports:view', reports: 'reports:view',
    notifications: 'notifications:view', audit: 'audit:view', users: 'users:manage', backups: 'backup:manage', settings: 'settings:manage',
  };
  const NAV = [
    { section: 'Overview', items: [
      ['dashboard', 'Dashboard', 'ড্যাশবোর্ড', 'grid'],
    ]},
    { section: 'Sales & Operations', items: [
      ['daily_sales', 'Daily Sales', 'দৈনিক বিক্রয়', 'receipt'], ['sales_history', 'Sales History', 'বিক্রয় ইতিহাস', 'history'],
      ['pumps', 'Pump & Nozzle', 'পাম্প ও নজল', 'pump'], ['meters', 'Meter Reading', 'মিটার রিডিং', 'meter'],
      ['stock', 'Fuel Stock', 'জ্বালানি স্টক', 'fuel'], ['tanks', 'Tank Management', 'ট্যাংক ব্যবস্থাপনা', 'tank'],
      ['purchases', 'Fuel Purchase', 'জ্বালানি ক্রয়', 'truck'], ['suppliers', 'Suppliers', 'সরবরাহকারী', 'users'],
      ['customers', 'Customers', 'গ্রাহক', 'user'], ['customer_due', 'Customer Due', 'গ্রাহকের বকেয়া', 'wallet'],
    ]},
    { section: 'Accounts', items: [
      ['cashbook', 'Cashbook', 'ক্যাশবুক', 'cash'], ['banks', 'Bank & Deposit', 'ব্যাংক ও জমা', 'bank'],
      ['expenses', 'Expenses', 'খরচ', 'expense'], ['employees', 'Employees', 'কর্মচারী', 'users'], ['shifts', 'Shifts', 'শিফট', 'clock'],
    ]},
    { section: 'Products & Insights', items: [
      ['products', 'Products', 'পণ্য', 'box'], ['prices', 'Price Management', 'মূল্য ব্যবস্থাপনা', 'tag'],
      ['pnl', 'Profit & Loss', 'লাভ-ক্ষতি', 'chart'], ['reports', 'Reports', 'রিপোর্ট', 'report'],
    ]},
    { section: 'Administration', items: [
      ['notifications', 'Notifications', 'বিজ্ঞপ্তি', 'bell'], ['audit', 'Audit Logs', 'অডিট লগ', 'shield'],
      ['users', 'Users & Permissions', 'ইউজার ও অনুমতি', 'key'], ['backups', 'Backup', 'ব্যাকআপ', 'backup'],
      ['settings', 'Settings', 'সেটিংস', 'settings'],
    ]},
  ];
  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    history: '<path d="M3 12a9 9 0 1 0 2.7-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    pump: '<path d="M5 21V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17M3 21h15M7 6h7v5H7zM16 7h2l2 3v7a2 2 0 0 1-4 0v-4"/>',
    meter: '<circle cx="12" cy="12" r="9"/><path d="M12 12 16 8M7 16h10M12 5v2"/>',
    fuel: '<path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 1 0 13 0C18.5 10 12 2.5 12 2.5Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    tank: '<path d="M4 20V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12M3 20h18M7 6V4h10v2M8 11h8"/>',
    truck: '<path d="M3 6h12v11H3zM15 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="18.5" cy="19" r="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2"/>',
    cash: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9h.01M18 15h.01"/>',
    bank: '<path d="m3 9 9-6 9 6M4 10h16M6 10v9M10 10v9M14 10v9M18 10v9M3 21h18M2 19h20"/>',
    expense: '<path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    box: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9"/>',
    tag: '<path d="M20 13 13 20a2 2 0 0 1-3 0l-7-7V4h9l8 8a2 2 0 0 1 0 1Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    chart: '<path d="M3 3v18h18M7 14l4-4 4 3 6-7"/>',
    report: '<path d="M5 3h11l4 4v14H5zM15 3v5h5M8 12h8M8 16h8M8 8h3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    key: '<circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 8-8L22 6l-2 2 1 1-2 2-1-1-4 4"/>',
    backup: '<path d="M4 4v6h6M5 9a8 8 0 1 1-1 5M12 8v4l3 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.8 1.8 0 0 0-1.9-.1 1.8 1.8 0 0 0-1 1.6v.2h-3.4v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-1.9.1l-.2.1-1.7-2.9.1-.1a1.7 1.7 0 0 0 .3-1.9A1.8 1.8 0 0 0 5.6 14h-.2v-3.4h.2a1.8 1.8 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.7-2.9.2.1a1.8 1.8 0 0 0 1.9.1 1.8 1.8 0 0 0 1-1.6v-.2H15v.2a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 1.9-.1l.2-.1 1.7 2.9-.1.1a1.7 1.7 0 0 0-.3 1.9 1.8 1.8 0 0 0 1.6 1h.2V14h-.2a1.8 1.8 0 0 0-1.6 1Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v4h14v-4"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6zM18 12h.01"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  };
  const icon = (name, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.box}</svg>`;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money = (v, currency = state.settings.currency || '৳') => `${currency} ${Number(v || 0).toLocaleString('en-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const number = (v, digits = 3) => Number(v || 0).toLocaleString('en-BD', {maximumFractionDigits: digits});
  const displayDate = (value) => {
    if (!value) return '—';
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
  };
  const today = () => state.base.today || new Date().toISOString().slice(0,10);
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function toast(message, kind = '') {
    const el = document.createElement('div'); el.className = `toast ${kind}`; el.textContent = message;
    toastRoot.append(el); setTimeout(() => el.remove(), 4200);
  }
  async function api(url, options = {}) {
    const opts = {...options};
    opts.headers = {...(opts.headers || {})};
    if (opts.body && typeof opts.body !== 'string') { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(opts.body); }
    if (!['GET','HEAD'].includes((opts.method || 'GET').toUpperCase()) && state.csrf) opts.headers['X-CSRF-Token'] = state.csrf;
    const response = await fetch(url, opts);
    const ct = response.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await response.json() : response;
    if (!response.ok) {
      const error = new Error(payload?.error || `Request failed (${response.status})`);
      error.status = response.status; error.code = payload?.code; throw error;
    }
    return payload;
  }
  async function setup() {
    try {
      const status = await api('/api/setup/status');
      if (status.setup_required) { renderAuth(true); return; }
      const auth = await api('/api/auth/me');
      if (!auth.authenticated) { renderAuth(false); return; }
      state.user = auth.user; state.permissions = auth.permissions || []; state.csrf = auth.csrf_token;
      await enterApplication();
    } catch (error) {
      appRoot.innerHTML = `<div class="boot-screen"><div class="brand-mark">H</div><strong>Unable to connect</strong><span>${escapeHtml(error.message)}</span><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>`;
    }
  }
  function renderAuth(firstRun) {
    const authTitle = firstRun ? 'Set up your station' : 'Welcome back';
    const authText = firstRun ? 'Create the secure owner account to begin. Your password is stored as a one-way hash.' : 'Sign in to continue to your station workspace.';
    appRoot.innerHTML = `<main class="auth-page">
      <section class="auth-story"><div class="auth-brand"><div class="brand-mark">H</div><div><div class="auth-brand-title">HOK FILLING STATION</div><div class="auth-brand-sub">Business operations · Bangladesh</div></div></div>
        <div class="auth-story-copy"><div class="eyebrow">Station operations, in control</div><h1>Every litre.<br>Every ledger.</h1><p>A secure operations workspace for fuel sales, stock, customer credit, cash management and daily station reporting.</p></div>
        <div class="auth-features"><span><i></i> Real database & audit trail</span><span><i></i> Cash and credit control</span><span><i></i> Built for daily operations</span></div></section>
      <section class="auth-card-wrap"><div class="auth-card"><div class="auth-brand" style="margin-bottom:28px"><div class="brand-mark">H</div><div><div class="auth-brand-title" style="color:var(--navy)">HOK FILLING STATION</div><div class="auth-brand-sub" style="color:var(--muted)">মেসার্স হক ফিলিং স্টেশন</div></div></div>
        <h2>${authTitle}</h2><p class="auth-sub">${authText}</p><form id="auth-form"><div id="auth-error" class="form-error"></div>
        ${firstRun ? `<div class="field"><label for="full_name">Owner full name</label><input id="full_name" name="full_name" autocomplete="name" required placeholder="Your full name"></div>` : ''}
        <div class="field"><label for="username">Username</label><input id="username" name="username" autocomplete="username" required minlength="3" placeholder="Enter your username"></div>
        <div class="field"><label for="password">${firstRun ? 'Create password' : 'Password'}</label><input id="password" name="password" type="password" autocomplete="${firstRun ? 'new-password' : 'current-password'}" required ${firstRun ? 'minlength="10"' : ''} placeholder="${firstRun ? 'At least 10 characters' : 'Enter your password'}"></div>
        ${firstRun ? `<div class="field"><span class="hint">Use a unique password with at least 10 characters. Add station users and permissions after setup.</span></div>` : ''}
        <button class="btn btn-primary" style="width:100%;min-height:43px" type="submit">${firstRun ? 'Create owner account' : 'Sign in'} ${icon('arrow',15)}</button></form>
        <div class="auth-foot">Secure sign-in · Business records stay on the station database<br>Asia/Dhaka · Bangladeshi Taka (৳)</div></div></section></main>`;
    $('#auth-form').addEventListener('submit', async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries());
      const errorBox = $('#auth-error'); errorBox.classList.remove('show');
      const submit = $('button[type="submit"]', event.currentTarget); submit.disabled = true; submit.textContent = firstRun ? 'Creating account…' : 'Signing in…';
      try {
        const result = await api(firstRun ? '/api/setup' : '/api/auth/login', {method:'POST', body});
        state.user = result.user; state.csrf = result.csrf_token;
        if (firstRun) toast('Owner account created. Your station is ready.', 'success');
        await enterApplication();
      } catch (error) {
        errorBox.textContent = error.message; errorBox.classList.add('show');
        submit.disabled = false; submit.textContent = firstRun ? 'Create owner account' : 'Sign in';
      }
    });
  }
  async function refreshBase() {
    const data = await api('/api/bootstrap');
    state.user = data.user; state.permissions = data.permissions || []; state.settings = data.settings || {}; state.base = data;
  }
  async function enterApplication() {
    try { await refreshBase(); } catch (error) { renderAuth(false); toast(error.message, 'error'); return; }
    renderShell();
    await loadModule(state.active || 'dashboard');
    refreshNotificationCount();
  }
  function navMarkup() {
    return NAV.map(group => {
      const visible = group.items.filter(([key]) => state.permissions.includes(PERM[key]));
      if (!visible.length) return '';
      return `<div class="nav-section">${group.section}</div>${visible.map(([key, title, bangla, ico]) => `<button type="button" class="nav-link ${state.active === key ? 'active' : ''}" data-nav="${key}" title="${title}">${icon(ico)}<span class="nav-label"><span>${title}<small>${bangla}</small></span></span></button>`).join('')}`;
    }).join('');
  }
  function renderShell() {
    const logo = state.settings.logo_data ? `<img src="${escapeHtml(state.settings.logo_data)}" alt="Station logo" style="width:38px;height:38px;object-fit:contain;border-radius:10px;background:#fff;padding:3px">` : `<div class="brand-mark">H</div>`;
    appRoot.innerHTML = `<div class="mobile-overlay ${state.mobileOpen ? 'visible' : ''}" data-action="close-mobile"></div><div class="app-shell">
      <aside class="sidebar ${state.collapsed ? 'collapsed' : ''} ${state.mobileOpen ? 'mobile-open' : ''}" id="sidebar">
        <div class="sidebar-brand">${logo}<div class="brand-copy"><strong>HOK FILLING STATION</strong><span>স্টেশন ব্যবস্থাপনা</span></div><button class="sidebar-toggle" type="button" data-action="collapse" title="Collapse sidebar">${icon('menu',17)}</button></div>
        <nav class="nav-scroll">${navMarkup()}</nav>
        <div class="sidebar-bottom"><div class="sidebar-footer"><div class="sidebar-avatar">${escapeHtml((state.user?.full_name || 'H').slice(0,1).toUpperCase())}</div><div class="sidebar-footer-copy"><strong>${escapeHtml(state.user?.full_name || '')}</strong><span>${escapeHtml((state.user?.role || '').replaceAll('_',' '))}</span></div><button class="sidebar-toggle" data-action="logout" title="Sign out">${icon('close',15)}</button></div></div>
      </aside><main class="main-column"><header class="topbar"><button class="mobile-menu-button" data-action="mobile-menu" aria-label="Open navigation">${icon('menu',19)}</button><div class="topbar-title"><strong id="topbar-page-title">Dashboard</strong><span id="topbar-business">${escapeHtml(state.settings.business_name || '')}</span></div>
      <div class="global-search-wrap"><span class="search-icon">${icon('search',16)}</span><input class="global-search" id="global-search" placeholder="Search memos, customers, vehicles…" autocomplete="off"><span class="search-shortcut">/</span><div class="search-results" id="search-results"></div></div>
      <div class="topbar-actions"><button class="icon-button" data-nav="notifications" aria-label="Notifications" title="Notifications">${icon('bell',16)}<i class="notification-dot" id="notification-dot" style="display:none"></i></button><button class="top-avatar" data-action="user-menu" title="${escapeHtml(state.user?.full_name || '')}">${escapeHtml((state.user?.full_name || 'H').slice(0,1).toUpperCase())}</button></div></header>
      <section class="content-scroll"><div class="view-root" id="view-root"><div class="boot-screen"><span class="boot-spinner"></span></div></div></section></main></div><div id="modal-root"></div>`;
  }
  function navTitle(key) { for (const group of NAV) for (const item of group.items) if (item[0] === key) return item[1]; return key; }
  function pageHeader(title, subtitle, actions = '') {
    return `<div class="page-heading"><div><div class="breadcrumb"><span>HOK</span> / ${escapeHtml(title)}</div><h1>${escapeHtml(title)}</h1><p>${subtitle || ''}</p></div><div class="heading-actions">${actions}</div></div>`;
  }
  function button(label, action, kind = 'secondary', ico = '', extra = '') {
    return `<button type="button" class="btn btn-${kind}" data-action="${action}" ${extra}>${ico ? icon(ico,14) : ''}${label}</button>`;
  }
  function panel(title, subtitle, body, actions = '') {
    return `<section class="panel"><div class="panel-head"><div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${actions ? `<div class="panel-head-actions">${actions}</div>` : ''}</div><div class="panel-body">${body}</div></section>`;
  }
  function statusBadge(status) {
    const value = String(status || '').toLowerCase();
    const klass = ['posted','active','approved','success','verified'].includes(value) ? 'green' : ['cancelled','inactive','rejected','failed'].includes(value) ? 'red' : ['pending','unverified'].includes(value) ? 'amber' : value === 'credit' ? 'blue' : 'gray';
    return `<span class="badge ${klass}">${escapeHtml(status || '—')}</span>`;
  }
  function table(headers, rows, options = {}) {
    if (!rows?.length) return `<div class="empty-state"><div class="empty-icon">${icon(options.emptyIcon || 'report',20)}</div><strong>${escapeHtml(options.emptyTitle || 'No records yet')}</strong><p>${escapeHtml(options.emptyText || 'Records will appear here after they are entered into the system.')}</p>${options.emptyAction || ''}</div>`;
    const head = headers.map(h => `<th class="${h.right ? 'text-right' : ''}">${escapeHtml(h.label)}</th>`).join('') + (options.actions ? '<th>Actions</th>' : '');
    const body = rows.map(row => `<tr data-row-id="${escapeHtml(row.id ?? '')}" class="${row.low_stock ? 'low-stock-row' : ''}">${headers.map(h => {
      const raw = h.render ? h.render(row) : escapeHtml(row[h.key] ?? '—');
      return `<td class="${h.right ? 'numeric' : ''}">${raw}</td>`;
    }).join('')}${options.actions ? `<td><div class="table-actions">${typeof options.actions === 'function' ? options.actions(row) : options.actions}</div></td>` : ''}</tr>`).join('');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><div class="table-footer"><span>${rows.length} ${rows.length === 1 ? 'record' : 'records'}</span><span>Updated from station database</span></div>`;
  }
  function tablePanel(title, subtitle, headers, rows, actions = '', tableActions = null, empty = {}) {
    return `<section class="panel table-panel"><div class="panel-head"><div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div><div class="panel-head-actions">${actions}</div></div>${table(headers, rows, {actions: tableActions, ...empty})}</section>`;
  }
  function kpi(label, value, sub, iconName, color = 'blue', isMoney = true) {
    const display = isMoney ? money(value) : `${number(value)} <span>${label.includes('Stock') ? 'L' : ''}</span>`;
    return `<article class="kpi-card"><div class="kpi-top"><span>${label}</span><span class="kpi-icon ${color}">${icon(iconName,16)}</span></div><div class="kpi-value">${display}</div><div class="kpi-caption">${sub}</div></article>`;
  }
  function chartCard(id, title, subtitle, type = '') {
    return `<section class="panel chart-card ${type}"><div class="panel-head"><div><h3>${title}</h3><p>${subtitle}</p></div><span class="chart-legend"><i class="legend-dot"></i> Actual records</span></div><div class="panel-body"><canvas class="chart" id="${id}" aria-label="${title}"></canvas></div></section>`;
  }
  function periodDates(period) {
    const now = new Date(`${today()}T12:00:00`); let start = new Date(now), end = new Date(now);
    if (period === 'yesterday') { start.setDate(start.getDate()-1); end = new Date(start); }
    if (period === 'week') { const day = (now.getDay()+6)%7; start.setDate(now.getDate()-day); }
    if (period === 'month') start.setDate(1);
    if (period === 'year') start = new Date(now.getFullYear(),0,1);
    if (period === 'custom' && state.start && state.end) return {start: state.start, end: state.end};
    return {start: isoDate(start), end: isoDate(end)};
  }
  async function renderDashboard() {
    const range = periodDates(state.period);
    const data = await api(`/api/dashboard?start=${range.start}&end=${range.end}`); state.dashboardData=data;
    const periodButtons = [['today','Today'],['yesterday','Yesterday'],['week','This week'],['month','This month'],['year','This year'],['custom','Custom']].map(([id,label]) => `<button class="period-pill ${state.period===id?'active':''}" data-period="${id}">${label}</button>`).join('');
    const actions = `<div class="dashboard-toolbar"><div class="period-pills">${periodButtons}</div>${state.period==='custom'?`<div class="date-filter"><input type="date" id="dashboard-start" value="${range.start}"><span>–</span><input type="date" id="dashboard-end" value="${range.end}"><button class="btn btn-secondary btn-sm" data-action="apply-dashboard-range">Apply</button></div>`:''}</div>`;
    const cards = data.cards;
    const body = `<div class="dashboard-note">Showing posted transactions from <strong>${displayDate(range.start)}</strong> to <strong>${displayDate(range.end)}</strong>. No sample or estimated sales have been added.</div>
      <div class="quick-link-row">${button('New memo','new-sale','primary','plus')}${button('Record purchase','new-purchase','secondary','truck')}${button('Cash / due collection','cashbook-entry','secondary','cash')}${button('View reports','nav-reports','quiet','report')}</div>
      <div class="kpi-grid">${kpi('Total Sales',cards.sales,`${cards.sales_count} posted memos`,'receipt','blue')}${kpi('Fuel Sales',cards.fuel_sales,'Diesel, petrol, octane','fuel','navy')}${kpi('Lubricant Sales',cards.lubricant_sales,'Lubricants & products','box','green')}${kpi('Cash Collection',cards.cash_collection,'Cash received in period','cash','green')}${kpi('Credit Sales',cards.credit_sales,'Recorded to customer due','wallet','amber')}${kpi('Customer Due',cards.customer_due,'Current outstanding balance','user','red')}${kpi('Expenses',cards.expenses,'Approved expenses','expense','red')}${kpi('Bank Deposit',cards.bank_deposit,'Cash deposited to bank','bank','blue')}${kpi('Current Fuel Stock',cards.fuel_stock,'Litres · live book stock','fuel','navy',false)}${kpi('Estimated Gross Profit',cards.gross_profit,'Sales less moving-average COGS','chart','green')}${kpi('Net Profit',cards.net_profit,'Gross profit less expenses','chart','navy')}</div>
      <div class="dashboard-grid">${chartCard('chart-daily','Daily Sales','Actual sales by day · selected period','wide')}${chartCard('chart-product','Product-wise Sales','Top products by sales value','narrow')}${chartCard('chart-weekly','Weekly Sales Trend','Posted sales for the last 7 days')}${chartCard('chart-monthly','Monthly Sales Trend','Posted sales for the last 12 months')}${chartCard('chart-expense','Expense Trend','Approved expenses · last 14 days')}${chartCard('chart-profit','Profit Trend','Estimated daily net profit · last 14 days')}</div>`;
    $('#view-root').innerHTML = `${pageHeader('Dashboard', `Live operating picture · ${state.settings.business_address || 'Business settings'}`, actions)}${body}`;
    drawChart('chart-daily',data.charts.daily_sales,'#2b71cc'); drawBars('chart-product',data.charts.product_sales);
    drawChart('chart-weekly',data.charts.weekly_sales,'#31a57c'); drawChart('chart-monthly',data.charts.monthly_sales,'#5887ca');
    drawChart('chart-expense',data.charts.expense_trend,'#e09d3e'); drawChart('chart-profit',data.charts.profit_trend,'#1a9a74');
  }
  function drawChart(id, data, color) {
    const canvas = document.getElementById(id); if (!canvas || !data) return;
    const rect = canvas.getBoundingClientRect(); const dpr = Math.max(1, window.devicePixelRatio || 1); const w = rect.width || 400, h = rect.height || 220;
    canvas.width = w*dpr; canvas.height = h*dpr; const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
    const pad = {l:43,r:8,t:13,b:30}, cw=w-pad.l-pad.r, ch=h-pad.t-pad.b; const vals=data.map(x=>Number(x.value||0));
    const max=Math.max(1,...vals), count=Math.max(1,data.length); ctx.clearRect(0,0,w,h); ctx.font='9px DM Sans, sans-serif'; ctx.fillStyle='#93a0b0'; ctx.strokeStyle='#edf0f4'; ctx.lineWidth=1;
    for(let i=0;i<4;i++){const y=pad.t+ch*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText((max*(1-i/3)).toLocaleString('en-BD',{notation:'compact',maximumFractionDigits:1}),2,y+3);}
    const pts=vals.map((v,i)=>({x:pad.l+(count===1?cw/2:cw*i/(count-1)),y:pad.t+ch-(v/max)*ch}));
    if(pts.length){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,pad.t+ch);ctx.lineTo(pts[0].x,pad.t+ch);ctx.closePath();ctx.fillStyle=color+'17';ctx.fill();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2.8,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.stroke();});}
    const every=Math.max(1,Math.ceil(count/7)); data.forEach((item,i)=>{if(i%every!==0&&i!==count-1)return;const x=pad.l+(count===1?cw/2:cw*i/(count-1));ctx.fillStyle='#8a97a8';ctx.textAlign='center';ctx.fillText(String(item.label).slice(5),x,h-9);});
  }
  function drawBars(id,data){const canvas=document.getElementById(id);if(!canvas)return;const parent=canvas.parentElement;const max=Math.max(1,...(data||[]).map(x=>Number(x.value||0)));parent.innerHTML=(data||[]).length?`<div class="bar-list">${data.map(item=>`<div class="bar-row"><span>${escapeHtml(item.label)}</span><div class="bar-track"><span style="width:${Math.max(2,Number(item.value||0)/max*100)}%"></span></div><strong class="bar-value">${money(item.value)}</strong></div>`).join('')}</div>`:`<div class="empty-state" style="padding:54px 10px"><strong>No sales recorded</strong><p>Product totals appear after posted sales are entered.</p></div>`;}

  async function loadModule(key) {
    state.active = key; state.mobileOpen = false;
    const sidebar = $('#sidebar'); if (sidebar) sidebar.classList.remove('mobile-open');
    const overlay = $('.mobile-overlay'); if (overlay) overlay.classList.remove('visible');
    $$('.nav-link', appRoot).forEach(el => el.classList.toggle('active', el.dataset.nav === key));
    const title = navTitle(key); if ($('#topbar-page-title')) $('#topbar-page-title').textContent = title;
    if ($('#view-root')) $('#view-root').innerHTML = `<div class="boot-screen"><span class="boot-spinner"></span></div>`;
    try {
      if (key === 'dashboard') await renderDashboard();
      else if (key === 'daily_sales') state.isSaleEntry ? await renderSaleEntry() : await renderDailySales();
      else if (key === 'sales_history') await renderSalesHistory();
      else if (key === 'pumps') await renderPumps();
      else if (key === 'meters') await renderMeterReadings();
      else if (key === 'stock') await renderStock();
      else if (key === 'tanks') await renderTanks();
      else if (key === 'purchases') await renderPurchases();
      else if (key === 'suppliers') await renderSuppliers();
      else if (key === 'customers') await renderCustomers();
      else if (key === 'customer_due') await renderCustomerDue();
      else if (key === 'cashbook') await renderCashbook();
      else if (key === 'banks') await renderBanks();
      else if (key === 'expenses') await renderExpenses();
      else if (key === 'employees') await renderEmployees();
      else if (key === 'shifts') await renderShifts();
      else if (key === 'products') await renderProducts();
      else if (key === 'prices') await renderPrices();
      else if (key === 'pnl') await renderProfitLoss();
      else if (key === 'reports') await renderReports();
      else if (key === 'notifications') await renderNotifications();
      else if (key === 'audit') await renderAuditLogs();
      else if (key === 'users') await renderUsers();
      else if (key === 'backups') await renderBackups();
      else if (key === 'settings') await renderSettings();
      else $('#view-root').innerHTML = `${pageHeader(title,'')}<div class="panel panel-body">Module unavailable.</div>`;
    } catch (error) {
      if (error.status === 401) { state.user = null; renderAuth(false); return; }
      $('#view-root').innerHTML = `${pageHeader(title,'')}<section class="panel"><div class="empty-state"><div class="empty-icon">${icon('activity',20)}</div><strong>Could not load this module</strong><p>${escapeHtml(error.message)}</p><button class="btn btn-secondary btn-sm" data-action="reload-module">Try again</button></div></section>`;
      toast(error.message, 'error');
    }
  }
  async function renderDailySales() {
    const rows = await api(`/api/sales?start=${today()}&end=${today()}`);
    const cash = rows.filter(r => r.status === 'posted').reduce((s,r)=>s+Number(r.total||0),0);
    const actions = button('New memo','new-sale','primary','plus') + button('Sales history','nav-sales-history','secondary','history');
    const body = `<div class="stock-summary"><div class="summary-mini"><span>Posted sales today</span><strong>${money(cash)}</strong></div><div class="summary-mini"><span>Posted memos</span><strong>${rows.filter(r=>r.status==='posted').length}</strong></div><div class="summary-mini"><span>Cancelled / reversed</span><strong>${rows.filter(r=>r.status==='cancelled').length}</strong></div></div>
      ${tablePanel('Today’s memos',`Business date · ${displayDate(today())}`,saleHeaders(),rows,button('New memo','new-sale','primary','plus'),saleRowActions,{emptyIcon:'receipt',emptyTitle:'No sales recorded today',emptyText:'Create a memo to record a sale. Only saved transactions are included in business totals.',emptyAction:button('Create first memo','new-sale','primary','plus')})}`;
    $('#view-root').innerHTML = `${pageHeader('Daily Sales','Record fuel and product sales as sequential cash / credit memos.',actions)}${body}`;
  }
  function saleHeaders() {
    return [
      {key:'memo_no',label:'Memo No',render:r=>`<span class="cell-main">${escapeHtml(r.memo_no)}</span>`},
      {key:'date',label:'Date / Time',render:r=>`${displayDate(r.date)}<div class="cell-sub">${escapeHtml((r.time||'').slice(0,5))}</div>`},
      {key:'customer_name',label:'Customer',render:r=>`<span class="cell-main">${escapeHtml(r.customer_name||'Walk-in')}</span><div class="cell-sub">${escapeHtml(r.vehicle_no||'')}</div>`},
      {key:'products',label:'Products',render:r=>escapeHtml(r.products||'—')},
      {key:'quantity',label:'Quantity',right:true,render:r=>number(r.quantity,3)},
      {key:'total',label:'Total',right:true,render:r=>`<span class="cell-main">${money(r.total)}</span>`},
      {key:'payment_type',label:'Payment',render:r=>statusBadge(r.payment_type)},
      {key:'operator_name',label:'Operator',render:r=>escapeHtml(r.operator_name||'—')},
      {key:'status',label:'Status',render:r=>statusBadge(r.status)},
    ];
  }
  function saleRowActions(row) {
    return `<button class="btn btn-quiet btn-sm icon-only" data-action="view-sale" data-id="${row.id}" title="View memo">${icon('eye',14)}</button><button class="btn btn-quiet btn-sm icon-only" data-action="print-sale" data-id="${row.id}" title="Print memo">${icon('print',14)}</button>${row.status==='posted'?`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-sale" data-id="${row.id}" title="Edit">${icon('edit',14)}</button>`:''}`;
  }
  async function renderSalesHistory() {
    const start = state.salesStart || '0001-01-01', end = state.salesEnd || today();
    const q = state.salesQuery || '';
    const payment = state.salesPayment || '';
    const url = `/api/sales?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${q?`&q=${encodeURIComponent(q)}`:''}${payment?`&payment_type=${payment}`:''}`;
    const rows = await api(url);
    const controls = `<div class="table-tools"><div class="table-search">${icon('search',14)}<input id="sales-query" placeholder="Memo, customer or vehicle" value="${escapeHtml(q)}"></div><input type="date" class="filter-date" id="sales-start" value="${start==='0001-01-01'?'':start}" title="Start date"><input type="date" class="filter-date" id="sales-end" value="${end}" title="End date"><select class="filter-select" id="sales-payment"><option value="">All payment types</option>${['cash','credit','bank','mobile','mixed'].map(x=>`<option ${payment===x?'selected':''}>${x}</option>`).join('')}</select><button class="btn btn-secondary btn-sm" data-action="filter-sales">Filter</button><button class="btn btn-quiet btn-sm" data-action="clear-sales-filter">Clear</button></div>`;
    $('#view-root').innerHTML = `${pageHeader('Sales History','Search, view, print or reverse a posted memo. Financial history is retained with an audit trail.',button('New memo','new-sale','primary','plus'))}${tablePanel('Memo register','Cash and credit sales · cancelled records remain visible',saleHeaders(),rows,controls,saleRowActions,{emptyIcon:'receipt',emptyTitle:'No matching sales',emptyText:'Change the date range or search filters, or create a new memo.'})}`;
  }
  async function renderProducts() {
    const rows = await api('/api/products');
    const headers = [
      {key:'id',label:'ID'}, {key:'name',label:'Product',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span>`},
      {key:'category',label:'Category',render:r=>statusBadge(r.category)}, {key:'unit',label:'Unit'},
      {key:'purchase_price',label:'Average cost',right:true,render:r=>money(r.purchase_price)}, {key:'selling_price',label:'Selling price',right:true,render:r=>`<span class="cell-main">${money(r.selling_price)}</span>`},
      {key:'current_stock',label:'Stock',right:true,render:r=>`${number(r.current_stock)} ${escapeHtml(r.unit)}`}, {key:'min_stock',label:'Min. level',right:true,render:r=>number(r.min_stock)},
      {key:'active',label:'Status',render:r=>statusBadge(r.active?'active':'inactive')},
    ];
    const actions = `${state.permissions.includes('products:manage')?button('Add product','add-product','primary','plus'):''}`;
    $('#view-root').innerHTML = `${pageHeader('Products','Catalog, units, moving-average cost and current book stock. Initial names and fuel prices are stored in the database.',actions)}${tablePanel('Product catalogue','Selling price changes are captured in the price history and audit log.',headers,rows,button('Price history','nav-prices','secondary','history'),r=>`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-product" data-id="${r.id}" title="Edit product">${icon('edit',14)}</button>`,{emptyIcon:'box'})}`;
  }
  async function renderPrices() {
    const [products, history] = await Promise.all([api('/api/products'),api('/api/price-history')]);
    const productHeaders=[{key:'name',label:'Product',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span>`},{key:'category',label:'Category',render:r=>statusBadge(r.category)},{key:'unit',label:'Unit'},{key:'selling_price',label:'Current price',right:true,render:r=>`<span class="cell-main">${money(r.selling_price)}</span>`},{key:'updated_at',label:'Last updated',render:r=>escapeHtml(r.updated_at||'—')},{key:'active',label:'Status',render:r=>statusBadge(r.active?'active':'inactive')}];
    const histHeaders=[{key:'effective_at',label:'Changed at'},{key:'product_name',label:'Product',render:r=>`<span class="cell-main">${escapeHtml(r.product_name)}</span>`},{key:'old_price',label:'Previous',right:true,render:r=>money(r.old_price)},{key:'new_price',label:'New price',right:true,render:r=>money(r.new_price)},{key:'user_name',label:'Changed by'},{key:'reason',label:'Reason',render:r=>escapeHtml(r.reason||'—')}];
    const canChange=state.permissions.includes('prices:manage');
    $('#view-root').innerHTML=`${pageHeader('Price Management','Authorized selling-price updates are effective for new memos only. Previous sales retain their saved price.',canChange?button('Update price','choose-price','primary','tag'): '')}${tablePanel('Current selling prices','Rates saved against product master data.',productHeaders,products, '',r=>canChange?`<button class="btn btn-secondary btn-sm" data-action="price-product" data-id="${r.id}">Change price</button>`:'')}${tablePanel('Price history','Historical changes · previous and new values are immutable.',histHeaders,history)}`;
  }
  async function renderStock() {
    const rows=await api(`/api/stock?start=${state.stockStart||today()}&end=${state.stockEnd||today()}`);
    const fuel=rows.filter(r=>r.category==='fuel'); const fuelValue=fuel.reduce((s,r)=>s+Number(r.current_stock||0),0); const low=rows.filter(r=>r.low_stock).length;
    const headers=[{key:'product',label:'Product',render:r=>`<span class="cell-main">${escapeHtml(r.product)}</span><div class="cell-sub">${escapeHtml(r.category)}</div>`},{key:'opening_stock',label:'Opening',right:true,render:r=>number(r.opening_stock)},{key:'purchased',label:'Purchased',right:true,render:r=>number(r.purchased)},{key:'sold',label:'Sold',right:true,render:r=>number(r.sold)},{key:'adjusted',label:'Adjusted',right:true,render:r=>number(r.adjusted)},{key:'closing_book_stock',label:'Closing book',right:true,render:r=>`<span class="cell-main">${number(r.current_stock)} ${escapeHtml(r.unit)}</span>`},{key:'physical_stock',label:'Last physical',right:true,render:r=>r.physical_stock==null?'—':number(r.physical_stock)},{key:'difference',label:'Difference',right:true,render:r=>r.difference==null?'—':`<span class="${r.difference<0?'text-danger':''}">${number(r.difference)}</span>`},{key:'low_stock',label:'Alert',render:r=>r.low_stock?statusBadge('low stock'):statusBadge('normal')}];
    const controls=`<div class="table-tools"><input type="date" class="filter-date" id="stock-start" value="${state.stockStart||today()}"><input type="date" class="filter-date" id="stock-end" value="${state.stockEnd||today()}"><button class="btn btn-secondary btn-sm" data-action="filter-stock">Apply range</button></div>`;
    const actions=`${state.permissions.includes('inventory:adjust')?button('Adjust stock','stock-adjustment','primary','plus'):''}${button('Stock movements','stock-movements','secondary','history')}`;
    $('#view-root').innerHTML=`${pageHeader('Fuel Stock','Book stock is calculated from purchases, posted sales and signed stock adjustments. Physical readings are recorded separately.',actions)}<div class="stock-summary"><div class="summary-mini"><span>Current fuel stock</span><strong>${number(fuelValue)} L</strong></div><div class="summary-mini"><span>Products at / below minimum</span><strong>${low}</strong></div><div class="summary-mini"><span>Physical reading</span><strong>Not auto-verified</strong></div></div>${tablePanel('Inventory position','Historical opening and movement totals for selected business dates.',headers,rows,controls,null,{emptyIcon:'fuel'})}`;
  }
  async function renderTanks() {
    const [tanks,dips]=await Promise.all([api('/api/tanks'),api(`/api/tank-dips?start=${state.tankStart||'0001-01-01'}&end=${state.tankEnd||today()}`)]);
    const tankHeaders=[{key:'tank_number',label:'Tank',render:r=>`<span class="cell-main">${escapeHtml(r.tank_number)}</span>`},{key:'product_name',label:'Product'},{key:'capacity',label:'Capacity',right:true,render:r=>`${number(r.capacity)} ${escapeHtml(r.unit)}`},{key:'book_stock',label:'Tank book quantity',right:true,render:r=>`${number(r.book_stock)} ${escapeHtml(r.unit)}`},{key:'min_level',label:'Minimum',right:true,render:r=>number(r.min_level)},{key:'max_level',label:'Maximum',right:true,render:r=>number(r.max_level)},{key:'active',label:'Status',render:r=>statusBadge(r.active?'active':'inactive')}];
    const dipHeaders=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'tank_number',label:'Tank'},{key:'product_name',label:'Product'},{key:'dip_reading',label:'Dip reading',right:true,render:r=>number(r.dip_reading)},{key:'estimated_quantity',label:'Estimated qty',right:true,render:r=>number(r.estimated_quantity)},{key:'book_stock',label:'Book stock',right:true,render:r=>number(r.book_stock)},{key:'physical_stock',label:'Physical stock',right:true,render:r=>number(r.physical_stock)},{key:'difference',label:'Variance',right:true,render:r=>`${Number(r.difference)>0?'+':''}${number(r.difference)}`},{key:'verified',label:'Verification',render:r=>statusBadge(r.verified?'verified':'unverified')},{key:'operator_name',label:'Operator'}];
    const can=state.permissions.includes('tanks:manage');
    $('#view-root').innerHTML=`${pageHeader('Tank Management','Configure capacity and record daily dips. A physical dip is never treated as verified automatically.',can?button('Add tank','add-tank','primary','plus'):'')}${tablePanel('Tank register','Book quantity follows the product stock ledger; tank mapping is for operational tracking.',tankHeaders,tanks,can?button('Record dip','add-dip','secondary','meter'):'',r=>can?`<button class="btn btn-secondary btn-sm" data-action="edit-tank" data-id="${r.id}">Edit</button>`:'', {emptyIcon:'tank',emptyTitle:'No tanks configured',emptyText:'Add the station tank capacities and assigned products to begin.'})}${tablePanel('Tank dip history','The difference is informative until a manager verifies the measurement.',dipHeaders,dips,can?button('Record dip','add-dip','secondary','plus'):'',r=>can&&!r.verified?`<button class="btn btn-secondary btn-sm" data-action="verify-dip" data-id="${r.id}">Verify</button>`:'', {emptyIcon:'meter',emptyTitle:'No dip readings recorded'})}`;
  }
  async function renderPumps() {
    const pumps=await api('/api/pumps'); const flat=pumps.flatMap(p=>p.nozzles.map(n=>({...n,pump_number:p.pump_number,pump_active:p.active})));
    const pumpHeaders=[{key:'pump_number',label:'Pump number',render:r=>`<span class="cell-main">${escapeHtml(r.pump_number)}</span>`},{key:'active',label:'Status',render:r=>statusBadge(r.active?'active':'inactive')},{key:'nozzle_count',label:'Nozzles',render:r=>pumps.find(p=>p.id===r.id)?.nozzles?.length??0}];
    const nozzleHeaders=[{key:'pump_number',label:'Pump',render:r=>`<span class="cell-main">${escapeHtml(r.pump_number)}</span>`},{key:'nozzle_number',label:'Nozzle'},{key:'product_name',label:'Assigned product'},{key:'last_meter',label:'Last meter',right:true,render:r=>number(r.last_meter)},{key:'tank_number',label:'Tank',render:r=>escapeHtml(r.tank_number||'—')},{key:'active',label:'Status',render:r=>statusBadge(r.active?'active':'inactive')}];
    const can=state.permissions.includes('pumps:manage');
    $('#view-root').innerHTML=`${pageHeader('Pump & Nozzle','Configure pumps, nozzle identifiers and product assignments for the actual station layout.',can?button('Add pump','add-pump','primary','plus'):'')}${tablePanel('Pump register','Pump numbering can match the physical forecourt.',pumpHeaders,pumps,can?button('Add pump','add-pump','secondary','plus'):'',r=>can?`<button class="btn btn-secondary btn-sm" data-action="edit-pump" data-id="${r.id}">Edit</button>`:'',{emptyIcon:'pump',emptyTitle:'No pumps configured'})}${tablePanel('Nozzles','A nozzle may be assigned to one active product.',nozzleHeaders,flat,can?button('Add nozzle','add-nozzle','secondary','plus'):'',r=>can?`<button class="btn btn-secondary btn-sm" data-action="edit-nozzle" data-id="${r.id}">Edit</button>`:'',{emptyIcon:'meter',emptyTitle:'No nozzles configured'})}`;
  }
  async function renderMeterReadings() {
    const start=state.meterStart||'0001-01-01', end=state.meterEnd||today();
    const rows=await api(`/api/meter-readings?start=${start}&end=${end}`);
    const headers=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'shift_name',label:'Shift'},{key:'pump_number',label:'Pump'},{key:'nozzle_number',label:'Nozzle'},{key:'product_name',label:'Product'},{key:'opening_meter',label:'Opening',right:true,render:r=>number(r.opening_meter)},{key:'closing_meter',label:'Closing',right:true,render:r=>number(r.closing_meter)},{key:'sales_liters',label:'Sales litres',right:true,render:r=>number(r.sales_liters)},{key:'rate',label:'Rate',right:true,render:r=>money(r.rate)},{key:'total',label:'Amount',right:true,render:r=>money(r.total)},{key:'operator_name',label:'Operator'}];
    const actions=`${state.permissions.includes('meters:manage')?button('Record meter reading','add-meter','primary','plus'):''}`;
    const tools=`<div class="table-tools"><input type="date" class="filter-date" id="meter-start" value="${start==='0001-01-01'?'':start}"><input type="date" class="filter-date" id="meter-end" value="${end}"><button class="btn btn-secondary btn-sm" data-action="filter-meter">Filter</button></div>`;
    $('#view-root').innerHTML=`${pageHeader('Meter Reading','Sales litres are calculated from closing minus opening. A reading mismatch requires explicit confirmation.',actions)}<div class="form-note">Meter readings are retained as operational readings and do not create a second sale or change stock; enter the memo once in Daily Sales to post its financial and inventory effects.</div>${tablePanel('Meter history','Previous nozzle closing readings are checked before every new entry.',headers,rows,tools,null,{emptyIcon:'meter',emptyTitle:'No meter readings'})}`;
  }
  async function renderPurchases() {
    const rows=await api(`/api/purchases?start=${state.purchaseStart||'0001-01-01'}&end=${state.purchaseEnd||today()}${state.purchaseQuery?`&q=${encodeURIComponent(state.purchaseQuery)}`:''}`);
    const headers=[{key:'invoice_no',label:'Invoice',render:r=>`<span class="cell-main">${escapeHtml(r.invoice_no)}</span><div class="cell-sub">${escapeHtml(r.challan_no||'')}</div>`},{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'supplier_name',label:'Supplier'},{key:'product_name',label:'Product'},{key:'quantity',label:'Quantity',right:true,render:r=>`${number(r.quantity)} ${escapeHtml(r.unit)}`},{key:'purchase_rate',label:'Rate',right:true,render:r=>money(r.purchase_rate)},{key:'total',label:'Total',right:true,render:r=>money(r.total)},{key:'paid',label:'Paid',right:true,render:r=>money(r.paid)},{key:'due',label:'Due',right:true,render:r=>Number(r.due)>0?`<span class="text-danger">${money(r.due)}</span>`:money(0)},{key:'supplier_name',label:'Status',render:r=>statusBadge(r.status)}];
    const actions=`${state.permissions.includes('purchases:create')?button('Record purchase','new-purchase','primary','plus'):''}`;
    const tools=`<div class="table-tools"><div class="table-search">${icon('search',14)}<input id="purchase-query" placeholder="Invoice, supplier, challan" value="${escapeHtml(state.purchaseQuery||'')}"></div><input type="date" class="filter-date" id="purchase-start" value="${state.purchaseStart||''}"><input type="date" class="filter-date" id="purchase-end" value="${state.purchaseEnd||today()}"><button class="btn btn-secondary btn-sm" data-action="filter-purchases">Filter</button></div>`;
    $('#view-root').innerHTML=`${pageHeader('Fuel Purchase','Post supplier invoices to stock using landed cost. Payments and supplier due are recorded separately.',actions)}${tablePanel('Purchase register','Confirmed purchases increase book inventory using moving weighted-average costing.',headers,rows,tools,null,{emptyIcon:'truck',emptyTitle:'No purchases recorded',emptyText:'Add an opening stock purchase or stock adjustment before posting sales.'})}`;
  }
  async function renderSuppliers() {
    const rows=await api('/api/suppliers');
    const headers=[{key:'name',label:'Supplier',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span><div class="cell-sub">${escapeHtml(r.company||'')}</div>`},{key:'phone',label:'Phone'},{key:'address',label:'Address'},{key:'opening_balance',label:'Opening balance',right:true,render:r=>money(r.opening_balance)},{key:'current_due',label:'Current due',right:true,render:r=>`<span class="${r.current_due>0?'cell-main':''}">${money(r.current_due)}</span>`},{key:'status',label:'Status',render:r=>statusBadge(r.status)}];
    const can=state.permissions.includes('suppliers:manage');
    $('#view-root').innerHTML=`${pageHeader('Suppliers','Supplier profiles and purchase payables. Supplier balances are calculated from posted invoices and payments.',can?button('Add supplier','add-supplier','primary','plus'):'')}${tablePanel('Supplier register','Do not change opening balances after transactions; record payments in the supplier ledger.',headers,rows,'',r=>`${can?`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-supplier" data-id="${r.id}" title="Edit">${icon('edit',14)}</button><button class="btn btn-secondary btn-sm" data-action="supplier-payment" data-id="${r.id}">Pay</button>`:''}${state.permissions.includes('reports:view')?`<button class="btn btn-quiet btn-sm icon-only" data-action="supplier-statement" data-id="${r.id}" title="Statement">${icon('eye',14)}</button>`:''}`,{emptyIcon:'users',emptyTitle:'No suppliers added'})}`;
  }
  async function renderCustomers() {
    const rows=await api('/api/customers');
    const headers=[{key:'name',label:'Customer',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span><div class="cell-sub">${escapeHtml(r.customer_type)}</div>`},{key:'phone',label:'Phone'},{key:'vehicle_no',label:'Vehicle'},{key:'address',label:'Address'},{key:'current_due',label:'Current due',right:true,render:r=>`<span class="${r.current_due>0?'cell-main':''}">${money(r.current_due)}</span>`},{key:'last_purchase',label:'Last purchase',render:r=>displayDate(r.last_purchase)},{key:'status',label:'Status',render:r=>statusBadge(r.status)}];
    const can=state.permissions.includes('customers:manage');
    $('#view-root').innerHTML=`${pageHeader('Customers','Search and maintain regular, business, transport and credit customer profiles.',can?button('Add customer','add-customer','primary','plus'):'')}${tablePanel('Customer register','Current due is generated from opening balances, credit memos and collections.',headers,rows,'',r=>`${can?`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-customer" data-id="${r.id}" title="Edit">${icon('edit',14)}</button>`:''}${state.permissions.includes('due:collect')&&r.current_due>0?`<button class="btn btn-secondary btn-sm" data-action="customer-payment" data-id="${r.id}">Collect</button>`:''}${state.permissions.includes('reports:view')?`<button class="btn btn-quiet btn-sm icon-only" data-action="customer-statement" data-id="${r.id}" title="Statement">${icon('eye',14)}</button>`:''}`,{emptyIcon:'user',emptyTitle:'No customers added'})}`;
  }
  async function renderCustomerDue() {
    const rows=(await api('/api/customers')).filter(x=>Number(x.current_due)!==0);
    const headers=[{key:'name',label:'Customer',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span><div class="cell-sub">${escapeHtml(r.phone||'')}</div>`},{key:'vehicle_no',label:'Vehicle'},{key:'customer_type',label:'Type'},{key:'opening_due',label:'Opening due',right:true,render:r=>money(r.opening_due)},{key:'current_due',label:'Outstanding due',right:true,render:r=>`<span class="cell-main">${money(r.current_due)}</span>`},{key:'last_purchase',label:'Last purchase',render:r=>displayDate(r.last_purchase)},{key:'last_payment',label:'Last payment',render:r=>displayDate(r.last_payment)}];
    const actions=`${state.permissions.includes('reports:view')?button('Due report','open-due-report','secondary','report'):''}`;
    $('#view-root').innerHTML=`${pageHeader('Customer Due','Track credit sales and partial payments. Collection receipts reduce due and increase the cash or selected account ledger.',actions)}<div class="form-note">Customer due = opening due + posted credit memos − collections ± audited adjustments. Cash collection is never inferred from credit sales.</div>${tablePanel('Outstanding customers','Balances below zero represent a customer advance / credit balance.',headers,rows,'',r=>`${state.permissions.includes('due:collect')&&r.current_due>0?`<button class="btn btn-primary btn-sm" data-action="customer-payment" data-id="${r.id}">Collect payment</button>`:''}${state.permissions.includes('reports:view')?`<button class="btn btn-quiet btn-sm icon-only" data-action="customer-statement" data-id="${r.id}" title="Statement">${icon('eye',14)}</button>`:''}`,{emptyIcon:'wallet',emptyTitle:'No outstanding balances'})}`;
  }
  async function renderCashbook() {
    const start=state.cashStart||today(),end=state.cashEnd||today();
    const data=await api(`/api/cashbook?start=${start}&end=${end}`);
    const headers=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'type',label:'Entry type',render:r=>`<span class="cell-main">${escapeHtml(String(r.type||'').replaceAll('_',' '))}</span>`},{key:'direction',label:'Direction',render:r=>statusBadge(r.direction==='in'?'income':'outflow')},{key:'amount',label:'Amount',right:true,render:r=>`<span class="cell-main">${money(r.amount)}</span>`},{key:'notes',label:'Description',render:r=>escapeHtml(r.notes||'—')},{key:'shift_name',label:'Shift'},{key:'user_name',label:'Entered by'}];
    const tools=`<div class="table-tools"><input type="date" class="filter-date" id="cash-start" value="${start}"><input type="date" class="filter-date" id="cash-end" value="${end}"><button class="btn btn-secondary btn-sm" data-action="filter-cash">Filter</button></div>`;
    const actions=`${state.permissions.includes('cashbook:manage')?button('Other income','cashbook-entry','primary','plus')+button('Withdrawal','cash-withdrawal','secondary','cash'):''}`;
    $('#view-root').innerHTML=`${pageHeader('Cashbook','Cash and bank remain separate ledgers. Sale collections, due receipts, expenses and deposits post to cash movements.',actions)}<div class="stock-summary"><div class="summary-mini"><span>Opening cash (settings)</span><strong>${money(data.opening_cash)}</strong></div><div class="summary-mini"><span>Cash received in range</span><strong>${money(data.totals.income)}</strong></div><div class="summary-mini"><span>Current cash balance</span><strong>${money(data.totals.balance)}</strong></div></div>${tablePanel('Cash movement ledger','Business date · cash transactions only.',headers,data.rows,tools,null,{emptyIcon:'cash',emptyTitle:'No cash movements'})}`;
  }
  async function renderBanks() {
    const [banks,transactions]=await Promise.all([api('/api/banks'),api(`/api/bank-transactions?start=${state.bankStart||today()}&end=${state.bankEnd||today()}`)]);
    const bankHeaders=[{key:'bank_name',label:'Bank / wallet',render:r=>`<span class="cell-main">${escapeHtml(r.bank_name)}</span><div class="cell-sub">${escapeHtml(r.account_number||'')}</div>`},{key:'account_name',label:'Account name'},{key:'opening_balance',label:'Opening balance',right:true,render:r=>money(r.opening_balance)},{key:'balance',label:'Current balance',right:true,render:r=>`<span class="cell-main">${money(r.balance)}</span>`},{key:'status',label:'Status',render:r=>statusBadge(r.status)}];
    const txHeaders=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'bank_name',label:'Account',render:r=>escapeHtml(r.bank_name|| (r.channel==='mobile'?'Mobile wallet / clearing':'Unassigned'))},{key:'type',label:'Type',render:r=>escapeHtml(String(r.type).replaceAll('_',' '))},{key:'direction',label:'Direction',render:r=>statusBadge(r.direction==='in'?'income':'outflow')},{key:'amount',label:'Amount',right:true,render:r=>money(r.amount)},{key:'slip_no',label:'Slip / Ref',render:r=>escapeHtml(r.slip_no||r.reference||'—')},{key:'shift_name',label:'Shift'},{key:'depositor',label:'Depositor'}];
    const can=state.permissions.includes('banks:manage'); const actions=can?button('Add account','add-bank','secondary','plus')+button('Cash deposit','bank-deposit','primary','bank')+button('Bank adjustment','bank-adjustment','quiet','edit'):'';
    $('#view-root').innerHTML=`${pageHeader('Bank & Deposit','Manage bank and mobile-clearing accounts. A cash deposit transfers cash out and bank balance in.',actions)}${tablePanel('Accounts','Use an account named for each bank or mobile wallet to track collections.',bankHeaders,banks,can?button('Add account','add-bank','secondary','plus'):'',r=>can?`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-bank" data-id="${r.id}">${icon('edit',14)}</button>`:'',{emptyIcon:'bank',emptyTitle:'No bank accounts configured',emptyText:'Add bank and mobile wallet accounts to record non-cash collections.'})}${tablePanel('Bank & mobile transactions','Bank deposits, non-cash sales, customer receipts and payments.',txHeaders,transactions,'',null,{emptyIcon:'cash',emptyTitle:'No bank transactions'})}`;
  }
  async function renderExpenses() {
    const rows=await api(`/api/expenses?start=${state.expenseStart||'0001-01-01'}&end=${state.expenseEnd||today()}${state.expenseStatus?`&status=${state.expenseStatus}`:''}`);
    const headers=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'category',label:'Category',render:r=>`<span class="cell-main">${escapeHtml(r.category)}</span>`},{key:'description',label:'Description',render:r=>escapeHtml(r.description||'—')},{key:'amount',label:'Amount',right:true,render:r=>money(r.amount)},{key:'payment_method',label:'Payment',render:r=>statusBadge(r.payment_method)},{key:'shift_name',label:'Shift'},{key:'paid_to',label:'Paid to'},{key:'voucher_no',label:'Voucher'},{key:'status',label:'Approval',render:r=>statusBadge(r.status)},{key:'created_by_name',label:'Created by'}];
    const controls=`<div class="table-tools"><input type="date" class="filter-date" id="expense-start" value="${state.expenseStart||''}"><input type="date" class="filter-date" id="expense-end" value="${state.expenseEnd||today()}"><select class="filter-select" id="expense-status"><option value="">All approvals</option>${['pending','approved','rejected','reversed'].map(x=>`<option value="${x}" ${state.expenseStatus===x?'selected':''}>${x}</option>`).join('')}</select><button class="btn btn-secondary btn-sm" data-action="filter-expenses">Filter</button></div>`;
    const actions=state.permissions.includes('expenses:manage')?button('Add expense','new-expense','primary','plus'):'';
    $('#view-root').innerHTML=`${pageHeader('Expenses','Operating expenses affect net profit when approved. Pending entries do not post cash or bank outflows.',actions)}${tablePanel('Expense register','Salary, utilities, maintenance, transport and other costs.',headers,rows,controls,r=>r.status==='pending'&&state.permissions.includes('expenses:manage')?`<button class="btn btn-success btn-sm" data-action="approve-expense" data-id="${r.id}">Approve</button><button class="btn btn-danger btn-sm" data-action="reject-expense" data-id="${r.id}">Reject</button>`:r.status==='approved'&&state.permissions.includes('expenses:manage')?`<button class="btn btn-danger btn-sm" data-action="reverse-expense" data-id="${r.id}">Reverse</button>`:'',{emptyIcon:'expense',emptyTitle:'No expenses recorded'})}`;
  }
  async function renderEmployees() {
    const [rows,attendance]=await Promise.all([api('/api/employees'),api(`/api/attendance?start=${state.attendanceStart||today()}&end=${state.attendanceEnd||today()}`)]);
    const headers=[{key:'name',label:'Employee',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span><div class="cell-sub">${escapeHtml(r.designation||'')}</div>`},{key:'phone',label:'Phone'},{key:'address',label:'Address'},{key:'join_date',label:'Joining date',render:r=>displayDate(r.join_date)},{key:'salary',label:'Monthly salary',right:true,render:r=>money(r.salary)},{key:'username',label:'Linked user'},{key:'status',label:'Status',render:r=>statusBadge(r.status)}];
    const attendanceHeaders=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'employee_name',label:'Employee'},{key:'shift_name',label:'Shift'},{key:'status',label:'Attendance',render:r=>statusBadge(r.status)},{key:'check_in',label:'Check in',render:r=>escapeHtml(r.check_in||'—')},{key:'check_out',label:'Check out',render:r=>escapeHtml(r.check_out||'—')},{key:'notes',label:'Notes',render:r=>escapeHtml(r.notes||'—')},{key:'recorded_by',label:'Recorded by'}];
    const actions=button('Add employee','add-employee','secondary','plus')+button('Record attendance','record-attendance','primary','check');
    const tools=`<div class="table-tools"><input type="date" class="filter-date" id="attendance-start" value="${state.attendanceStart||today()}"><input type="date" class="filter-date" id="attendance-end" value="${state.attendanceEnd||today()}"><button class="btn btn-secondary btn-sm" data-action="filter-attendance">Filter</button></div>`;
    $('#view-root').innerHTML=`${pageHeader('Employees & Attendance','Maintain employee records and attendance by station date and shift.',actions)}${tablePanel('Employee register','User access is managed separately in Users & Permissions.',headers,rows,'',r=>`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-employee" data-id="${r.id}" title="Edit">${icon('edit',14)}</button>`,{emptyIcon:'users',emptyTitle:'No employees added'})}${tablePanel('Shift attendance','One attendance record per employee, business date and shift. Re-recording updates the existing entry with an audit event.',attendanceHeaders,attendance,tools,null,{emptyIcon:'clock',emptyTitle:'No attendance recorded'})}`;
  }
  async function renderShifts() {
    const shifts=await api('/api/shifts'); let closings=[];
    if(state.permissions.includes('reports:view')) closings=await api(`/api/shift-closings?start=${state.shiftStart||today()}&end=${state.shiftEnd||today()}`);
    const shiftHeaders=[{key:'name',label:'Shift',render:r=>`<span class="cell-main">${escapeHtml(r.name)}</span>`},{key:'start_time',label:'Starts'},{key:'end_time',label:'Ends'},{key:'closing_count',label:'Closings recorded'},{key:'active',label:'Status',render:r=>statusBadge(r.active?'active':'inactive')}];
    const closeHeaders=[{key:'date',label:'Date',render:r=>displayDate(r.date)},{key:'shift_name',label:'Shift'},{key:'opening_meter',label:'Meter open',right:true,render:r=>number(r.opening_meter)},{key:'closing_meter',label:'Meter close',right:true,render:r=>number(r.closing_meter)},{key:'total_liters',label:'Total litres',right:true,render:r=>number(r.total_liters)},{key:'total_sales',label:'Total sales',right:true,render:r=>money(r.total_sales)},{key:'opening_cash',label:'Opening cash',right:true,render:r=>money(r.opening_cash)},{key:'cash_sales',label:'Cash sales',right:true,render:r=>money(r.cash_sales)},{key:'credit_sales',label:'Credit',right:true,render:r=>money(r.credit_sales)},{key:'expenses',label:'Expenses',right:true,render:r=>money(r.expenses)},{key:'deposits',label:'Deposits',right:true,render:r=>money(r.deposits)},{key:'expected_cash',label:'Expected',right:true,render:r=>money(r.expected_cash)},{key:'closing_cash',label:'Counted',right:true,render:r=>money(r.closing_cash)},{key:'cash_difference',label:'Difference',right:true,render:r=>money(r.cash_difference)}];
    const actions=button('Close shift','close-shift','primary','check')+button('Add shift','add-shift','secondary','plus');
    const tools=`<div class="table-tools"><input type="date" class="filter-date" id="shift-start" value="${state.shiftStart||today()}"><input type="date" class="filter-date" id="shift-end" value="${state.shiftEnd||today()}"><button class="btn btn-secondary btn-sm" data-action="filter-shifts">Filter</button></div>`;
    $('#view-root').innerHTML=`${pageHeader('Shifts','Configure operating hours and reconcile expected versus counted cash at closing.',actions)}${tablePanel('Shift schedule','Default Day and Night schedules can be changed for the station.',shiftHeaders,shifts,'',r=>`<button class="btn btn-quiet btn-sm icon-only" data-action="edit-shift" data-id="${r.id}">${icon('edit',14)}</button>`)}${tablePanel('Shift closing history','Cash difference = counted closing cash − expected cash.',closeHeaders,closings,tools,null,{emptyIcon:'clock',emptyTitle:'No shift closings recorded'})}`;
  }
  async function renderProfitLoss() {
    const start=state.pnlStart||today(),end=state.pnlEnd||today();
    const report=await api(`/api/reports?type=profit_loss&start=${start}&end=${end}`);
    const tableRows=report.rows.map((r,i)=>({id:i+1,...r}));
    const headers=[{key:'line',label:'Statement line',render:r=>`<span class="${['Gross profit','Net profit'].includes(r.line)?'cell-main':''}">${escapeHtml(r.line)}</span>`},{key:'amount',label:'Amount (৳)',right:true,render:r=>`<span class="${['Gross profit','Net profit'].includes(r.line)?'cell-main':''}">${money(r.amount)}</span>`}];
    const tools=`<div class="report-controls"><span style="font-size:10px;color:var(--muted)">Period</span><input type="date" class="filter-date" id="pnl-start" value="${start}"><input type="date" class="filter-date" id="pnl-end" value="${end}"><button class="btn btn-secondary btn-sm" data-action="filter-pnl">Apply</button><button class="btn btn-secondary btn-sm" data-action="pnl-print">${icon('print',13)} Print / PDF</button><button class="btn btn-secondary btn-sm" data-action="pnl-xlsx">${icon('download',13)} Excel</button></div>`;
    const summary=report.summary;
    const summaryCards=`<div class="report-summary"><div class="summary-chip"><span>Total sales · cash + credit</span><strong>${money(summary.sales)}</strong></div><div class="summary-chip"><span>Cost of goods sold</span><strong>${money(summary.cogs)}</strong></div><div class="summary-chip"><span>Gross profit</span><strong>${money(summary.gross_profit)}</strong></div><div class="summary-chip"><span>Operating expenses</span><strong>${money(summary.expenses)}</strong></div><div class="summary-chip"><span>Net profit</span><strong>${money(summary.net_profit)}</strong></div></div>`;
    $('#view-root').innerHTML=`${pageHeader('Profit & Loss','Accrual-style sales revenue includes cash and credit. COGS uses the moving weighted-average inventory cost.',button('Open Reports Center','nav-reports','secondary','report'))}${summaryCards}${tablePanel('Profit and loss statement',`${displayDate(start)} — ${displayDate(end)} · Operating income shown separately.`,headers,tableRows,tools)}`;
  }
  const REPORT_TYPES = [
    ['daily_sales','Daily Sales Report'],['daily_closing','Daily Closing Report'],['product_sales','Product-wise Sales'],['pump_sales','Pump-wise Sales'],['nozzle_sales','Nozzle-wise Sales'],['shift_sales','Shift-wise Sales'],['meter_readings','Meter Reading Report'],['fuel_stock','Fuel Stock Report'],['tank_dips','Tank Dip Report'],['purchases','Purchase Report'],['supplier_due','Supplier Due Report'],['customer_due','Customer Due Report'],['customer_statement','Customer Statement'],['cashbook','Cashbook'],['bank_deposits','Bank Deposit Report'],['expenses','Expense Report'],['profit_loss','Profit & Loss'],['employee_activity','Employee Activity'],['audit_logs','Audit Log Report'],['price_changes','Price Change Report'],
  ];
  async function renderReports() {
    const type=state.reportType||'daily_sales';const start=state.reportStart||today(),end=state.reportEnd||today();
    const customer=state.reportCustomer||'';
    const url=`/api/reports?type=${type}&start=${start}&end=${end}${type==='customer_statement'&&customer?`&customer_id=${customer}`:''}`;
    const report=await api(url);state.report=report;
    const hasCustomer=type==='customer_statement';
    const controls=`<div class="report-controls"><select class="filter-select" id="report-type">${REPORT_TYPES.map(([id,label])=>`<option value="${id}" ${type===id?'selected':''}>${label}</option>`).join('')}</select>${hasCustomer?`<select class="filter-select" id="report-customer"><option value="">Select customer…</option>${(state.base.customers||[]).map(c=>`<option value="${c.id}" ${String(customer)===String(c.id)?'selected':''}>${escapeHtml(c.name)}${c.vehicle_no?` · ${escapeHtml(c.vehicle_no)}`:''}</option>`).join('')}</select>`:''}<input type="date" class="filter-date" id="report-start" value="${start}"><input type="date" class="filter-date" id="report-end" value="${end}"><button class="btn btn-secondary btn-sm" data-action="apply-report">Apply</button><button class="btn btn-secondary btn-sm" data-action="print-report">${icon('print',13)} Print / PDF</button><button class="btn btn-secondary btn-sm" data-action="export-report" data-format="xlsx">${icon('download',13)} Excel</button><button class="btn btn-quiet btn-sm" data-action="export-report" data-format="csv">CSV</button></div>`;
    const rows=report.rows.map((r,i)=>({id:i+1,...r}));
    const headers=report.columns.map(c=>({key:c.key,label:c.label,render:r=>{
      const v=r[c.key];if(v==null||v==='')return '—'; if(typeof v==='object')return `<span class="cell-sub">${escapeHtml(JSON.stringify(v))}</span>`;
      if(['status','verified','payment_type','direction'].includes(c.key)&&typeof v==='string')return statusBadge(v);
      if(typeof v==='number'&&/amount|total|price|rate|sales|profit|due|paid|credit|debit|balance|cogs|cash|expense|opening|closing|difference/i.test(c.key))return money(v);
      if(/date/.test(c.key)&&/^\d{4}-\d{2}-\d{2}/.test(String(v)))return displayDate(v);
      return escapeHtml(String(v));
    }}));
    const summary=Object.entries(report.summary||{}).filter(([k,v])=>typeof v==='number').map(([k,v])=>`<div class="summary-chip"><span>${escapeHtml(k.replaceAll('_',' '))}</span><strong>${money(v)}</strong></div>`).join('');
    $('#view-root').innerHTML=`${pageHeader('Reports Center','Choose a report, date range and filters. Export files contain records from the real station database.', '')}${controls}${summary?`<div class="report-summary" style="margin-top:13px">${summary}</div>`:''}${tablePanel(report.title,`${displayDate(start)} — ${displayDate(end)} · Generated ${displayDate(today())} · ${escapeHtml(state.user.full_name)}`,headers,rows,'',null,{emptyIcon:'report',emptyTitle:'No data for this report',emptyText:'Try a wider date range or select a different report.'})}`;
  }
  async function renderNotifications() {
    const data=await api('/api/notifications');const items=data.items||[];
    $('#view-root').innerHTML=`${pageHeader('Notifications','Operational exceptions are generated from current stock, balances, approvals and close records.',button('Refresh','reload-module','secondary','history'))}<section class="panel"><div class="panel-head"><div><h3>Station alerts</h3><p>${items.length} active notification${items.length===1?'':'s'}</p></div></div>${items.length?`<div class="notification-list">${items.map(item=>`<div class="notification-item"><div class="notification-icon ${item.priority}">${icon(item.kind==='low_stock'?'fuel':item.kind.includes('due')?'wallet':item.kind==='missing_shift_close'?'clock':item.kind==='failed_backup'?'backup':'activity',15)}</div><div class="notification-text"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.message)}</span><small>${displayDate(item.date)} · ${escapeHtml(item.module.replaceAll('_',' '))}</small></div><button class="btn btn-quiet btn-sm" data-action="notification-module" data-module="${escapeHtml(item.module)}">Open</button></div>`).join('')}</div>`:`<div class="empty-state"><div class="empty-icon">${icon('check',20)}</div><strong>No active alerts</strong><p>Low stock, outstanding balance and missing shift closure alerts will appear here.</p></div>`}</section>`;
  }
  async function refreshNotificationCount() {
    if(!state.permissions.includes('notifications:view'))return;
    try{const data=await api('/api/notifications');const dot=$('#notification-dot');if(dot)dot.style.display=data.count?'block':'none';}catch(_e){}
  }
  async function renderAuditLogs() {
    const start=state.auditStart||'0001-01-01',end=state.auditEnd||today();
    const rows=await api(`/api/audit-logs?start=${start}&end=${end}${state.auditQuery?`&q=${encodeURIComponent(state.auditQuery)}`:''}`);
    const headers=[{key:'timestamp',label:'Date & time',render:r=>`${displayDate((r.timestamp||'').slice(0,10))}<div class="cell-sub">${escapeHtml((r.timestamp||'').slice(11,19))}</div>`},{key:'user_name',label:'User',render:r=>`<span class="cell-main">${escapeHtml(r.user_name||'System')}</span>`},{key:'action',label:'Action',render:r=>statusBadge(r.action)},{key:'module',label:'Module'},{key:'record_id',label:'Record ID'},{key:'previous_value',label:'Previous',render:r=>r.previous_value?`<span class="cell-sub">${escapeHtml(JSON.stringify(r.previous_value).slice(0,120))}</span>`:'—'},{key:'new_value',label:'New value',render:r=>r.new_value?`<span class="cell-sub">${escapeHtml(JSON.stringify(r.new_value).slice(0,120))}</span>`:'—'},{key:'reason',label:'Reason',render:r=>escapeHtml(r.reason||'—')}];
    const tools=`<div class="table-tools"><div class="table-search">${icon('search',14)}<input id="audit-query" placeholder="User, action, module" value="${escapeHtml(state.auditQuery||'')}"></div><input type="date" class="filter-date" id="audit-start" value="${start==='0001-01-01'?'':start}"><input type="date" class="filter-date" id="audit-end" value="${end}"><button class="btn btn-secondary btn-sm" data-action="filter-audit">Filter</button></div>`;
    $('#view-root').innerHTML=`${pageHeader('Audit Logs','Append-only record of financially important changes. Normal users cannot delete audit history.',button('Export report','nav-reports','secondary','report'))}${tablePanel('Activity trail','User · timestamp · action · module · previous / new value · reason',headers,rows,tools,null,{emptyIcon:'shield',emptyTitle:'No audit events in this range'})}`;
  }
  async function renderUsers() {
    const [users, rolesData]=await Promise.all([api('/api/users'),api('/api/roles')]);state.rolesData=rolesData;
    const headers=[{key:'full_name',label:'User',render:r=>`<span class="cell-main">${escapeHtml(r.full_name)}</span><div class="cell-sub">@${escapeHtml(r.username)}</div>`},{key:'role',label:'Role',render:r=>statusBadge((rolesData.roles.find(x=>x.name===r.role)?.label)||r.role)},{key:'is_active',label:'Status',render:r=>statusBadge(r.is_active?'active':'inactive')},{key:'created_at',label:'Created',render:r=>displayDate((r.created_at||'').slice(0,10))},{key:'last_login',label:'Last sign in',render:r=>r.last_login?`${displayDate(r.last_login.slice(0,10))} <span class="cell-sub">${escapeHtml(r.last_login.slice(11,16))}</span>`:'Never'}];
    const action=button('Add user','add-user','primary','plus');
    const roles=`<div class="panel" style="margin-top:16px"><div class="panel-head"><div><h3>Role permissions</h3><p>Configure each role’s module capabilities. Owner permissions remain full access.</p></div></div><div class="panel-body"><div class="role-head"><select id="role-select" class="filter-select">${rolesData.roles.map(r=>`<option value="${r.name}">${escapeHtml(r.label)}</option>`).join('')}</select><button class="btn btn-secondary btn-sm" data-action="edit-role-permissions">Configure permissions</button></div><div id="role-permission-preview"></div></div></div>`;
    $('#view-root').innerHTML=`${pageHeader('Users & Permissions','Password hashes are stored server-side. Use individual accounts and least-privilege roles.',action)}${tablePanel('Application users','Inactive accounts cannot sign in.',headers,users,'',r=>`<button class="btn btn-secondary btn-sm" data-action="edit-user" data-id="${r.id}">Edit access</button>`)}${roles}`;
    $('#role-select')?.addEventListener('change',showRolePreview);showRolePreview();
  }
  function showRolePreview(){const role=$('#role-select')?.value,record=state.rolesData?.roles?.find(r=>r.name===role);const el=$('#role-permission-preview');if(!el||!record)return;el.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap">${record.permissions.map(p=>`<span class="badge blue">${escapeHtml(state.rolesData.permission_labels[p]||p)}</span>`).join('')}</div>`;}
  async function renderBackups() {
    const rows=await api('/api/backups');const headers=[{key:'created_at',label:'Created',render:r=>`${displayDate((r.created_at||'').slice(0,10))}<div class="cell-sub">${escapeHtml((r.created_at||'').slice(11,19))}</div>`},{key:'filename',label:'Backup file',render:r=>`<span class="cell-main">${escapeHtml(r.filename)}</span>`},{key:'backup_type',label:'Type',render:r=>statusBadge(r.backup_type)},{key:'size_bytes',label:'Size',right:true,render:r=>r.size_bytes?`${(Number(r.size_bytes)/1024/1024).toFixed(2)} MB`:'—'},{key:'status',label:'Status',render:r=>statusBadge(r.status)},{key:'created_by_name',label:'Created by',render:r=>escapeHtml(r.created_by_name||'Automatic')},{key:'message',label:'Details',render:r=>escapeHtml(r.message||'—')}];
    const actions=button('Create backup now','create-backup','primary','backup');
    $('#view-root').innerHTML=`${pageHeader('Backup & Restore','Create encrypted-at-rest local database snapshots, download them securely and restore a selected snapshot.',actions)}<div class="form-note"><strong>Daily automatic backup is ${state.settings.backup_auto==='1'?'enabled':'disabled'}.</strong> Backup files remain inside the server data directory and are not public URLs. Before restore, the current database is copied as a safety backup.</div>${tablePanel('Backup history','SQLite online backups include business records and configuration.',headers,rows,'',r=>r.status==='success'?`<a class="btn btn-secondary btn-sm" href="${r.download_url}" download>Download</a><button class="btn btn-danger btn-sm" data-action="restore-backup" data-id="${r.id}">Restore</button>`:'',{emptyIcon:'backup',emptyTitle:'No backups yet',emptyText:'Create a manual backup to start a restore history.'})}`;
  }
  async function renderSettings() {
    const s=await api('/api/settings');state.settings=s;
    const businessFields=[['business_name','Business name','text'],['dealer_name','Dealer / company','text'],['business_address','Station address','text'],['country','Country','text'],['currency','Currency symbol','text'],['timezone','Timezone','text'],['language','Primary language','text'],['contact_phone','Contact phone','text'],['contact_mobile','Mobile number','text']];
    const memoFields=[['memo_prefix','Memo prefix','text'],['memo_start','Starting memo number','number'],['memo_format','Memo format','text']];
    const fieldHtml=([key,label,type])=>`<div class="field"><label for="setting-${key}">${label}</label><input id="setting-${key}" name="${key}" type="${type}" value="${escapeHtml(s[key]||'')}" ${key==='memo_start'&&Number(s.memo_next)!==Number(s.memo_start)?'disabled title="Sequence already issued; starting number is locked"':''}></div>`;
    const hasIssued=Number(s.memo_next)!==Number(s.memo_start);
    $('#view-root').innerHTML=`${pageHeader('Settings','Business identity, contact details, memo numbering, cash opening and automatic backups are stored in the database.',button('Save settings','save-settings','primary','check'))}<div class="settings-grid">
      <section class="panel settings-card"><h3>Business identity</h3><p>Displayed on receipts, printed reports and the application shell.</p><form id="business-settings-form"><div class="form-grid">${businessFields.map(fieldHtml).join('')}<div class="field full"><label for="setting-logo">Business logo</label><div style="display:flex;align-items:center;gap:12px"><img class="settings-logo-preview" id="logo-preview" src="${s.logo_data?escapeHtml(s.logo_data):'/static/favicon.svg'}" alt="Logo preview"><input id="setting-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div><span class="hint">PNG, JPEG, WebP or SVG · max 1 MB. The memo header logo is editable here.</span></div></div></form></section>
      <section class="panel settings-card"><h3>Memo & transaction defaults</h3><p>Memo numbers are sequential and unique. The starting number locks after the first memo.</p><form id="memo-settings-form"><div class="form-grid">${memoFields.map(fieldHtml).join('')}<div class="field"><label for="setting-opening_cash">Opening cash (৳)</label><input id="setting-opening_cash" name="opening_cash" type="number" min="0" step="0.01" value="${escapeHtml(s.opening_cash)}"></div><div class="field"><label for="setting-due_warning">Customer due alert threshold (৳)</label><input id="setting-due_warning" name="due_warning" type="number" min="0" step="0.01" value="${escapeHtml(s.due_warning)}"></div><div class="field"><label for="setting-backup_auto">Automatic daily backup</label><select id="setting-backup_auto" name="backup_auto"><option value="1" ${s.backup_auto==='1'?'selected':''}>Enabled</option><option value="0" ${s.backup_auto==='0'?'selected':''}>Disabled</option></select></div></div><div class="form-note">Memo format uses <code>{prefix}</code> and <code>{number}</code>. Example: prefix <code>HOK-</code> and format <code>{prefix}{number}</code> produces HOK-80681.</div></form></section></div><div class="form-footer" style="margin-top:14px"><button class="btn btn-primary" data-action="save-settings">${icon('check',14)} Save all settings</button></div>`;
    $('#setting-logo')?.addEventListener('change', async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>1024*1024){toast('Logo must be smaller than 1 MB.','error');e.target.value='';return;}const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});state.pendingLogo=data;$('#logo-preview').src=data;});
  }
  async function startNewMemo(source = null) {
    state.saleEdit = source || null; state.isSaleEntry = true; await loadModule('daily_sales');
  }
  async function editMemo(saleId) {
    const sale=await api(`/api/sales/${saleId}`);state.saleEdit=sale;state.isSaleEntry=true;await loadModule('daily_sales');
  }
  function bengaliPayment(type) { return ({cash:'ক্যাশ',credit:'ক্রেডিট',bank:'ব্যাংক',mobile:'মোবাইল ব্যাংকিং',mixed:'মিশ্র'})[type]||'ক্যাশ'; }
  async function renderSaleEntry() {
    const sale=state.saleEdit||{}; const products=(state.base.products||[]).filter(p=>p.active); const productOpts=products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} · ${money(p.selling_price)}/${escapeHtml(p.unit)}</option>`).join('');
    const customers=(state.base.customers||[]).map(c=>`<option value="${c.id}" ${String(sale.customer_id)===String(c.id)?'selected':''}>${escapeHtml(c.name)}${c.vehicle_no?` · ${escapeHtml(c.vehicle_no)}`:''}</option>`).join('');
    const pumps=(state.base.pumps||[]).filter(p=>p.active).map(p=>`<option value="${p.id}" ${String(sale.pump_id)===String(p.id)?'selected':''}>Pump ${escapeHtml(p.pump_number)}</option>`).join('');
    const shifts=(state.base.shifts||[]).filter(x=>x.active).map(s=>`<option value="${s.id}" ${String(sale.shift_id)===String(s.id)?'selected':''}>${escapeHtml(s.name)} · ${escapeHtml(s.start_time)}–${escapeHtml(s.end_time)}</option>`).join('');
    const operators=(state.base.employees||[]).map(e=>`<option value="${e.id}" ${String(sale.operator_id)===String(e.id)?'selected':''}>${escapeHtml(e.name)}${e.designation?` · ${escapeHtml(e.designation)}`:''}</option>`).join('');
    const accounts=(state.base.banks||[]).map(b=>`<option value="${b.id}" ${String(sale.bank_account_id)===String(b.id)?'selected':''}>${escapeHtml(b.bank_name)} · ${escapeHtml(b.account_name)}</option>`).join('');
    const editableRate=state.permissions.includes('prices:manage');
    const lines=sale.items?.length?sale.items:[{}];
    const actions=`<button class="btn btn-secondary" data-action="cancel-sale-entry">Cancel</button><button class="btn btn-primary" data-action="save-sale">${icon('check',14)} Save memo</button>`;
    $('#view-root').innerHTML=`${pageHeader(sale.id?'Edit Cash / Credit Memo':'New Cash / Credit Memo','Automatic memo number · quantities × saved selling rate · customer credit posts to the due ledger.',actions)}
    <div class="memo-layout"><section class="panel"><div class="panel-head"><div><h3>${sale.id?`Edit memo ${escapeHtml(sale.memo_no)}`:'Memo details'}</h3><p>One invoice can contain multiple products.</p></div><span class="memo-type-chip" id="memo-type-chip">${bengaliPayment(sale.payment_type||'cash')}</span></div><div class="panel-body"><form id="sale-form" autocomplete="off">
      <div class="form-grid cols-3"><div class="field"><label for="sale-date">Date</label><input id="sale-date" name="date" type="date" value="${escapeHtml(sale.date||today())}" required></div><div class="field"><label for="sale-time">Time</label><input id="sale-time" name="time" type="time" value="${escapeHtml((sale.time||state.base.time||new Date().toTimeString().slice(0,5)).slice(0,5))}" required></div><div class="field"><label for="sale-payment-type">Payment type</label><select id="sale-payment-type" name="payment_type"><option value="cash">Cash · ক্যাশ</option><option value="credit">Credit · ক্রেডিট</option><option value="bank">Bank</option><option value="mobile">Mobile banking</option><option value="mixed">Mixed split</option></select></div>
      <div class="field"><label for="sale-customer">Customer</label><select id="sale-customer" name="customer_id"><option value="">Walk-in customer</option>${customers}</select></div><div class="field"><label for="sale-vehicle">Vehicle number</label><input id="sale-vehicle" name="vehicle_no" value="${escapeHtml(sale.vehicle_no||'')}" placeholder="e.g. ঢাকা মেট্রো-গ ১২-৩৪৫৬"></div><div class="field"><label for="sale-shift">Shift</label><select id="sale-shift" name="shift_id"><option value="">No shift selected</option>${shifts}</select></div>
      <div class="field"><label for="sale-pump">Pump</label><select id="sale-pump" name="pump_id"><option value="">No pump selected</option>${pumps}</select></div><div class="field"><label for="sale-nozzle">Nozzle</label><select id="sale-nozzle" name="nozzle_id"><option value="">No nozzle selected</option></select></div><div class="field"><label for="sale-operator">Employee / operator</label><select id="sale-operator" name="operator_id"><option value="">Not assigned</option>${operators}</select></div></div>
      <div class="field full"><label>Products</label><div class="memo-line-head"><span>Product</span><span>Qty</span><span>Rate (৳)</span><span class="text-right">Amount</span><span></span></div><div class="memo-line-list" id="memo-lines"></div><button class="btn btn-secondary btn-sm" style="margin-top:9px" type="button" data-action="add-memo-line">${icon('plus',13)} Add product</button></div>
      <div class="memo-totals"><span class="memo-total-label">Grand total</span><strong class="memo-total-value" id="sale-total">${money(sale.total||0)}</strong></div>
      <div class="form-section-title">Payment split</div><div class="payment-grid"><div class="field"><label for="sale-cash">Cash received</label><input id="sale-cash" name="paid_cash" type="number" min="0" step="0.01" value="${escapeHtml(sale.paid_cash??(sale.id?'0.00':''))}"></div><div class="field"><label for="sale-credit">Credit due</label><input id="sale-credit" name="credit" type="number" min="0" step="0.01" value="${escapeHtml(sale.credit??(sale.id?'0.00':''))}"></div><div class="field"><label for="sale-bank">Bank</label><input id="sale-bank" name="paid_bank" type="number" min="0" step="0.01" value="${escapeHtml(sale.paid_bank??(sale.id?'0.00':''))}"></div><div class="field"><label for="sale-mobile">Mobile</label><input id="sale-mobile" name="paid_mobile" type="number" min="0" step="0.01" value="${escapeHtml(sale.paid_mobile??(sale.id?'0.00':''))}"></div></div>
      <div class="field" style="margin-top:13px"><label for="sale-account">Bank / mobile receiving account</label><select id="sale-account" name="bank_account_id"><option value="">Select when payment includes bank / mobile</option>${accounts}</select><span class="hint">Bank or mobile collections are recorded against this account. Add a bank or mobile wallet under Bank & Deposit first.</span></div>
      <div class="field"><label for="sale-notes">Notes</label><textarea id="sale-notes" name="notes" rows="2" placeholder="Optional notes">${escapeHtml(sale.notes||'')}</textarea></div>
      <div class="balance-line"><span>Payment split must equal memo total</span><strong id="payment-balance">৳0.00 remaining</strong></div>
      <div class="form-footer"><button class="btn btn-secondary" type="button" data-action="cancel-sale-entry">Cancel</button><button class="btn btn-secondary" type="button" data-action="save-sale-print">${icon('print',14)} Save & Print</button><button class="btn btn-primary" type="button" data-action="save-sale">${icon('check',14)} ${sale.id?'Save changes':'Save memo'}</button></div></form></div></section>
      <div class="memo-preview-box"><div class="panel"><div class="panel-head"><div><h3>Memo preview</h3><p>Printed memo follows the station paper layout.</p></div></div><div class="panel-body"><div class="memo-preview-paper" id="memo-live-preview"></div><p class="mini-help">Final print includes all 12 Bangla product rows, memo number and signature spaces.</p></div></div></div></div>`;
    const type=$('#sale-payment-type');type.value=sale.payment_type||'cash';
    const holder=$('#memo-lines');
    lines.forEach(line=>addMemoLine(line));
    fillNozzles(sale.pump_id,sale.nozzle_id);
    syncSaleTotals(); updateSalePreview();
    // Restore typed split after the initial preview calculation.
    if(!sale.id){setPaymentMode(type.value);} else updatePaymentBalance();
  }
  function addMemoLine(item={}) {
    const host=$('#memo-lines');if(!host)return;
    const products=(state.base.products||[]).filter(p=>p.active);
    const line=document.createElement('div');line.className='memo-line';line.innerHTML=`<select class="line-product" aria-label="Product"><option value="">Select product…</option>${products.map(p=>`<option value="${p.id}" ${String(item.product_id)===String(p.id)?'selected':''}>${escapeHtml(p.name)} · ${escapeHtml(p.unit)}</option>`).join('')}</select><input class="line-quantity" type="number" min="0.001" step="0.001" placeholder="0.000" value="${escapeHtml(item.quantity??'')}" aria-label="Quantity"><input class="line-rate" type="number" min="0" step="0.01" placeholder="0.00" value="${escapeHtml(item.rate??'')}" aria-label="Rate" ${state.permissions.includes('prices:manage')?'':'readonly'}><span class="line-amount">৳0.00</span><button type="button" class="btn btn-quiet btn-sm icon-only" data-action="remove-memo-line" title="Remove product">${icon('close',14)}</button>`;
    host.append(line);
    if(item.product_id){const product=products.find(p=>String(p.id)===String(item.product_id));if(product&&!item.rate) $('.line-rate',line).value=product.selling_price;}
  }
  function fillNozzles(pumpId,selected='') {
    const select=$('#sale-nozzle');if(!select)return;const list=(state.base.nozzles||[]).filter(n=>String(n.pump_id)===String(pumpId||'')&&n.active);
    select.innerHTML=`<option value="">No nozzle selected</option>${list.map(n=>`<option value="${n.id}" ${String(n.id)===String(selected)?'selected':''}>${escapeHtml(n.nozzle_number)} · ${escapeHtml(n.product_name)}${n.tank_number?` · ${escapeHtml(n.tank_number)}`:''}</option>`).join('')}`;
  }
  function productFor(id){return (state.base.products||[]).find(p=>String(p.id)===String(id));}
  function syncSaleTotals() {
    let total=0;$$('.memo-line','#memo-lines').forEach(line=>{const qty=Number($('.line-quantity',line).value||0),rate=Number($('.line-rate',line).value||0),sum=Math.round((qty*rate+Number.EPSILON)*100)/100;total+=sum;$('.line-amount',line).textContent=money(sum);});
    total=Math.round(total*100)/100;const totalEl=$('#sale-total');if(totalEl)totalEl.textContent=money(total);
    const mode=$('#sale-payment-type')?.value||'cash';if(mode!=='mixed'&&!state.saleEdit?.id)setPaymentMode(mode,total);else updatePaymentBalance(total);
    updateSalePreview(total);
  }
  function setPaymentMode(mode,total=null) {
    const totalValue=total??Number(($$('#memo-line').reduce?.(()=>0,0))||0);
    const actual=total===null?calcSaleTotal():totalValue;
    const fields={cash:$('#sale-cash'),credit:$('#sale-credit'),bank:$('#sale-bank'),mobile:$('#sale-mobile')};
    if(mode==='mixed')return;
    Object.entries(fields).forEach(([key,el])=>{if(el)el.value=key===mode&&actual?actual.toFixed(2):'0.00';});
    updatePaymentBalance(actual);
  }
  function calcSaleTotal(){return $$('.memo-line','#memo-lines').reduce((s,line)=>s+Number($('.line-quantity',line).value||0)*Number($('.line-rate',line).value||0),0);}
  function updatePaymentBalance(total=calcSaleTotal()) {
    const paid=['sale-cash','sale-credit','sale-bank','sale-mobile'].reduce((sum,id)=>sum+Number($('#'+id)?.value||0),0);const diff=Math.round((total-paid)*100)/100;
    const el=$('#payment-balance');if(el){el.textContent=diff===0?'Balanced':`${diff>0?money(diff)+' remaining':money(-diff)+' over'}`;el.style.color=diff===0?'var(--green)':diff>0?'var(--amber)':'var(--red)';}
    const type=$('#sale-payment-type');const chip=$('#memo-type-chip');if(chip&&type)chip.textContent=bengaliPayment(type.value);
  }
  function updateSalePreview(total=calcSaleTotal()) {
    const preview=$('#memo-live-preview');if(!preview)return;
    const items=$$('.memo-line','#memo-lines').map(line=>{const product=productFor($('.line-product',line).value);const qty=Number($('.line-quantity',line).value||0),rate=Number($('.line-rate',line).value||0);return {product,qty,rate,amount:qty*rate};}).filter(x=>x.product&&x.qty>0);
    const type=$('#sale-payment-type')?.value||'cash';const settings=state.settings;
    const rows=items.map(x=>`<tr><td>${escapeHtml(x.product.name)}</td><td style="text-align:right">${number(x.qty)}</td><td style="text-align:right">${money(x.rate)}</td><td style="text-align:right">${money(x.amount)}</td><td></td></tr>`).join('');
    preview.innerHTML=`<div class="memo-preview-title">ক্যাশ / ক্রেডিট মেমো</div><div class="memo-preview-heading">${escapeHtml(settings.business_name||'মেসার্স হক ফিলিং স্টেশন')}<div class="memo-preview-dealer">ডিলার : ${escapeHtml(settings.dealer_name||'যমুনা অয়েল কোম্পানি লিঃ')}</div><div class="memo-preview-dealer">${escapeHtml(settings.business_address||'')}</div></div><div class="memo-preview-meta"><span>নং ${escapeHtml(state.saleEdit?.memo_no||'—')}</span><span>${bengaliPayment(type)}</span></div><div class="memo-preview-meta"><span>গাড়ি নং: ${escapeHtml($('#sale-vehicle')?.value||'____________')}</span><span>তারিখ: ${displayDate($('#sale-date')?.value||today())}</span></div><table class="memo-preview-table"><thead><tr><th>বিবরণ</th><th>লিটার</th><th>দর</th><th>টাকা</th><th>পঃ</th></tr></thead><tbody>${rows||`<tr><td colspan="5" style="text-align:center;color:#999">পণ্য যোগ করুন</td></tr>`}</tbody></table><div class="memo-preview-total">মোট = ${money(total)}</div><div class="memo-preview-sign"><span>ক্রেতার স্বাক্ষর</span><span>বিক্রেতার স্বাক্ষর</span></div>`;
  }
  async function saveMemo(printAfter=false) {
    const form=$('#sale-form');if(!form)return;const lines=$$('.memo-line','#memo-lines').map(line=>({product_id:$('.line-product',line).value,quantity:$('.line-quantity',line).value,rate:$('.line-rate',line).value})).filter(x=>x.product_id&&Number(x.quantity)>0);
    const body={date:$('#sale-date').value,time:$('#sale-time').value,customer_id:$('#sale-customer').value||null,vehicle_no:$('#sale-vehicle').value,pump_id:$('#sale-pump').value||null,nozzle_id:$('#sale-nozzle').value||null,shift_id:$('#sale-shift').value||null,operator_id:$('#sale-operator').value||null,payment_type:$('#sale-payment-type').value,paid_cash:$('#sale-cash').value||0,credit:$('#sale-credit').value||0,paid_bank:$('#sale-bank').value||0,paid_mobile:$('#sale-mobile').value||0,bank_account_id:$('#sale-account').value||null,notes:$('#sale-notes').value,items:lines,reason:state.saleEdit?.id?'Updated memo details':''};
    if(lines.length===0){toast('Add at least one product and quantity.','error');return;}
    let printWindow=null;if(printAfter)printWindow=window.open('about:blank','_blank');
    const buttons=$$('[data-action="save-sale"],[data-action="save-sale-print"]');buttons.forEach(b=>b.disabled=true);
    try{
      const result=await api(state.saleEdit?.id?`/api/sales/${state.saleEdit.id}`:'/api/sales',{method:state.saleEdit?.id?'PUT':'POST',body});
      toast(`Memo ${result.memo_no} saved. Stock, cash and customer due were updated atomically.`,'success');
      state.isSaleEntry=false;state.saleEdit=null;await refreshBase();await loadModule('sales_history');refreshNotificationCount();
      if(printAfter&&printWindow)printWindow.location=`/print/memo/${result.id}`;
    }catch(error){if(printWindow)printWindow.close();toast(error.message,'error');buttons.forEach(b=>b.disabled=false);}
  }
  function fieldMarkup(config,record={}) {
    const name=config.name,label=config.label||name,value=record[name]??config.value??'';const id=`modal-${name}`;const required=config.required?'required':'';const help=config.help?`<span class="hint">${escapeHtml(config.help)}</span>`:'';
    if(config.type==='checkbox')return `<div class="field ${config.full?'full':''}"><label style="display:flex;align-items:center;gap:8px"><input id="${id}" name="${name}" type="checkbox" ${value===true||value===1||value==='1'?'checked':''}> ${escapeHtml(label)}</label>${help}</div>`;
    if(config.type==='select')return `<div class="field ${config.full?'full':''}"><label for="${id}">${escapeHtml(label)}</label><select id="${id}" name="${name}" ${required}>${config.placeholder?`<option value="">${escapeHtml(config.placeholder)}</option>`:''}${(config.options||[]).map(opt=>{const o=Array.isArray(opt)?{value:opt[0],label:opt[1]}:opt;return `<option value="${escapeHtml(o.value)}" ${String(value)===String(o.value)?'selected':''}>${escapeHtml(o.label)}</option>`;}).join('')}</select>${help}</div>`;
    if(config.type==='textarea')return `<div class="field ${config.full===false?'':'full'}"><label for="${id}">${escapeHtml(label)}</label><textarea id="${id}" name="${name}" ${required} rows="${config.rows||3}" placeholder="${escapeHtml(config.placeholder||'')}">${escapeHtml(value)}</textarea>${help}</div>`;
    return `<div class="field ${config.full?'full':''}"><label for="${id}">${escapeHtml(label)}</label><input id="${id}" name="${name}" type="${config.type||'text'}" value="${escapeHtml(value)}" placeholder="${escapeHtml(config.placeholder||'')}" ${config.min!==undefined?`min="${config.min}"`:''} ${config.step?`step="${config.step}"`:''} ${required} ${config.readonly?'readonly':''} ${config.autocomplete?`autocomplete="${config.autocomplete}"`:''}>${help}</div>`;
  }
  function openModal(title,fieldsHtml,submitLabel,onSubmit,options={}) {
    const host=$('#modal-root');host.innerHTML=`<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal ${options.wide?'wide':''}" role="dialog" aria-modal="true"><header class="modal-header"><div><h2>${escapeHtml(title)}</h2>${options.subtitle?`<p>${escapeHtml(options.subtitle)}</p>`:''}</div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></header><form id="modal-form"><div class="modal-body">${fieldsHtml}<div id="modal-error" class="form-error"></div></div><footer class="modal-footer"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">${submitLabel}</button></footer></form></section></div>`;
    $('#modal-form').addEventListener('submit',async e=>{e.preventDefault();const values={};new FormData(e.currentTarget).forEach((value,key)=>{values[key]=value;});$$('input[type="checkbox"]',e.currentTarget).forEach(box=>values[box.name]=box.checked);
      const submit=$('button[type="submit"]',e.currentTarget),error=$('#modal-error');submit.disabled=true;error.classList.remove('show');
      try{await onSubmit(values,e.currentTarget);closeModal();}
      catch(err){error.textContent=err.message;error.classList.add('show');submit.disabled=false;}
    });
    const first=$('input:not([type="checkbox"]),select,textarea',host);first?.focus();
  }
  function closeModal(){const host=$('#modal-root');if(host)host.innerHTML='';}
  function optionsFrom(items,valueKey,labelKey,labelFn){return (items||[]).map(item=>[item[valueKey],labelFn?labelFn(item):item[labelKey]]);}
  const catOptions=[['fuel','Fuel'],['lubricant','Lubricant'],['other','Other']];
  const statusOptions=[['active','Active'],['inactive','Inactive']];
  async function openEntityForm(kind,id=null) {
    const configs={
      product:{title:id?'Edit product':'Add product',endpoint:id?`/api/products/${id}`:'/api/products',method:id?'PUT':'POST',fields:[{name:'name',label:'Product name',required:true},{name:'category',label:'Category',type:'select',options:catOptions},{name:'unit',label:'Unit',required:true,placeholder:'লিটার / বোতল / পিস'},{name:'purchase_price',label:'Current average cost (৳)',type:'number',min:0,step:'0.01'},{name:'selling_price',label:'Selling price (৳)',type:'number',min:0,step:'0.01'},{name:'min_stock',label:'Minimum stock level',type:'number',min:0,step:'0.001'},{name:'active',label:'Product is active',type:'checkbox'}],recordKey:'id'},
      customer:{title:id?'Edit customer':'Add customer',endpoint:id?`/api/customers/${id}`:'/api/customers',method:id?'PUT':'POST',fields:[{name:'name',label:'Customer name',required:true},{name:'phone',label:'Phone number',type:'tel'},{name:'vehicle_no',label:'Vehicle number'},{name:'customer_type',label:'Customer type',type:'select',options:(state.base.customer_types||[]).map(x=>[x,x])},{name:'address',label:'Address',type:'textarea',full:true},...(id?[]:[{name:'opening_due',label:'Opening due (৳)',type:'number',min:0,step:'0.01',help:'Opening balances are only editable during setup; future movements use the due ledger.'}]),...(id?[{name:'status',label:'Status',type:'select',options:statusOptions}]:[])]},
      supplier:{title:id?'Edit supplier':'Add supplier',endpoint:id?`/api/suppliers/${id}`:'/api/suppliers',method:id?'PUT':'POST',fields:[{name:'name',label:'Supplier name',required:true},{name:'company',label:'Company'},{name:'phone',label:'Phone',type:'tel'},{name:'address',label:'Address',type:'textarea',full:true},...(id?[{name:'status',label:'Status',type:'select',options:statusOptions}]:[{name:'opening_balance',label:'Opening payable balance (৳)',type:'number',min:0,step:'0.01'}])]},
      employee:{title:id?'Edit employee':'Add employee',endpoint:id?`/api/employees/${id}`:'/api/employees',method:id?'PUT':'POST',fields:[{name:'name',label:'Full name',required:true},{name:'phone',label:'Phone',type:'tel'},{name:'designation',label:'Designation'},{name:'join_date',label:'Joining date',type:'date'},{name:'salary',label:'Monthly salary (৳)',type:'number',min:0,step:'0.01'},{name:'address',label:'Address',type:'textarea',full:true},...(id?[{name:'status',label:'Status',type:'select',options:statusOptions}]:[])]},
      bank:{title:id?'Edit account':'Add bank / mobile account',endpoint:id?`/api/banks/${id}`:'/api/banks',method:id?'PUT':'POST',fields:[{name:'bank_name',label:'Bank / wallet name',required:true,placeholder:'e.g. Sonali Bank / bKash'},{name:'account_name',label:'Account name',required:true},{name:'account_number',label:'Account number / wallet'},...(id?[]:[{name:'opening_balance',label:'Opening balance (৳)',type:'number',min:0,step:'0.01'}]),...(id?[{name:'status',label:'Status',type:'select',options:statusOptions}]:[])]},
      pump:{title:id?'Edit pump':'Add pump',endpoint:id?`/api/pumps/${id}`:'/api/pumps',method:id?'PUT':'POST',fields:[{name:'pump_number',label:'Pump number',required:true,placeholder:'01'},{name:'active',label:'Pump is active',type:'checkbox'}]},
      nozzle:{title:id?'Edit nozzle':'Add nozzle',endpoint:id?`/api/nozzles/${id}`:'/api/nozzles',method:id?'PUT':'POST',fields:[{name:'pump_id',label:'Pump',type:'select',required:true,options:optionsFrom(state.base.pumps,'id','pump_number',x=>`Pump ${x.pump_number}`)},{name:'nozzle_number',label:'Nozzle number',required:true,placeholder:'01'},{name:'product_id',label:'Assigned product',type:'select',required:true,options:optionsFrom((state.base.products||[]).filter(x=>x.active),'id','name',x=>`${x.name} (${x.unit})`)},{name:'tank_id',label:'Fuel tank served (optional)',type:'select',options:optionsFrom(state.base.tanks,'id','tank_number',x=>`${x.tank_number} · ${x.product_name}`)},{name:'active',label:'Nozzle is active',type:'checkbox'}]},
      shift:{title:id?'Edit shift':'Add shift',endpoint:id?`/api/shifts/${id}`:'/api/shifts',method:id?'PUT':'POST',fields:[{name:'name',label:'Shift name',required:true},{name:'start_time',label:'Start time',type:'time',required:true},{name:'end_time',label:'End time',type:'time',required:true},{name:'active',label:'Shift is active',type:'checkbox'}]},
      tank:{title:id?'Edit tank':'Add tank',endpoint:id?`/api/tanks/${id}`:'/api/tanks',method:id?'PUT':'POST',fields:[{name:'tank_number',label:'Tank number',required:true},{name:'product_id',label:'Assigned product',type:'select',required:true,options:optionsFrom((state.base.products||[]).filter(x=>x.active),'id','name',x=>`${x.name} (${x.unit})`)},{name:'capacity',label:'Capacity',type:'number',min:0,step:'0.001',required:true},{name:'opening_quantity',label:'Opening quantity',type:'number',min:0,step:'0.001'},{name:'min_level',label:'Minimum level',type:'number',min:0,step:'0.001'},{name:'max_level',label:'Maximum level',type:'number',min:0,step:'0.001'},...(id?[{name:'active',label:'Tank is active',type:'checkbox'}]:[])]},
      user:{title:id?'Edit user access':'Add system user',endpoint:id?`/api/users/${id}`:'/api/users',method:id?'PUT':'POST',fields:[{name:'username',label:'Username',required:true,readonly:!!id,help:id?'Usernames are not changed after account creation.':'Use a unique sign-in username.'},{name:'full_name',label:'Full name',required:true},{name:'role',label:'Role',type:'select',required:true,options:(state.rolesData?.roles||[]).map(x=>[x.name,x.label])},{name:'password',label:id?'New password (optional)':'Password · at least 10 characters',type:'password',required:!id,autocomplete:'new-password'},...(id?[{name:'is_active',label:'Account is active',type:'checkbox'}]:[])]},
    };
    const config=configs[kind];if(!config)return;
    let record={};
    if(id){
      if(kind==='product')record=await api('/api/products').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='customer')record=await api('/api/customers').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='supplier')record=await api('/api/suppliers').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='employee')record=await api('/api/employees').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='bank')record=await api('/api/banks').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='pump')record=await api('/api/pumps').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='nozzle')record=(await api('/api/pumps')).flatMap(p=>p.nozzles).find(x=>x.id===id);
      else if(kind==='shift')record=await api('/api/shifts').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='tank')record=await api('/api/tanks').then(rows=>rows.find(x=>x.id===id));
      else if(kind==='user')record=await api('/api/users').then(rows=>rows.find(x=>x.id===id));
      if(!record)throw new Error('Record not found.');
    }
    const html=`<div class="form-grid">${config.fields.map(f=>fieldMarkup(f,record)).join('')}</div>`;
    openModal(config.title,html,id?'Save changes':'Save record',async values=>{
      // Usernames are immutable for existing accounts.
      if(kind==='user'&&id){delete values.username;if(!values.password)delete values.password;values.is_active=Boolean(values.is_active);}
      if(kind==='tank'&&!id&&values.max_level==='')values.max_level=values.capacity;
      await api(config.endpoint,{method:config.method,body:values});toast(id?'Record updated.':'Record created.','success');await refreshBase();await loadModule(state.active);
    });
  }
  function selectField(name,label,items,selected='',placeholder='Select…',required=false,labelFn=null) {
    const opts=(items||[]).map(item=>Array.isArray(item)?item:[item.id,labelFn?labelFn(item):item.name]);
    return fieldMarkup({name,label,type:'select',placeholder,required,options:opts},{[name]:selected});
  }
  function openPriceForm(productId) {
    const product=(state.base.products||[]).find(p=>p.id===productId);if(!product)return;
    const html=`<div class="form-note">This new price applies to future memos. Existing memo lines preserve the saved rate.</div><div class="form-grid">${fieldMarkup({name:'product_name',label:'Product',readonly:true},{product_name:product.name})}${fieldMarkup({name:'selling_price',label:'New selling price (৳)',type:'number',min:0,step:'0.01',required:true},{selling_price:product.selling_price})}${fieldMarkup({name:'reason',label:'Reason for price update',type:'textarea',full:true,required:true,rows:2})}</div>`;
    openModal(`Change price · ${product.name}`,html,'Save price change',async values=>{await api(`/api/products/${productId}/price`,{method:'PUT',body:{selling_price:values.selling_price,reason:values.reason}});toast('Price updated and logged in Audit Logs.','success');await refreshBase();await loadModule('prices');});
  }
  function openPurchaseForm() {
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Purchase date',type:'date',required:true},{date:today()})}${selectField('supplier_id','Supplier',state.base.suppliers,'','Select supplier',true)}${selectField('product_id','Product',state.base.products.filter(p=>p.active),'','Select product',true,x=>`${x.name} · ${x.unit}`)}${fieldMarkup({name:'quantity',label:'Quantity',type:'number',min:.001,step:'0.001',required:true},{quantity:''})}${fieldMarkup({name:'purchase_rate',label:'Purchase rate (৳/unit)',type:'number',min:0,step:'0.01',required:true},{purchase_rate:''})}${fieldMarkup({name:'transport_cost',label:'Transport cost (৳)',type:'number',min:0,step:'0.01'},{transport_cost:'0.00'})}${fieldMarkup({name:'other_cost',label:'Other landed cost (৳)',type:'number',min:0,step:'0.01'},{other_cost:'0.00'})}<div class="field"><label>Calculated purchase total</label><input id="purchase-total-display" readonly value="৳0.00"></div>${fieldMarkup({name:'paid_amount',label:'Paid now (৳)',type:'number',min:0,step:'0.01'},{paid_amount:'0.00'})}${fieldMarkup({name:'payment_method',label:'Payment method',type:'select',options:[['credit','Credit / unpaid'],['cash','Cash'],['bank','Bank'],['mobile','Mobile banking']]},{payment_method:'credit'})}${selectField('bank_account_id','Payment account',state.base.banks,'','Select account')}${selectField('tank_id','Receiving tank',state.base.tanks,'','No tank selected',false,x=>`${x.tank_number} · ${x.product_name}`)}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'challan_no',label:'Challan number'},{})}${fieldMarkup({name:'notes',label:'Notes',type:'textarea',full:true,rows:2},{})}</div><div class="form-note">Total = quantity × rate + transport + other landed costs. Posting increases product stock and recalculates moving weighted-average cost.</div>`;
    openModal('Record fuel / product purchase',html,'Post purchase',async values=>{const res=await api('/api/purchases',{method:'POST',body:values});toast(`Purchase ${res.invoice_no} posted · stock updated.`, 'success');await refreshBase();await loadModule('purchases');},{wide:true});
    const update=()=>{const qty=Number($('#modal-quantity')?.value||0),rate=Number($('#modal-purchase_rate')?.value||0),extra=Number($('#modal-transport_cost')?.value||0)+Number($('#modal-other_cost')?.value||0);const el=$('#purchase-total-display');if(el)el.value=money(qty*rate+extra);};
    ['quantity','purchase_rate','transport_cost','other_cost'].forEach(n=>$('#modal-'+n)?.addEventListener('input',update));
    $('#modal-product_id')?.addEventListener('change',e=>{const p=productFor(e.target.value);if(p)$('#modal-purchase_rate').value=p.purchase_price;update();});
    $('#modal-payment_method')?.addEventListener('change',e=>{if(e.target.value==='credit')$('#modal-paid_amount').value='0.00';});
  }
  function openExpenseForm() {
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Expense date',type:'date',required:true},{date:today()})}${selectField('category','Category',state.base.expense_categories.map(x=>[x,x]),'Other','Select category',true)}${fieldMarkup({name:'amount',label:'Amount (৳)',type:'number',min:.01,step:'0.01',required:true},{amount:''})}${fieldMarkup({name:'payment_method',label:'Payment method',type:'select',options:[['cash','Cash'],['bank','Bank'],['mobile','Mobile banking'],['credit','Unpaid / credit']]},{payment_method:'cash'})}${selectField('bank_account_id','Bank / mobile account',state.base.banks,'','Select account')}${fieldMarkup({name:'paid_to',label:'Paid to'},{})}${fieldMarkup({name:'voucher_no',label:'Voucher number'},{})}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'description',label:'Description',type:'textarea',full:true,rows:2},{})}</div><div class="form-note">New manager entries require approval. Only approved expenses affect profit and the cash / bank ledger.</div>`;
    openModal('Add operating expense',html,'Save expense',async values=>{await api('/api/expenses',{method:'POST',body:values});toast('Expense recorded.','success');await loadModule('expenses');});
  }
  function openAttendanceForm() {
    const employees=(state.base.employees||[]).filter(x=>x.status==='active'),shifts=(state.base.shifts||[]).filter(x=>x.active);
    if(!employees.length){toast('Add an active employee before recording attendance.','error');return;}
    if(!shifts.length){toast('Add an active shift before recording attendance.','error');return;}
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Business date',type:'date',required:true},{date:today()})}${selectField('employee_id','Employee',employees,'','Select employee',true,x=>`${x.name}${x.designation?` · ${x.designation}`:''}`)}${selectField('shift_id','Shift',shifts,'','Select shift',true,x=>`${x.name} · ${x.start_time}–${x.end_time}`)}${fieldMarkup({name:'status',label:'Attendance status',type:'select',options:[['present','Present'],['absent','Absent'],['leave','Leave']]},{status:'present'})}${fieldMarkup({name:'check_in',label:'Check-in time',type:'time'},{})}${fieldMarkup({name:'check_out',label:'Check-out time',type:'time'},{})}${fieldMarkup({name:'notes',label:'Notes',type:'textarea',full:true,rows:2},{})}</div><div class="form-note">Saving the same employee, date and shift again updates the existing record and appends an audit event.</div>`;
    openModal('Record shift attendance',html,'Save attendance',async values=>{const result=await api('/api/attendance',{method:'POST',body:values});toast(result.updated?'Attendance updated.':'Attendance recorded.','success');await loadModule('employees');});
  }
  function openCustomerPayment(customerId) {
    const customer=(state.base.customers||[]).find(c=>c.id===customerId);
    api('/api/customers').then(rows=>{
      const record=rows.find(x=>x.id===customerId);if(!record)throw new Error('Customer not found.');
      const html=`<div class="form-note"><strong>${escapeHtml(record.name)}</strong> · Current due <strong>${money(record.current_due)}</strong>. Partial payments are allowed; overpayment is rejected.</div><div class="form-grid">${fieldMarkup({name:'date',label:'Payment date',type:'date',required:true},{date:today()})}${fieldMarkup({name:'amount',label:'Payment amount (৳)',type:'number',min:.01,max:record.current_due,step:'0.01',required:true},{amount:''})}${fieldMarkup({name:'payment_method',label:'Received by',type:'select',options:[['cash','Cash'],['bank','Bank'],['mobile','Mobile banking']]},{payment_method:'cash'})}${selectField('bank_account_id','Bank / mobile account',state.base.banks,'','Select account')}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'notes',label:'Receipt reference / notes',type:'textarea',full:true,rows:2},{})}</div>`;
      openModal('Collect customer due',html,'Record payment',async values=>{const result=await api(`/api/customers/${customerId}/payments`,{method:'POST',body:values});toast(`Payment received. Remaining due ${money(result.remaining_due)}.`, 'success');await refreshBase();await loadModule(state.active);},{subtitle:customer?.name||record.name});
    }).catch(e=>toast(e.message,'error'));
  }
  function openSupplierPayment(supplierId) {
    api('/api/suppliers').then(rows=>{const supplier=rows.find(x=>x.id===supplierId);if(!supplier)throw new Error('Supplier not found.');
      const html=`<div class="form-note"><strong>${escapeHtml(supplier.name)}</strong> · Current payable <strong>${money(supplier.current_due)}</strong>.</div><div class="form-grid">${fieldMarkup({name:'date',label:'Payment date',type:'date',required:true},{date:today()})}${fieldMarkup({name:'amount',label:'Payment amount (৳)',type:'number',min:.01,max:supplier.current_due,step:'0.01',required:true},{amount:''})}${fieldMarkup({name:'payment_method',label:'Payment method',type:'select',options:[['cash','Cash'],['bank','Bank'],['mobile','Mobile banking']]},{payment_method:'cash'})}${selectField('bank_account_id','Bank / mobile account',state.base.banks,'','Select account')}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'notes',label:'Payment reference / notes',type:'textarea',full:true,rows:2},{})}</div>`;
      openModal('Pay supplier',html,'Record payment',async values=>{const result=await api(`/api/suppliers/${supplierId}/payments`,{method:'POST',body:values});toast(`Supplier payment recorded. Remaining payable ${money(result.remaining_due)}.`, 'success');await refreshBase();await loadModule('suppliers');});
    }).catch(e=>toast(e.message,'error'));
  }
  function openBankDeposit() {
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Deposit date',type:'date',required:true},{date:today()})}${selectField('bank_id','Bank account',state.base.banks,'','Select bank',true,x=>`${x.bank_name} · ${x.account_name}`)}${fieldMarkup({name:'amount',label:'Deposit amount (৳)',type:'number',min:.01,step:'0.01',required:true},{amount:''})}${fieldMarkup({name:'slip_no',label:'Deposit slip number'},{})}${fieldMarkup({name:'depositor',label:'Depositor',value:state.user.full_name},{depositor:state.user.full_name})}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'reference',label:'Reference'},{})}${fieldMarkup({name:'notes',label:'Notes',type:'textarea',full:true,rows:2},{})}</div><div class="form-note">A bank deposit is a transfer: it reduces cash on hand and increases the selected bank account. It is not an expense.</div>`;
    openModal('Record cash bank deposit',html,'Save deposit',async values=>{const result=await api('/api/banks/deposits',{method:'POST',body:values});toast(`Deposit recorded · cash balance ${money(result.cash_balance)}.`, 'success');await refreshBase();await loadModule('banks');});
  }
  function openBankAdjustment() {
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Transaction date',type:'date',required:true},{date:today()})}${selectField('bank_id','Account',state.base.banks,'','Select account',true,x=>`${x.bank_name} · ${x.account_name}`)}${fieldMarkup({name:'direction',label:'Transaction',type:'select',options:[['in','Account receipt'],['out','Account withdrawal']]},{direction:'out'})}${fieldMarkup({name:'amount',label:'Amount (৳)',type:'number',min:.01,step:'0.01',required:true},{amount:''})}${fieldMarkup({name:'reference',label:'Reference / slip'},{})}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'notes',label:'Reason',type:'textarea',full:true,required:true,rows:2},{})}</div><div class="form-note">Use a bank adjustment only for a documented direct account transaction. This does not change cash on hand.</div>`;
    openModal('Record bank transaction',html,'Save transaction',async values=>{await api('/api/banks/transactions',{method:'POST',body:values});toast('Bank transaction recorded.','success');await refreshBase();await loadModule('banks');});
  }
  function openCashbookEntry(type='other_income') {
    const isWithdrawal=type==='withdrawal';
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Date',type:'date',required:true},{date:today()})}${fieldMarkup({name:'type',label:'Entry type',type:'select',options:[['other_income','Other income'],['withdrawal','Cash withdrawal']]},{type})}${fieldMarkup({name:'amount',label:'Amount (৳)',type:'number',min:.01,step:'0.01',required:true},{amount:''})}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','No shift selected')}${fieldMarkup({name:'notes',label:'Description / reason',type:'textarea',full:true,required:true,rows:2},{})}</div><div class="form-note">This entry affects cash on hand. For operating costs, use Expenses; for bank deposits, use Bank & Deposit.</div>`;
    openModal(isWithdrawal?'Cash withdrawal':'Record other cash income',html,isWithdrawal?'Save withdrawal':'Save cash receipt',async values=>{await api('/api/cashbook/transactions',{method:'POST',body:values});toast('Cashbook entry recorded.','success');await loadModule('cashbook');});
  }
  function openStockAdjustment() {
    const html=`<div class="form-grid">${selectField('product_id','Product',state.base.products.filter(p=>p.active),'','Select product',true,x=>`${x.name} · ${x.unit}`)}${fieldMarkup({name:'quantity',label:'Signed quantity adjustment',type:'number',step:'0.001',required:true,placeholder:'Positive adds · negative removes'},{quantity:''})}${fieldMarkup({name:'unit_cost',label:'Unit cost for positive addition (৳)',type:'number',min:0,step:'0.01',help:'Used to establish or update moving weighted-average cost.'},{unit_cost:''})}${fieldMarkup({name:'reason',label:'Reason (required for audit)',type:'textarea',full:true,required:true,rows:3},{})}</div><div class="form-note">Adjustments are appended to the stock ledger and may not reduce book stock below zero. Physical measurements must be captured as a tank dip instead.</div>`;
    openModal('Adjust product stock',html,'Post adjustment',async values=>{await api('/api/stock/adjustments',{method:'POST',body:values});toast('Stock adjustment posted and audited.','success');await refreshBase();await loadModule('stock');});
  }
  function openMeterForm() {
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Reading date',type:'date',required:true},{date:today()})}${selectField('shift_id','Shift',state.base.shifts.filter(x=>x.active),'','No shift selected')}${selectField('pump_id','Pump',state.base.pumps.filter(x=>x.active),'','Select pump',true,x=>`Pump ${x.pump_number}`)}<div class="field"><label for="modal-nozzle_id">Nozzle</label><select id="modal-nozzle_id" name="nozzle_id" required><option value="">Select nozzle</option></select></div>${fieldMarkup({name:'opening_meter',label:'Opening meter',type:'number',min:0,step:'0.001',required:true},{opening_meter:''})}${fieldMarkup({name:'closing_meter',label:'Closing meter',type:'number',min:0,step:'0.001',required:true},{closing_meter:''})}${selectField('operator_id','Operator',state.base.employees,'','Not assigned',false,x=>`${x.name}${x.designation?` · ${x.designation}`:''}`)}${fieldMarkup({name:'notes',label:'Notes',type:'textarea',full:true,rows:2},{})}</div><div id="meter-calc" class="form-note">Select a pump and nozzle. Sales litres and amount are calculated from the meter and current product rate.</div>`;
    openModal('Record meter reading',html,'Save meter reading',async values=>{
      try{const result=await api('/api/meter-readings',{method:'POST',body:values});toast(`${number(result.sales_liters)} L · ${money(result.total)} meter reading saved.`, 'success');await loadModule('meters');}
      catch(error){if(error.code==='meter_mismatch'&&window.confirm(`${error.message}\n\nRecord this reading with a documented mismatch?`)){values.confirm_mismatch=true;const result=await api('/api/meter-readings',{method:'POST',body:values});toast(`Reading saved with confirmed mismatch · ${number(result.sales_liters)} L.`, 'success');await loadModule('meters');return;}throw error;}
    });
    const pump=$('#modal-pump_id'),nozzle=$('#modal-nozzle_id');
    const populate=()=>{const list=(state.base.nozzles||[]).filter(n=>String(n.pump_id)===pump.value&&n.active);nozzle.innerHTML=`<option value="">Select nozzle</option>${list.map(n=>`<option value="${n.id}">${escapeHtml(n.nozzle_number)} · ${escapeHtml(n.product_name)}${n.tank_number?` · ${escapeHtml(n.tank_number)}`:''}</option>`).join('')}`;};
    pump?.addEventListener('change',populate);nozzle?.addEventListener('change',()=>{const record=(state.base.nozzles||[]).find(n=>String(n.id)===nozzle.value);if(record)$('#modal-opening_meter').value=record.last_meter||0;});
    ['opening_meter','closing_meter','nozzle_id'].forEach(key=>$(`#modal-${key}`)?.addEventListener('input',()=>{const n=(state.base.nozzles||[]).find(x=>String(x.id)===nozzle.value);const liters=Number($('#modal-closing_meter')?.value||0)-Number($('#modal-opening_meter')?.value||0);const product=productFor(n?.product_id);$('#meter-calc').textContent=liters<0?'Closing meter cannot be below opening meter.':`${number(Math.max(0,liters))} ${product?.unit||'L'} × ${money(product?.selling_price||0)} = ${money(Math.max(0,liters)*Number(product?.selling_price||0))}.`; }));
  }
  function openTankDip() {
    if(!state.base.tanks?.length){toast('Add a tank first.','error');return;}
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Dip date',type:'date',required:true},{date:today()})}${selectField('tank_id','Tank',state.base.tanks,'','Select tank',true,x=>`${x.tank_number} · ${x.product_name}`)}${fieldMarkup({name:'dip_reading',label:'Dip reading',type:'number',min:0,step:'0.001',required:true},{dip_reading:''})}${fieldMarkup({name:'estimated_quantity',label:'Estimated quantity',type:'number',min:0,step:'0.001',required:true},{estimated_quantity:''})}${fieldMarkup({name:'physical_stock',label:'Physical stock',type:'number',min:0,step:'0.001',required:true},{physical_stock:''})}${fieldMarkup({name:'book_stock',label:'Book stock (tank ledger)',type:'number',min:0,step:'0.001',readonly:true},{book_stock:''})}${selectField('operator_id','Operator',state.base.employees,'','Not assigned')}${fieldMarkup({name:'notes',label:'Notes',type:'textarea',full:true,rows:2},{})}</div><div class="form-note">The dip is saved as unverified. Recording a physical measurement will not adjust stock or automatically mark it verified.</div>`;
    openModal('Record daily tank dip',html,'Save unverified dip',async values=>{await api(`/api/tanks/${values.tank_id}/dips`,{method:'POST',body:values});toast('Tank dip recorded as unverified.','success');await loadModule('tanks');});
    $('#modal-tank_id')?.addEventListener('change',e=>{const tank=state.base.tanks.find(t=>String(t.id)===e.target.value);if(tank){$('#modal-book_stock').value=tank.current_stock||0;$('#modal-physical_stock').value=$('#modal-estimated_quantity').value||tank.current_stock||0;}});
  }
  function openShiftClose() {
    const html=`<div class="form-grid">${fieldMarkup({name:'date',label:'Business date',type:'date',required:true},{date:today()})}${selectField('shift_id','Shift',state.base.shifts.filter(s=>s.active),'','Select shift',true,x=>`${x.name} · ${x.start_time}–${x.end_time}`)}${fieldMarkup({name:'opening_cash',label:'Shift opening cash (৳)',type:'number',min:0,step:'0.01',required:true},{opening_cash:'0.00'})}${fieldMarkup({name:'closing_cash',label:'Counted cash at close (৳)',type:'number',min:0,step:'0.01',required:true},{closing_cash:''})}${fieldMarkup({name:'notes',label:'Closing notes',type:'textarea',full:true,rows:2},{})}</div><div class="form-note">Expected cash is calculated from the shift’s cash memos, date-level approved expenses and cash deposits. Credit sales do not increase cash.</div>`;
    openModal('Close shift',html,'Calculate & save closing',async values=>{const shift=state.base.shifts.find(x=>String(x.id)===String(values.shift_id));const result=await api(`/api/shifts/${values.shift_id}/close`,{method:'POST',body:values});toast(`Shift closed · expected ${money(result.expected_cash)} · difference ${money(result.cash_difference)}.`,Number(result.cash_difference)===0?'success':'');await loadModule('shifts');});
  }
  function openDuplicateMemo(sale) {
    const duplicate={...sale,id:null,memo_no:null,paid_cash:sale.total,paid_bank:0,paid_mobile:0,credit:0,payment_type:'cash'};
    startNewMemo(duplicate);
  }
  async function openSaleView(id) {
    const sale=await api(`/api/sales/${id}`);const items=sale.items.map(x=>`<tr><td>${escapeHtml(x.product_name)}</td><td class="numeric">${number(x.quantity)}</td><td class="numeric">${money(x.rate)}</td><td class="numeric">${money(x.line_total)}</td></tr>`).join('');
    const body=`<div class="stock-summary"><div class="summary-mini"><span>Memo</span><strong>${escapeHtml(sale.memo_no)}</strong></div><div class="summary-mini"><span>Date</span><strong>${displayDate(sale.date)}</strong></div><div class="summary-mini"><span>Payment</span><strong>${escapeHtml(sale.payment_type)}</strong></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${items}</tbody><tfoot><tr><td colspan="3" class="text-right"><strong>Grand total</strong></td><td class="numeric"><strong>${money(sale.total)}</strong></td></tr></tfoot></table></div><div class="form-grid" style="margin-top:14px"><div class="field"><label>Customer / vehicle</label><input readonly value="${escapeHtml(sale.customer_name||'Walk-in')} · ${escapeHtml(sale.vehicle_no||'—')}"></div><div class="field"><label>Pump / nozzle / operator</label><input readonly value="${escapeHtml(sale.pump_number||'—')} / ${escapeHtml(sale.nozzle_number||'—')} · ${escapeHtml(sale.operator_name||'—')}"></div><div class="field"><label>Cash / Credit / Bank / Mobile</label><input readonly value="${money(sale.paid_cash)} / ${money(sale.credit)} / ${money(sale.paid_bank)} / ${money(sale.paid_mobile)}"></div><div class="field"><label>Status</label><input readonly value="${escapeHtml(sale.status)}"></div></div><div class="form-note">${escapeHtml(sale.notes||'No additional notes.')}</div>`;
    const buttons=`<button class="btn btn-secondary" data-action="close-modal">Close</button><button class="btn btn-secondary" data-action="duplicate-sale" data-id="${id}">Duplicate</button><button class="btn btn-secondary" data-action="print-sale" data-id="${id}">${icon('print',14)} Print / PDF</button>${sale.status==='posted'&&state.permissions.includes('sales:edit')?`<button class="btn btn-secondary" data-action="edit-sale" data-id="${id}">${icon('edit',14)} Edit</button>`:''}${sale.status==='posted'&&state.permissions.includes('sales:cancel')?`<button class="btn btn-danger" data-action="cancel-sale" data-id="${id}">Cancel / reverse</button>`:''}`;
    const html=`<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal wide" role="dialog" aria-modal="true"><header class="modal-header"><div><h2>Memo ${escapeHtml(sale.memo_no)}</h2><p>Transaction record · revision ${sale.revision}</p></div><button class="modal-close" data-action="close-modal">×</button></header><div class="modal-body">${body}</div><footer class="modal-footer">${buttons}</footer></section></div>`;$('#modal-root').innerHTML=html;
  }
  async function openCustomerStatement(id, supplier=false) {
    const data=await api(`/api/${supplier?'suppliers':'customers'}/${id}/statement`);const title=supplier?'Supplier statement':'Customer statement';
    const rows=data.rows.map(r=>`<tr><td>${displayDate(r.date)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.description||'')}</td><td class="numeric">${money(r.debit)}</td><td class="numeric">${money(r.credit)}</td><td class="numeric"><strong>${money(r.balance)}</strong></td></tr>`).join('');
    const person=supplier?data.supplier.name:data.customer.name;
    openModal(`${title} · ${person}`,`<div class="form-note">Current due / payable: <strong>${money(data.current_due)}</strong></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>${rows}</tbody></table></div>`,'Close',async()=>{}, {wide:true,subtitle:'Ledger statement'});
    // Statement is a read-only dialog: remove submit controls and keep a close action.
    $('#modal-form')?.remove();
    const foot=$('.modal-footer');if(foot)foot.innerHTML='<button class="btn btn-secondary" data-action="close-modal">Close</button>';
  }
  function openCancelSale(id) {
    const html=`<div class="confirm-box">This will reverse inventory, cash / bank receipts and customer credit for the active memo revision. The memo remains searchable and an audit record is retained.</div><div class="field" style="margin-top:14px"><label for="modal-reason">Cancellation reason</label><textarea id="modal-reason" name="reason" required minlength="5" rows="3" placeholder="Explain why the memo is being reversed"></textarea></div>`;
    openModal('Cancel / reverse memo',html,'Reverse memo',async values=>{await api(`/api/sales/${id}/cancel`,{method:'POST',body:values});toast('Memo reversed with an audit trail.','success');await refreshBase();await loadModule(state.active);});
  }
  async function openRolePermissions() {
    const role=$('#role-select')?.value;const rec=state.rolesData.roles.find(x=>x.name===role);if(!rec)return;
    if(role==='owner'){toast('Owner retains full access and cannot be restricted.','error');return;}
    const checks=Object.entries(state.rolesData.permission_labels).map(([key,label])=>`<label class="permission-check"><input type="checkbox" name="permission" value="${escapeHtml(key)}" ${rec.permissions.includes(key)?'checked':''}> <span>${escapeHtml(label)}</span></label>`).join('');
    const html=`<div class="form-note">Configure <strong>${escapeHtml(rec.label)}</strong>. Existing sessions receive changes on their next request.</div><div class="permission-grid">${checks}</div><div class="field" style="margin-top:14px"><label for="role-reason">Reason</label><input id="role-reason" name="reason" placeholder="Optional audit note"></div>`;
    openModal(`Permissions · ${rec.label}`,html,'Save permissions',async values=>{const permissions=$$('input[name="permission"]:checked',$('#modal-form')).map(x=>x.value);await api(`/api/roles/${role}`,{method:'PUT',body:{permissions,reason:$('#role-reason').value}});toast('Role permissions updated.','success');await loadModule('users');},{wide:true});
  }
  async function saveSettings() {
    const body={};
    ['business-settings-form','memo-settings-form'].forEach(id=>{const form=$('#'+id);if(form)new FormData(form).forEach((v,k)=>body[k]=v);});
    if(state.pendingLogo)body.logo_data=state.pendingLogo;
    const backup=$('#setting-backup_auto');if(backup)body.backup_auto=backup.value;
    try{const result=await api('/api/settings',{method:'PUT',body});state.settings=result;state.pendingLogo=null;toast('Business settings saved and logged.','success');await refreshBase();renderShell();await loadModule('settings');}
    catch(error){toast(error.message,'error');}
  }
  function exportCurrentReport(format) {
    const type=state.reportType||'daily_sales',start=state.reportStart||today(),end=state.reportEnd||today();
    const customer=type==='customer_statement'&&state.reportCustomer?`&customer_id=${state.reportCustomer}`:'';
    window.location.href=`/api/export/${type}?format=${format}&start=${start}&end=${end}${customer}`;
  }
  async function handleAction(action, target, event) {
    const id=Number(target.dataset.id||target.closest('[data-id]')?.dataset.id)||null;
    try {
      switch(action){
        case 'collapse': state.collapsed=!state.collapsed;renderShell();await loadModule(state.active);break;
        case 'mobile-menu': state.mobileOpen=true;$('#sidebar')?.classList.add('mobile-open');$('.mobile-overlay')?.classList.add('visible');break;
        case 'close-mobile': state.mobileOpen=false;$('#sidebar')?.classList.remove('mobile-open');$('.mobile-overlay')?.classList.remove('visible');break;
        case 'logout': await api('/api/auth/logout',{method:'POST',body:{}});state.user=null;state.csrf='';renderAuth(false);break;
        case 'new-sale': if(!state.permissions.includes('sales:create'))throw new Error('You do not have permission to create sales.');await startNewMemo();break;
        case 'cancel-sale-entry': state.isSaleEntry=false;state.saleEdit=null;await loadModule('daily_sales');break;
        case 'save-sale': await saveMemo(false);break;
        case 'save-sale-print': await saveMemo(true);break;
        case 'add-memo-line': addMemoLine();break;
        case 'remove-memo-line': target.closest('.memo-line')?.remove();if(!$$('.memo-line','#memo-lines').length)addMemoLine();syncSaleTotals();break;
        case 'view-sale': await openSaleView(id);break;
        case 'print-sale': closeModal();window.open(`/print/memo/${id}`,'_blank','noopener');break;
        case 'edit-sale': closeModal();await editMemo(id);break;
        case 'duplicate-sale': {const sale=await api(`/api/sales/${id}`);closeModal();openDuplicateMemo(sale);break;}
        case 'cancel-sale': openCancelSale(id);break;
        case 'new-purchase': openPurchaseForm();break;
        case 'nav-dashboard': await loadModule('dashboard');break;
        case 'nav-sales-history': await loadModule('sales_history');break;
        case 'nav-reports': await loadModule('reports');break;
        case 'add-product': await openEntityForm('product');break;
        case 'edit-product': if(!state.permissions.includes('products:manage'))throw new Error('You do not have permission to manage product details.');await openEntityForm('product',id);break;
        case 'price-product': openPriceForm(id);break;
        case 'choose-price': {const opts=(state.base.products||[]).filter(x=>x.active).map(x=>[x.id,x.name]);const html=selectField('product_id','Choose product',opts,'','Select product',true);openModal('Choose a product',html,'Continue',async values=>{closeModal();openPriceForm(Number(values.product_id));});break;}
        case 'nav-prices': await loadModule('prices');break;
        case 'add-customer': await openEntityForm('customer');break;
        case 'edit-customer': await openEntityForm('customer',id);break;
        case 'customer-payment': openCustomerPayment(id);break;
        case 'customer-statement': await openCustomerStatement(id,false);break;
        case 'open-due-report': state.reportType='customer_due';await loadModule('reports');break;
        case 'add-supplier': await openEntityForm('supplier');break;
        case 'edit-supplier': await openEntityForm('supplier',id);break;
        case 'supplier-payment': openSupplierPayment(id);break;
        case 'supplier-statement': await openCustomerStatement(id,true);break;
        case 'add-employee': await openEntityForm('employee');break;
        case 'edit-employee': await openEntityForm('employee',id);break;
        case 'record-attendance': openAttendanceForm();break;
        case 'filter-attendance': state.attendanceStart=$('#attendance-start')?.value||today();state.attendanceEnd=$('#attendance-end')?.value||today();await loadModule('employees');break;
        case 'add-bank': await openEntityForm('bank');break;
        case 'edit-bank': await openEntityForm('bank',id);break;
        case 'bank-deposit': openBankDeposit();break;
        case 'bank-adjustment': openBankAdjustment();break;
        case 'cashbook-entry': openCashbookEntry('other_income');break;
        case 'cash-withdrawal': openCashbookEntry('withdrawal');break;
        case 'stock-adjustment': openStockAdjustment();break;
        case 'stock-movements': await openStockMovements();break;
        case 'add-pump': await openEntityForm('pump');break;
        case 'edit-pump': await openEntityForm('pump',id);break;
        case 'add-nozzle': await openEntityForm('nozzle');break;
        case 'edit-nozzle': await openEntityForm('nozzle',id);break;
        case 'add-tank': await openEntityForm('tank');break;
        case 'edit-tank': await openEntityForm('tank',id);break;
        case 'add-dip': openTankDip();break;
        case 'verify-dip': {if(!window.confirm('Mark this manually measured tank dip as verified? This does not adjust stock.'))break;await api(`/api/tank-dips/${id}/verify`,{method:'POST',body:{reason:'Verified by authorized user'}});toast('Dip verification recorded.','success');await loadModule('tanks');break;}
        case 'add-meter': openMeterForm();break;
        case 'add-shift': await openEntityForm('shift');break;
        case 'edit-shift': await openEntityForm('shift',id);break;
        case 'close-shift': openShiftClose();break;
        case 'new-expense': openExpenseForm();break;
        case 'approve-expense': if(window.confirm('Approve and post this expense to profit and cash / bank?')){await api(`/api/expenses/${id}/approve`,{method:'POST',body:{}});toast('Expense approved and posted.','success');await loadModule('expenses');}break;
        case 'reject-expense': {const reason=window.prompt('Reason for rejecting this expense:');if(reason){await api(`/api/expenses/${id}/reject`,{method:'POST',body:{reason}});toast('Expense rejected.','success');await loadModule('expenses');}break;}
        case 'reverse-expense': {const reason=window.prompt('Reason for reversing this approved expense (at least 5 characters):');if(reason){await api(`/api/expenses/${id}/reverse`,{method:'POST',body:{reason}});toast('Expense reversed. Original record and reversal remain in history.','success');await loadModule('expenses');}break;}
        case 'filter-sales': state.salesQuery=$('#sales-query')?.value||'';state.salesStart=$('#sales-start')?.value||'0001-01-01';state.salesEnd=$('#sales-end')?.value||today();state.salesPayment=$('#sales-payment')?.value||'';await loadModule('sales_history');break;
        case 'clear-sales-filter': state.salesQuery='';state.salesStart='0001-01-01';state.salesEnd=today();state.salesPayment='';await loadModule('sales_history');break;
        case 'filter-stock': state.stockStart=$('#stock-start')?.value||today();state.stockEnd=$('#stock-end')?.value||today();await loadModule('stock');break;
        case 'filter-meter': state.meterStart=$('#meter-start')?.value||'0001-01-01';state.meterEnd=$('#meter-end')?.value||today();await loadModule('meters');break;
        case 'filter-purchases': state.purchaseQuery=$('#purchase-query')?.value||'';state.purchaseStart=$('#purchase-start')?.value||'0001-01-01';state.purchaseEnd=$('#purchase-end')?.value||today();await loadModule('purchases');break;
        case 'filter-cash': state.cashStart=$('#cash-start')?.value||today();state.cashEnd=$('#cash-end')?.value||today();await loadModule('cashbook');break;
        case 'filter-expenses': state.expenseStart=$('#expense-start')?.value||'0001-01-01';state.expenseEnd=$('#expense-end')?.value||today();state.expenseStatus=$('#expense-status')?.value||'';await loadModule('expenses');break;
        case 'filter-shifts': state.shiftStart=$('#shift-start')?.value||today();state.shiftEnd=$('#shift-end')?.value||today();await loadModule('shifts');break;
        case 'filter-audit': state.auditQuery=$('#audit-query')?.value||'';state.auditStart=$('#audit-start')?.value||'0001-01-01';state.auditEnd=$('#audit-end')?.value||today();await loadModule('audit');break;
        case 'filter-pnl': state.pnlStart=$('#pnl-start')?.value||today();state.pnlEnd=$('#pnl-end')?.value||today();await loadModule('pnl');break;
        case 'pnl-print': window.open(`/print/report?type=profit_loss&start=${state.pnlStart||today()}&end=${state.pnlEnd||today()}`,'_blank','noopener');break;
        case 'pnl-xlsx': window.location.href=`/api/export/profit_loss?format=xlsx&start=${state.pnlStart||today()}&end=${state.pnlEnd||today()}`;break;
        case 'apply-report': state.reportType=$('#report-type')?.value||'daily_sales';state.reportStart=$('#report-start')?.value||today();state.reportEnd=$('#report-end')?.value||today();state.reportCustomer=$('#report-customer')?.value||'';await loadModule('reports');break;
        case 'print-report': {const extra=state.reportType==='customer_statement'&&state.reportCustomer?`&customer_id=${state.reportCustomer}`:'';window.open(`/print/report?type=${state.reportType}&start=${state.reportStart||today()}&end=${state.reportEnd||today()}${extra}`,'_blank','noopener');break;}
        case 'export-report': exportCurrentReport(target.dataset.format||'xlsx');break;
        case 'nav-reports': state.reportType='daily_sales';await loadModule('reports');break;
        case 'nav-dashboard': await loadModule('dashboard');break;
        case 'reload-module': await loadModule(state.active);break;
        case 'create-backup': if(window.confirm('Create a point-in-time database backup now?')){const result=await api('/api/backups',{method:'POST',body:{}});toast(`Backup created · ${result.filename}`,'success');await loadModule('backups');}break;
        case 'restore-backup': {const typed=window.prompt('Restoring replaces the live station database. A safety backup is created first. Type RESTORE to continue:');if(typed==='RESTORE'){const result=await api(`/api/backups/${id}/restore`,{method:'POST',body:{confirm:typed}});toast(result.message,'success');await refreshBase();await loadModule('backups');}break;}
        case 'add-user': await openEntityForm('user');break;
        case 'edit-user': await openEntityForm('user',id);break;
        case 'edit-role-permissions': await openRolePermissions();break;
        case 'save-settings': await saveSettings();break;
        case 'notification-module': {const key=target.dataset.module;const map={stock:'stock',customer_due:'customer_due',suppliers:'suppliers',tanks:'tanks',shifts:'shifts',expenses:'expenses',prices:'prices',backup:'backups'};if(map[key])await loadModule(map[key]);break;}
        case 'modal-backdrop': if(eventTargetBackdrop(target,event))closeModal();break;
        case 'close-modal': closeModal();break;
        case 'apply-dashboard-range': {state.start=$('#dashboard-start')?.value||today();state.end=$('#dashboard-end')?.value||today();if(state.start>state.end){toast('Start date must be before end date.','error');break;}state.period='custom';await loadModule('dashboard');break;}
        case 'user-menu': openUserMenu();break;
        case 'clear-global-search': $('#global-search').value='';$('#search-results').classList.remove('open');break;
        default: break;
      }
    }catch(error){toast(error.message,'error');}
  }
  function eventTargetBackdrop(target,event){return target.classList.contains('modal-backdrop')&&event.target===target;}
  function openUserMenu(){
    const html=`<div class="stock-summary"><div class="summary-mini"><span>Signed in as</span><strong>${escapeHtml(state.user.full_name)}</strong></div><div class="summary-mini"><span>Access role</span><strong>${escapeHtml((state.user.role||'').replaceAll('_',' '))}</strong></div><div class="summary-mini"><span>Session timezone</span><strong>Asia/Dhaka</strong></div></div><p style="font-size:10px;color:var(--muted)">Use a personal account and sign out when leaving the station computer.</p>`;
    openModal('Account',html,'Sign out',async()=>{await api('/api/auth/logout',{method:'POST',body:{}});state.user=null;state.csrf='';renderAuth(false);});
  }
  async function openStockMovements() {
    const rows=await api('/api/stock/movements');
    const content=table([{key:'created_at',label:'Posted at',render:r=>`${displayDate((r.created_at||'').slice(0,10))} <span class="cell-sub">${escapeHtml((r.created_at||'').slice(11,16))}</span>`},{key:'product_name',label:'Product'},{key:'kind',label:'Movement',render:r=>statusBadge(r.kind)},{key:'quantity',label:'Signed quantity',right:true,render:r=>`${Number(r.quantity)>0?'+':''}${number(r.quantity)} ${escapeHtml(r.unit)}`},{key:'reference_type',label:'Source'},{key:'notes',label:'Notes'},{key:'user_name',label:'User'}],rows,{emptyTitle:'No stock movements',emptyText:'Purchases, posted sales and adjustments create the stock movement ledger.'});
    openModal('Stock movement ledger',content,'Close',async()=>{}, {wide:true,subtitle:'Append-only inventory history'});$('#modal-form')?.remove();const foot=$('.modal-footer');if(foot)foot.innerHTML='<button class="btn btn-secondary" data-action="close-modal">Close</button>';
  }
  function updateSearchResults(results){const box=$('#search-results');if(!box)return;if(!results.length){box.innerHTML='<div class="search-result"><span>No matching records</span></div>';box.classList.add('open');return;}box.innerHTML=results.map(r=>`<button type="button" class="search-result" data-action="search-result" data-module="${escapeHtml(r.module)}" data-type="${escapeHtml(r.type)}" data-id="${r.id}"><strong>${escapeHtml(r.title)}</strong><span>${escapeHtml(r.subtitle||r.type)}</span></button>`).join('');box.classList.add('open');}
  async function runGlobalSearch(value){const q=value.trim();if(q.length<2){$('#search-results')?.classList.remove('open');return;}try{const data=await api(`/api/search?q=${encodeURIComponent(q)}`);updateSearchResults(data.results||[]);}catch(_e){}}
  function attachEvents(){
    appRoot.addEventListener('click',async event=>{
      const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();await loadModule(nav.dataset.nav);return;}
      const period=event.target.closest('[data-period]');if(period){state.period=period.dataset.period;await loadModule('dashboard');return;}
      const target=event.target.closest('[data-action]');if(target){event.preventDefault();if(target.dataset.action==='search-result'){const module=target.dataset.module,type=target.dataset.type,id=target.dataset.id;$('#search-results')?.classList.remove('open');$('#global-search').value='';if(type==='memo'||type==='product_sale'){await loadModule('sales_history');if(id)await openSaleView(Number(id));}else if(module)await loadModule(module);return;}await handleAction(target.dataset.action,target,event);}
    });
    appRoot.addEventListener('input',event=>{
      const target=event.target;
      if(target.matches('.line-quantity,.line-rate'))syncSaleTotals();
      if(target.matches('.line-product')){const p=productFor(target.value),row=target.closest('.memo-line');if(p&&row){$('.line-rate',row).value=p.selling_price;syncSaleTotals();}}
      if(target.id==='sale-cash'||target.id==='sale-credit'||target.id==='sale-bank'||target.id==='sale-mobile')updatePaymentBalance();
      if(target.id==='sale-vehicle'||target.id==='sale-date')updateSalePreview();
      if(target.id==='global-search'){clearTimeout(state.searchTimer);state.searchTimer=setTimeout(()=>runGlobalSearch(target.value),180);}
    });
    appRoot.addEventListener('change',async event=>{
      const target=event.target;
      if(target.id==='sale-pump')fillNozzles(target.value);
      if(target.id==='sale-customer'){const customer=(state.base.customers||[]).find(c=>String(c.id)===target.value);if(customer&&customer.vehicle_no&&!$('#sale-vehicle').value){$('#sale-vehicle').value=customer.vehicle_no;updateSalePreview();}}
      if(target.id==='sale-payment-type'){const mode=target.value;state.saleEdit={...(state.saleEdit||{}),id:state.saleEdit?.id};setPaymentMode(mode);updateSalePreview();}
      if(target.id==='report-type'){state.reportType=target.value;if(target.value==='customer_statement'&&!state.reportCustomer&&state.base.customers.length)state.reportCustomer=state.base.customers[0].id;await loadModule('reports');}
      if(target.id==='report-customer'){state.reportCustomer=target.value;}
      if(target.id==='modal-payment_method'&&target.value==='cash'){};
    });
    appRoot.addEventListener('keydown',event=>{
      if(event.key==='Enter'&&event.target.id==='sales-query'){event.preventDefault();$('#view-root [data-action="filter-sales"]')?.click();}
      if(event.key==='Escape'){closeModal();$('#search-results')?.classList.remove('open');}
      if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('#global-search')?.focus();}
    });
    document.addEventListener('click',event=>{if(!event.target.closest('.global-search-wrap'))$('#search-results')?.classList.remove('open');});
    window.addEventListener('resize',()=>{if(state.active==='dashboard'&&state.dashboardData){clearTimeout(state.resizeTimer);state.resizeTimer=setTimeout(()=>{const c=state.dashboardData.charts;drawChart('chart-daily',c.daily_sales,'#2b71cc');drawBars('chart-product',c.product_sales);drawChart('chart-weekly',c.weekly_sales,'#31a57c');drawChart('chart-monthly',c.monthly_sales,'#5887ca');drawChart('chart-expense',c.expense_trend,'#e09d3e');drawChart('chart-profit',c.profit_trend,'#1a9a74');},100);}});
  }
  attachEvents();
  setup();
})();
