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