/* Fonctions partagées */

const NAV_ITEMS = [
  { id: 'postes',      href: './index.html',       label: 'Postes',      icon: 'ti-layout-grid' },
  { id: 'candidature', href: './candidature.html', label: 'Candidater',  icon: 'ti-pencil' },
  { id: 'suivi',       href: './suivi.html',       label: 'Mon suivi',   icon: 'ti-search' },
  { id: 'rangs',       href: './rangs.html',       label: 'Hauts Rangs', icon: 'ti-crown' },
  { id: 'faq',         href: './faq.html',         label: 'FAQ',         icon: 'ti-help-circle' },
];

/* ───── Thème ───── */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const i = document.querySelector('#theme-btn i');
  if (i) i.className = 'ti ' + (t === 'dark' ? 'ti-sun' : 'ti-moon');
}
function getTheme() {
  try { return localStorage.getItem('lpdt_theme') || 'dark'; } catch { return 'dark'; }
}
function toggleTheme() {
  const t = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('lpdt_theme', t); } catch {}
  applyTheme(t);
}
applyTheme(getTheme());

/* ───── Nav / footer ───── */
function renderNav(activePage) {
  const links = NAV_ITEMS.map(n =>
    `<a href="${n.href}" class="${n.id === activePage ? 'active' : ''}" title="${n.label}"><i class="ti ${n.icon}"></i><span>${n.label}</span></a>`
  ).join('');
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.innerHTML = `
    <a class="brand" href="./index.html"><i class="ti ti-paw"></i><span>${escHtml(CONFIG.site.nom)}</span></a>
    <div class="nav-links">${links}</div>
    <div class="nav-tools">
      <button id="theme-btn" class="icon-btn" onclick="toggleTheme()" title="Changer de thème" aria-label="Changer de thème"><i class="ti ti-sun"></i></button>
      <a class="icon-btn subtle" href="./admin.html" title="Administration" aria-label="Administration"><i class="ti ti-lock"></i></a>
    </div>`;
  document.body.prepend(nav);
  applyTheme(getTheme());
  renderFooter();
  initReveal();
}

function renderFooter() {
  if (document.querySelector('.site-footer')) return;
  const f = document.createElement('footer');
  f.className = 'site-footer';
  f.innerHTML = `Site réalisé par .araxia. · Fondateurs : .araxia. &amp; lavnd.13
    <br><a href="${CONFIG.site.discordInvite}" target="_blank" rel="noopener">Rejoindre le Discord</a>`;
  document.body.appendChild(f);
}

/* ───── Animations d'apparition ───── */
let _revealObs;
function initReveal(root = document) {
  if (!('IntersectionObserver' in window)) {
    root.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
    return;
  }
  _revealObs = _revealObs || new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); _revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  root.querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 8, 7) * 60}ms`;
    _revealObs.observe(el);
  });
}

/* ───── Helpers ───── */
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  return 'TRV-' + Array.from(buf, n => chars[n % chars.length]).join('');
}

function joursDepuis(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}
function formatDuree(date, prefix = 'Ouvert depuis') {
  if (!date) return '';
  const j = joursDepuis(date);
  if (j <= 0) return `${prefix} aujourd'hui`;
  return `${prefix} ${j} jour${j > 1 ? 's' : ''}`;
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}
function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setLoading(btn, on, label) {
  if (!btn) return;
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${label ?? ''}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.label != null) btn.innerHTML = btn.dataset.label;
  }
}

function showToast(msg, type = 'info') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div');
  const icon = { success: 'ti-check', error: 'ti-alert-triangle', info: 'ti-info-circle' }[type] || 'ti-info-circle';
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="ti ${icon}"></i><span>${escHtml(msg)}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 4200);
}

function showDbError() {
  showToast('Base de données non configurée (js/config.js).', 'error');
}

async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); return ok;
  }
}

function openModal(html, { wide = false, onClose } = {}) {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 200); onClose && onClose(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  document.addEventListener('keydown', esc);
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));
  return { el: ov, close };
}

/* ───── Discord ───── */
const EMBED_COLORS = { staff: 0xB8813A, hr: 0xC4872A, oc3: 0x7A9058, oc4: 0x3A7055, ok: 0x4E9A6A, ko: 0xB5524A, info: 0x5A7FB0 };

function _cut(s, n) { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

async function sendWebhook(url, payload) {
  if (!url || /^URL_/.test(url)) return false;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowed_mentions: { parse: ['users'] }, ...payload }),
    });
    return r.ok;
  } catch (e) { console.warn('Webhook échoué', e); return false; }
}

/* data: { type, code, pseudo, poste, sections:[{titre, items:[{q,r}]}] } */
function buildCandidatureEmbed(data) {
  const fields = [];
  (data.sections || []).forEach(s => s.items.forEach(it => {
    if (it.r) fields.push({ name: _cut(`${s.titre} · ${it.q}`, 256), value: _cut(it.r, 700) });
  }));
  const embeds = [];
  const head = {
    title: `Nouvelle candidature — ${TYPE_LABELS[data.type] || data.type}`,
    color: EMBED_COLORS[data.type] ?? EMBED_COLORS.info,
    description: `**${escMd(data.pseudo)}**${data.poste ? ` · ${escMd(data.poste)}` : ''}\nCode de suivi : \`${data.code}\``,
    timestamp: new Date().toISOString(),
    footer: { text: CONFIG.site.nom },
  };
  let cur = head, size = 0;
  cur.fields = [];
  for (const f of fields) {
    const len = f.name.length + f.value.length;
    if (cur.fields.length >= 10 || size + len > 4500) {
      embeds.push(cur);
      if (embeds.length >= 10) { cur = null; break; }
      cur = { color: head.color, fields: [] }; size = 0;
    }
    cur.fields.push(f); size += len;
  }
  if (cur) embeds.push(cur);
  return { embeds };
}

function escMd(s) { return String(s ?? '').replace(/([*_`~|>\\])/g, '\\$1'); }

/* data: { code, pseudo, statut, note } */
function buildDecisionEmbed(data) {
  const ok = data.statut === 'acceptee';
  return {
    content: data.mention || undefined,
    embeds: [{
      title: ok ? '🎉 Candidature acceptée' : 'Candidature refusée',
      color: ok ? EMBED_COLORS.ok : EMBED_COLORS.ko,
      description: `**${escMd(data.pseudo)}**, ta candidature \`${data.code}\` a reçu une décision.\n\n${_cut(data.note, 1500)}`,
      fields: [{ name: 'Suivi', value: `${CONFIG.site.url}suivi.html?code=${data.code}` }],
      timestamp: new Date().toISOString(),
      footer: { text: CONFIG.site.nom },
    }],
  };
}

/* data: { posteNom, kind:'staff'|'hr', mentions:[...], url } */
function buildWaitlistNotifEmbed(data) {
  return {
    content: (data.mentions || []).join(' ') || undefined,
    embeds: [{
      title: '📣 Un poste vient d\'ouvrir',
      color: EMBED_COLORS.info,
      description: `Le poste **${escMd(data.posteNom)}** est de nouveau disponible. Tu étais sur la liste d'attente : c'est le moment de candidater !`,
      fields: [{ name: 'Candidater', value: `${CONFIG.site.url}candidature.html` }],
      timestamp: new Date().toISOString(),
      footer: { text: CONFIG.site.nom },
    }],
  };
}

function buildOuvertureEmbed({ nom, detail }) {
  return {
    embeds: [{
      title: '🌿 Recrutement ouvert',
      color: EMBED_COLORS.ok,
      description: `**${escMd(nom)}**${detail ? `\n${detail}` : ''}`,
      fields: [{ name: 'Candidater', value: `${CONFIG.site.url}candidature.html` }],
      timestamp: new Date().toISOString(),
      footer: { text: CONFIG.site.nom },
    }],
  };
}
