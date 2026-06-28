// =========================================================
// utils.js — Fonctions partagées
// =========================================================

// --- Code de suivi ---
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TRV-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// --- Formatage date ---
function formatDate(isoString, withTime = false) {
  if (!isoString) return '—';
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return new Date(isoString).toLocaleDateString('fr-FR', opts);
}

// --- Toast de notification ---
function showToast(message, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast-visible'));
  setTimeout(() => {
    t.classList.remove('toast-visible');
    setTimeout(() => t.remove(), 350);
  }, 4500);
}

// --- État chargement sur bouton ---
function setLoading(btn, loading, label = 'Chargement…') {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn._originalText = btn.textContent;
    btn.textContent = label;
  } else {
    btn.textContent = btn._originalText || btn.textContent;
  }
}

// --- Validation formulaire simple ---
function validateFields(fields) {
  let valid = true;
  fields.forEach(({ el, min = 1 }) => {
    if (!el) return;
    const empty = !el.value.trim() || el.value.trim().length < min;
    el.classList.toggle('field-error', empty);
    if (empty) valid = false;
  });
  return valid;
}

// --- Paramètres URL ---
function getUrlParams() {
  const params = {};
  new URLSearchParams(window.location.search).forEach((v, k) => { params[k] = v; });
  return params;
}

// --- Navigation active ---
function setActiveNav(pageName) {
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });
}

// --- Webhook Discord ---
async function sendDiscordWebhook(webhookUrl, payload) {
  if (!webhookUrl || webhookUrl.startsWith('VOTRE_')) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Webhook Discord — erreur réseau:', e);
  }
}

// --- Embed candidature pour Discord ---
function buildCandidatureEmbed(cand, posteNom, contexte) {
  const isHR = cand.type === 'hr';
  const color = isHR ? 0x9068E0 : 0x2DB882;
  const fields = [
    { name: 'Code de suivi', value: `\`${cand.code_suivi}\``, inline: true },
    { name: 'Pseudo Discord', value: cand.pseudo_discord || '—', inline: true },
    { name: 'Poste', value: posteNom, inline: true },
    { name: 'Contexte', value: contexte, inline: true },
  ];
  if (isHR && cand.donnees) {
    if (cand.donnees.nom_oc)     fields.push({ name: 'Personnage (OC)', value: cand.donnees.nom_oc, inline: true });
    if (cand.donnees.rang_actuel) fields.push({ name: 'Rang actuel',    value: cand.donnees.rang_actuel, inline: true });
  }
  return {
    title: `📋 Nouvelle candidature ${isHR ? 'Hauts Rangs' : 'Staff'} — ${posteNom}`,
    color,
    fields,
    footer: { text: `Le Prix de la Trêve · ${new Date().toLocaleDateString('fr-FR')}` },
    timestamp: new Date().toISOString(),
  };
}

// --- Embed liste d'attente pour Discord (admin) ---
function buildWaitlistNotifEmbed(posteNom, pseudos) {
  return {
    title: `🟢 Poste ouvert — ${posteNom}`,
    description: `Le poste **${posteNom}** vient d'être ouvert.\n\nPersonnes à notifier depuis la liste d'attente :`,
    color: 0x2DB882,
    fields: pseudos.map((p, i) => ({ name: `${i + 1}.`, value: p, inline: true })),
    footer: { text: 'Le Prix de la Trêve · Admin' },
    timestamp: new Date().toISOString(),
  };
}

// --- Échapper le HTML ---
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// --- Durée d'ouverture d'un poste ---
function formatDuree(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString)) / 86400000);
  if (diff < 1)  return "Ouvert aujourd'hui";
  if (diff === 1) return "Ouvert depuis hier";
  if (diff < 7)  return `Ouvert depuis ${diff} jours`;
  const w = Math.floor(diff / 7);
  return `Ouvert depuis ${w} semaine${w > 1 ? 's' : ''}`;
}

// --- Navigation partagée ---
function renderNav(activePage) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const links = [
    { page: 'postes',      href: './index.html',      label: 'Postes'       },
    { page: 'rangs',       href: './rangs.html',       label: 'Hauts Rangs'  },
    { page: 'candidature', href: './candidature.html', label: 'Candidater'   },
    { page: 'suivi',       href: './suivi.html',        label: 'Mon suivi'    },
    { page: 'faq',         href: './faq.html',          label: 'FAQ'          },
    { page: 'admin',       href: './admin.html',        label: 'Staff ↗', cls: 'nav-link-admin' },
  ];
  const saved = localStorage.getItem('lpdt_theme') || 'dark';
  nav.innerHTML = `
    <div class="nav-inner">
      <a href="./index.html" class="nav-logo">
        <span class="nav-logo-mark">⚔</span>
        <span class="nav-logo-text">Le Prix de la <em>Trêve</em></span>
      </a>
      <div class="nav-links">
        ${links.map(l =>
          `<a href="${l.href}" class="nav-link${l.cls?' '+l.cls:''}${activePage===l.page?' active':''}" data-page="${l.page}">${l.label}</a>`
        ).join('')}
        <button class="theme-toggle" onclick="toggleTheme()" title="Mode ${saved==='dark'?'jour':'nuit'}">
          <i class="ti ti-${saved==='dark'?'sun':'moon'}" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
  renderFooter();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('lpdt_theme', next);
  const icon = document.querySelector('.theme-toggle i');
  if (icon) icon.className = 'ti ti-' + (next === 'dark' ? 'sun' : 'moon');
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.title = 'Mode ' + (next === 'dark' ? 'jour' : 'nuit');
}

function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  const nom = (typeof CONFIG !== 'undefined' && CONFIG.site && CONFIG.site.nom) ? CONFIG.site.nom : 'Le Prix de la Trêve';
  footer.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-credits">
          <span>Site réalisé par <strong>.araxia.</strong></span>
          <span class="footer-sep">&middot;</span>
          <span>Fondateurs : <strong>.araxia.</strong> &amp; <strong>lavnd.13</strong></span>
          <span class="footer-sep">&middot;</span>
          <span>${nom}</span>
        </div>
      </div>
    </footer>
  `;
}

// --- Embed Discord : décision de candidature ---
function buildDecisionEmbed(cand, statut, posteNom) {
  const accepted = statut === 'acceptee';
  return {
    title: accepted
      ? `🎉 Candidature acceptée — ${posteNom}`
      : `📋 Candidature refusée — ${posteNom}`,
    description: accepted
      ? `Félicitations à **${escHtml(cand.pseudo_discord)}** dont la candidature a été retenue ! L'équipe staff va prendre contact.`
      : `La candidature de **${escHtml(cand.pseudo_discord)}** n'a pas été retenue cette fois. Elle est libre de repostuler ultérieurement.`,
    color: accepted ? 0x2DB882 : 0xC05060,
    fields: [
      { name: 'Code de suivi',  value: `\`${cand.code_suivi}\``, inline: true },
      { name: 'Pseudo Discord', value: cand.pseudo_discord,       inline: true },
    ],
    footer: { text: `Le Prix de la Trêve · ${new Date().toLocaleDateString('fr-FR')}` },
    timestamp: new Date().toISOString(),
  };
}