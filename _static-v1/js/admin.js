const $ = id => document.getElementById(id);
const S = { email: '', author: '', staff: [], hr: [], attente: [], cand: [] };
let charts = {};

const TEMPLATES = {
  acceptee: [
    ['Bienvenue', 'Bienvenue dans l\'équipe ! Ta candidature nous a convaincus. Nous te contactons sur Discord pour la suite.'],
    ['Période d\'essai', 'Ta candidature est acceptée : tu commences par une période d\'essai accompagnée. Un·e membre du staff te contactera très vite.'],
  ],
  refusee: [
    ['Pas cette fois', 'Merci pour ta candidature. Nous ne pouvons pas la retenir cette fois-ci, mais n\'hésite pas à retenter dans quelques semaines.'],
    ['Manque d\'ancienneté', 'Ta candidature est intéressante, mais nous aimerions que tu aies un peu plus d\'ancienneté sur le serveur. Reviens vers nous bientôt !'],
    ['Poste pourvu', 'Merci de ta candidature. Le poste a finalement été pourvu ; nous gardons ton dossier en mémoire pour une prochaine ouverture.'],
  ],
};

/* ───────── Auth ───────── */
async function init() {
  if (!sb) { showToast('Base de données non configurée (js/config.js).', 'error'); return; }
  const { data } = await sb.auth.getSession();
  if (data.session) showPanel(data.session.user.email);
}
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!sb) return showDbError();
  const btn = e.target.querySelector('button');
  setLoading(btn, true, 'Connexion…');
  const { data, error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
  setLoading(btn, false);
  if (error) { showToast('Identifiants invalides.', 'error'); return; }
  $('password').value = '';
  showPanel(data.user.email);
});

function showPanel(email) {
  S.email = email; S.author = email.split('@')[0];
  document.getElementById('admin-gate').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  document.getElementById('admin-user-info').textContent = `Connecté·e en tant que ${email}`;
  document.querySelector('.sidebar-link[onclick*="dashboard"]')?.classList.add('active');
  loadAll();
}
async function logout() {
  await sb.auth.signOut();
  location.reload();
}

function switchSection(name, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.toggle('active', s.id === 'sec-' + name));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  el?.classList.add('active');
}

/* ───────── Chargement ───────── */
async function loadAll() {
  const [s, h, a, c] = await Promise.all([
    sb.from(T.postesStaff).select('*').order('id'),
    sb.from(T.postesHr).select('*').order('id'),
    sb.from(T.attente).select('*').order('created_at'),
    sb.from(T.candid).select('id,code_suivi,type,poste_id,pseudo_discord,statut,assigne_a,rappel_envoye,created_at,updated_at,poste:donnees->meta->>poste').order('created_at', { ascending: false }),
  ]);
  const err = s.error || h.error || a.error || c.error;
  if (err) { showToast('Chargement impossible : ' + err.message, 'error'); return; }
  S.staff = s.data; S.hr = h.data; S.attente = a.data; S.cand = c.data;
  renderDashboard(); renderPostes(); renderAttente(); renderCandidatures();
  checkRappels();
}

const posteName = (kind, id) => {
  const p = (kind === 'staff' ? S.staff : S.hr).find(x => x.id === id);
  return p ? (kind === 'staff' ? p.nom : `${p.rang} — ${CLAN_LABELS[p.clan]}`) : `#${id}`;
};

/* ───────── Accueil ───────── */
function renderDashboard() {
  const c = S.cand, now = new Date(), debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const ceMois = c.filter(x => new Date(x.created_at) >= debutMois).length;
  const acc = c.filter(x => x.statut === 'acceptee').length, ref = c.filter(x => x.statut === 'refusee').length;
  const taux = acc + ref ? Math.round(100 * acc / (acc + ref)) + ' %' : '—';
  const decides = c.filter(x => x.statut === 'acceptee' || x.statut === 'refusee');
  const delai = decides.length ? (decides.reduce((t, x) => t + (new Date(x.updated_at) - new Date(x.created_at)), 0) / decides.length / 86400000).toFixed(1) : '—';
  const attente = c.filter(x => x.statut === 'recue' || x.statut === 'examen').length;
  $('dash-stats').innerHTML = [[ceMois, 'Candidatures ce mois'], [taux, 'Taux d\'acceptation'], [delai, 'Délai moyen (jours)'], [attente, 'En attente de décision']]
    .map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');

  const css = getComputedStyle(document.documentElement);
  const col = n => css.getPropertyValue(n).trim();
  const types = ['staff', 'hr', 'oc3', 'oc4'];
  const mois = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  Object.values(charts).forEach(ch => ch.destroy());
  const textColor = col('--text2');
  charts.types = new Chart($('chart-types'), {
    type: 'doughnut',
    data: { labels: types.map(t => TYPE_LABELS[t]), datasets: [{ data: types.map(t => c.filter(x => x.type === t).length), backgroundColor: ['#B8813A', '#C4872A', '#7A9058', '#3A7055'], borderColor: col('--surface') }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } }, title: { display: true, text: 'Répartition par type', color: textColor } } },
  });
  charts.months = new Chart($('chart-months'), {
    type: 'bar',
    data: { labels: mois.map(m => m.toLocaleDateString('fr-FR', { month: 'short' })), datasets: [{ label: 'Candidatures', backgroundColor: '#B8813A',
      data: mois.map(m => c.filter(x => { const d = new Date(x.created_at); return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth(); }).length) }] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0, color: textColor } }, x: { ticks: { color: textColor } } },
      plugins: { legend: { display: false }, title: { display: true, text: 'Évolution sur 6 mois', color: textColor } } },
  });

  $('activity').innerHTML = c.slice(0, 18).map(x => `<li><b class="mono">${x.code_suivi}</b>
    <button class="link-btn" onclick="openDetail('${x.id}')">${escHtml(x.pseudo_discord)}</button>
    <span class="badge type">${TYPE_LABELS[x.type]}</span><span class="badge ${x.statut}">${STATUT_LABELS[x.statut]}</span>
    <span class="faint" style="margin-left:auto">${formatDateTime(x.created_at)}</span></li>`).join('') || '<li class="muted">Aucune candidature.</li>';
}

$('global-search').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase(), box = $('search-results');
  if (q.length < 2) { box.innerHTML = ''; return; }
  const hits = S.cand.filter(x => x.pseudo_discord.toLowerCase().includes(q) || x.code_suivi.toLowerCase().includes(q)).slice(0, 12);
  box.innerHTML = hits.map(x => `<div class="list-item" onclick="openDetail('${x.id}')"><b class="mono">${x.code_suivi}</b> ${escHtml(x.pseudo_discord)}
    <span class="badge type">${TYPE_LABELS[x.type]}</span><span class="badge ${x.statut}">${STATUT_LABELS[x.statut]}</span></div>`).join('') || '<p class="muted">Aucun résultat.</p>';
});

/* ───────── Postes ───────── */
function renderPostes() {
  $('tbl-staff').innerHTML = `<thead><tr><th>Rôle</th><th>Pôle</th><th>Places (dispo / total)</th><th>Statut</th><th></th></tr></thead><tbody>${
    S.staff.map(p => `<tr><td>${escHtml(p.nom)}</td><td>${POLE_LABELS[p.pole]}</td>
      <td><input class="num" type="number" min="0" id="sd-${p.id}" value="${p.places_dispo}"> / <input class="num" type="number" min="1" id="st-${p.id}" value="${p.places_total}"></td>
      <td><select id="ss-${p.id}">${['ouvert', 'complet', 'indispo'].map(s => `<option value="${s}" ${p.statut === s ? 'selected' : ''}>${STATUT_LABELS[s]}</option>`).join('')}</select></td>
      <td><button class="btn sm" onclick="saveStaff(${p.id}, this)">Enregistrer</button></td></tr>`).join('')}</tbody>`;
  $('tbl-hr').innerHTML = `<thead><tr><th>Rang</th><th>Clan</th><th>Titulaire</th><th>Note</th><th>Statut</th><th></th></tr></thead><tbody>${
    S.hr.map(p => `<tr><td>${escHtml(p.rang)}</td><td>${CLAN_LABELS[p.clan]}</td>
      <td><input type="text" id="ht-${p.id}" value="${escHtml(p.titulaire || '')}"></td>
      <td><input type="text" id="hn-${p.id}" value="${escHtml(p.note || '')}"></td>
      <td><select id="hs-${p.id}">${['ouvert', 'indispo'].map(s => `<option value="${s}" ${p.statut === s ? 'selected' : ''}>${STATUT_LABELS[s]}</option>`).join('')}</select></td>
      <td><button class="btn sm" onclick="saveHr(${p.id}, this)">Enregistrer</button></td></tr>`).join('')}</tbody>`;
}

async function saveStaff(id, btn) {
  const p = S.staff.find(x => x.id === id);
  const upd = { places_dispo: +$('sd-' + id).value, places_total: +$('st-' + id).value, statut: $('ss-' + id).value, updated_at: new Date().toISOString() };
  if (upd.places_dispo > upd.places_total) { showToast('Places dispo > total.', 'error'); return; }
  const opening = upd.statut === 'ouvert' && p.statut !== 'ouvert';
  if (opening) upd.ouvert_le = upd.updated_at;
  setLoading(btn, true, '…');
  const { error } = await sb.from(T.postesStaff).update(upd).eq('id', id);
  setLoading(btn, false);
  if (error) { showToast('Échec : ' + error.message, 'error'); return; }
  showToast('Poste enregistré.', 'success');
  if (opening) await onOpening('staff', id, p.nom, `${upd.places_dispo} place(s) · ${POLE_LABELS[p.pole]}`);
  loadAll();
}

async function saveHr(id, btn) {
  const p = S.hr.find(x => x.id === id);
  const upd = { titulaire: $('ht-' + id).value.trim() || null, note: $('hn-' + id).value.trim() || null, statut: $('hs-' + id).value, updated_at: new Date().toISOString() };
  const opening = upd.statut === 'ouvert' && p.statut !== 'ouvert';
  if (opening) upd.ouvert_le = upd.updated_at;
  setLoading(btn, true, '…');
  const { error } = await sb.from(T.postesHr).update(upd).eq('id', id);
  setLoading(btn, false);
  if (error) { showToast('Échec : ' + error.message, 'error'); return; }
  showToast('Rang enregistré.', 'success');
  if (opening) await onOpening('hr', id, `${p.rang} — ${CLAN_LABELS[p.clan]}`, '');
  loadAll();
}

async function onOpening(kind, id, nom, detail) {
  sendWebhook(CONFIG.discord.webhookOuvertures, buildOuvertureEmbed({ nom, detail }));
  const { data } = await sb.from(T.attente).select('*').eq('poste_id', id).eq('poste_type', kind).eq('notifie', false);
  if (!data || !data.length) return;
  const mentions = data.map(w => w.discord_id ? `<@${w.discord_id}>` : `@${w.pseudo_discord}`);
  const ok = await sendWebhook(CONFIG.discord.webhookNotifCandidats, buildWaitlistNotifEmbed({ posteNom: nom, kind, mentions }));
  sendWebhook(CONFIG.discord.webhookAdmin, { embeds: [{ title: 'Liste d\'attente notifiée', color: EMBED_COLORS.info, description: `${data.length} personne(s) pour **${escMd(nom)}**.` }] });
  if (ok) await sb.from(T.attente).update({ notifie: true }).in('id', data.map(w => w.id));
  else showToast('Webhook de notification indisponible : liste non marquée comme notifiée.', 'info');
}

/* ───────── Listes d'attente ───────── */
function renderAttente() {
  $('tbl-attente').innerHTML = `<thead><tr><th>Pseudo Discord</th><th>ID Discord</th><th>Poste</th><th>Inscrit·e le</th><th></th></tr></thead><tbody>${
    S.attente.map(w => `<tr><td>${escHtml(w.pseudo_discord)} ${w.notifie ? '<span class="badge acceptee">Notifié·e</span>' : ''}</td>
      <td><input type="text" id="wd-${w.id}" value="${escHtml(w.discord_id || '')}" placeholder="18 chiffres" inputmode="numeric"></td>
      <td>${escHtml(posteName(w.poste_type, w.poste_id))}</td><td>${formatDate(w.created_at)}</td>
      <td><button class="btn sm" onclick="saveWait(${w.id}, this)">Enregistrer</button></td></tr>`).join('')
    || '<tr><td colspan="5" class="muted">Aucune inscription.</td></tr>'}</tbody>`;
}
async function saveWait(id, btn) {
  const w = S.attente.find(x => x.id === id), v = $('wd-' + id).value.trim();
  if (!/^\d{17,20}$/.test(v)) { showToast('ID Discord invalide (17 à 20 chiffres).', 'error'); return; }
  setLoading(btn, true, '…');
  const a = await sb.from(T.membres).upsert({ pseudo_discord: w.pseudo_discord, discord_id: v, updated_at: new Date().toISOString() }, { onConflict: 'pseudo_discord' });
  const b = await sb.from(T.attente).update({ discord_id: v }).eq('pseudo_discord', w.pseudo_discord);
  setLoading(btn, false);
  if (a.error || b.error) { showToast('Échec de l\'enregistrement.', 'error'); return; }
  showToast('ID enregistré (mémorisé pour ce pseudo).', 'success');
  loadAll();
}

/* ───────── Candidatures ───────── */
const isLate = c => c.statut === 'examen' && joursDepuis(c.updated_at) > 7;

function renderCandidatures() {
  const t = $('f-type').value, s = $('f-statut').value;
  const list = S.cand.filter(c => (!t || c.type === t) && (!s || c.statut === s));
  $('cand-count').textContent = `${list.length} résultat${list.length > 1 ? 's' : ''}`;
  $('tbl-cand').innerHTML = `<thead><tr><th>Code</th><th>Pseudo</th><th>Type</th><th>Poste</th><th>Date</th><th>Assigné à</th><th>Statut</th><th></th></tr></thead><tbody>${
    list.map(c => `<tr class="${isLate(c) ? 'late' : ''}">
      <td class="mono">${c.code_suivi}</td>
      <td><button class="link-btn" data-p="${escHtml(c.pseudo_discord)}" onclick="openPseudo(this.dataset.p)">${escHtml(c.pseudo_discord)}</button></td>
      <td><span class="badge type">${TYPE_LABELS[c.type]}</span></td><td>${escHtml(c.poste || '—')}</td><td>${formatDate(c.created_at)}</td>
      <td><input type="text" value="${escHtml(c.assigne_a || '')}" onchange="assign('${c.id}', this.value)" placeholder="—"></td>
      <td><select onchange="changeStatut('${c.id}', this)" data-prev="${c.statut}">${['recue', 'examen', 'acceptee', 'refusee', 'retiree'].map(x => `<option value="${x}" ${c.statut === x ? 'selected' : ''}>${STATUT_LABELS[x]}</option>`).join('')}</select></td>
      <td><button class="btn sm ghost" onclick="openDetail('${c.id}')">Détail</button></td></tr>`).join('')
    || '<tr><td colspan="8" class="muted">Aucune candidature.</td></tr>'}</tbody>`;
}
$('f-type').addEventListener('change', renderCandidatures);
$('f-statut').addEventListener('change', renderCandidatures);

async function assign(id, v) {
  const { error } = await sb.from(T.candid).update({ assigne_a: v.trim() || null, updated_at: new Date().toISOString() }).eq('id', id);
  showToast(error ? 'Échec de l\'assignation.' : 'Assigné·e.', error ? 'error' : 'success');
  if (!error) { const c = S.cand.find(x => x.id === id); c.assigne_a = v.trim() || null; }
}

function changeStatut(id, sel) {
  const c = S.cand.find(x => x.id === id), next = sel.value;
  if (next === 'acceptee' || next === 'refusee') { decisionModal(c, next, () => { sel.value = c.statut; }); return; }
  applyStatut(c, next).then(ok => { if (!ok) sel.value = c.statut; });
}
async function applyStatut(c, statut) {
  const { error } = await sb.from(T.candid).update({ statut, updated_at: new Date().toISOString() }).eq('id', c.id);
  if (error) { showToast('Échec : ' + error.message, 'error'); return false; }
  showToast('Statut mis à jour.', 'success');
  loadAll(); return true;
}

function decisionModal(c, statut, onCancel) {
  const ok = statut === 'acceptee';
  let done = false;
  const m = openModal(`<h2>${ok ? 'Accepter' : 'Refuser'} la candidature</h2>
    <p class="muted">${escHtml(c.pseudo_discord)} · <span class="mono">${c.code_suivi}</span></p>
    <div class="tpl-row">${TEMPLATES[statut].map(([l, t], i) => `<button type="button" class="btn sm ghost" data-tpl="${i}">${l}</button>`).join('')}</div>
    <div class="field"><label for="dec-note">Note obligatoire (min. 20 caractères)</label><textarea id="dec-note" maxlength="1500"></textarea>
    <div class="hint">Cette note est envoyée au candidat avec la notification de décision et enregistrée dans les notes internes.</div><div class="err"></div></div>
    <div class="modal-actions"><button class="btn ghost" data-close>Annuler</button><button class="btn ${ok ? '' : 'danger'}" id="dec-go">Confirmer</button></div>`,
    { onClose: () => { if (!done) onCancel(); } });
  const ta = m.el.querySelector('#dec-note');
  m.el.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { ta.value = TEMPLATES[statut][+b.dataset.tpl][1]; });
  m.el.querySelector('#dec-go').onclick = async e => {
    const note = ta.value.trim();
    if (note.length < 20) { ta.closest('.field').classList.add('invalid'); ta.closest('.field').querySelector('.err').textContent = 'Minimum 20 caractères.'; return; }
    setLoading(e.currentTarget, true, '…');
    const { error } = await sb.from(T.candid).update({ statut, updated_at: new Date().toISOString() }).eq('id', c.id);
    if (error) { setLoading(e.currentTarget, false); showToast('Échec : ' + error.message, 'error'); return; }
    await addNote(c, S.author, note, { silentToast: true });
    const { data: mem } = await sb.from(T.membres).select('discord_id').eq('pseudo_discord', c.pseudo_discord).maybeSingle();
    sendWebhook(CONFIG.discord.webhookNotifCandidats, buildDecisionEmbed({ code: c.code_suivi, pseudo: c.pseudo_discord, statut, note, mention: mem ? `<@${mem.discord_id}>` : undefined }));
    done = true; m.close(); showToast('Décision enregistrée.', 'success'); loadAll();
  };
}

async function addNote(c, auteur, contenu, { silentToast } = {}) {
  const { error } = await sb.from(T.notes).insert({ candidature_id: c.id, auteur, contenu });
  if (error) { showToast('Note non enregistrée.', 'error'); return false; }
  sendWebhook(CONFIG.discord.webhookAdmin, { embeds: [{ title: 'Note ajoutée', color: EMBED_COLORS.info,
    fields: [{ name: 'Auteur', value: escMd(auteur), inline: true }, { name: 'Candidature', value: `${c.code_suivi} · ${escMd(c.pseudo_discord)}`, inline: true }, { name: 'Note', value: contenu.slice(0, 1000) }] }] });
  if (!silentToast) showToast('Note ajoutée.', 'success');
  return true;
}

/* ───────── Détail ───────── */
async function openDetail(id) {
  const c = S.cand.find(x => x.id === id); if (!c) return;
  const [full, notes] = await Promise.all([
    sb.from(T.candid).select('donnees').eq('id', id).single(),
    sb.from(T.notes).select('*').eq('candidature_id', id).order('created_at'),
  ]);
  const sections = full.data?.donnees?.sections || [];
  const noteHtml = list => list.map(n => `<div class="note"><small>${escHtml(n.auteur)} · ${formatDateTime(n.created_at)}</small><div>${escHtml(n.contenu)}</div></div>`).join('') || '<p class="muted">Aucune note.</p>';
  const m = openModal(`<h2>${escHtml(c.pseudo_discord)}</h2>
    <p><span class="mono">${c.code_suivi}</span> · <span class="badge type">${TYPE_LABELS[c.type]}</span> <span class="badge ${c.statut}">${STATUT_LABELS[c.statut]}</span> · ${escHtml(c.poste || '')}</p>
    <div class="faint">Déposée le ${formatDateTime(c.created_at)}</div>
    ${sections.map(s => `<div class="qa-section">${escHtml(s.titre)}</div><dl class="qa">${s.items.map(i => `<dt>${escHtml(i.q)}</dt><dd>${escHtml(i.r)}</dd>`).join('')}</dl>`).join('')}
    <div class="qa-section">Notes internes</div><div id="notes-box">${noteHtml(notes.data || [])}</div>
    <div class="field"><input type="text" id="n-auteur" value="${escHtml(S.author)}" placeholder="Auteur"></div>
    <div class="field"><textarea id="n-contenu" placeholder="Ajouter une note…" style="min-height:70px"></textarea></div>
    <div class="modal-actions"><button class="btn ghost" id="pdf"><i class="ti ti-file-type-pdf"></i> Export PDF</button><button class="btn ghost" id="n-add">Ajouter la note</button><button class="btn" data-close>Fermer</button></div>`, { wide: true });
  m.el.querySelector('#pdf').onclick = () => exportPdf(c, sections, notes.data || []);
  m.el.querySelector('#n-add').onclick = async e => {
    const auteur = m.el.querySelector('#n-auteur').value.trim(), contenu = m.el.querySelector('#n-contenu').value.trim();
    if (!auteur || !contenu) { showToast('Auteur et contenu requis.', 'error'); return; }
    setLoading(e.currentTarget, true, '…');
    if (await addNote(c, auteur, contenu)) {
      const r = await sb.from(T.notes).select('*').eq('candidature_id', id).order('created_at');
      m.el.querySelector('#notes-box').innerHTML = noteHtml(r.data || []);
      m.el.querySelector('#n-contenu').value = '';
    }
    setLoading(e.currentTarget, false);
  };
}

function exportPdf(c, sections, notes) {
  const w = window.open('', '_blank');
  if (!w) { showToast('Autorise les pop-ups pour exporter.', 'error'); return; }
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${escHtml(c.code_suivi)} — ${escHtml(c.pseudo_discord)}</title>
    <style>body{font:14px/1.5 Georgia,serif;color:#111;max-width:760px;margin:30px auto;padding:0 20px}h1{font-size:22px;margin:0}h2{font-size:15px;border-bottom:1px solid #999;margin-top:22px;color:#6a4510}
    dt{font-weight:bold;margin-top:10px}dd{margin:2px 0 0;white-space:pre-wrap}.m{color:#555;font-size:12px}.n{border:1px solid #ccc;padding:6px 10px;margin:6px 0;white-space:pre-wrap}</style></head><body>
    <h1>${escHtml(CONFIG.site.nom)} — Candidature ${TYPE_LABELS[c.type]}</h1>
    <p class="m">${escHtml(c.pseudo_discord)} · ${c.code_suivi} · ${STATUT_LABELS[c.statut]} · ${formatDate(c.created_at)}${c.poste ? ' · ' + escHtml(c.poste) : ''}${c.assigne_a ? ' · Assigné·e : ' + escHtml(c.assigne_a) : ''}</p>
    ${sections.map(s => `<h2>${escHtml(s.titre)}</h2><dl>${s.items.map(i => `<dt>${escHtml(i.q)}</dt><dd>${escHtml(i.r)}</dd>`).join('')}</dl>`).join('')}
    ${notes.length ? `<h2>Notes internes</h2>${notes.map(n => `<div class="n"><span class="m">${escHtml(n.auteur)} · ${formatDateTime(n.created_at)}</span><br>${escHtml(n.contenu)}</div>`).join('')}` : ''}
    </body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

async function openPseudo(pseudo) {
  const list = S.cand.filter(c => c.pseudo_discord.toLowerCase() === pseudo.toLowerCase());
  openModal(`<h2>Historique — ${escHtml(pseudo)}</h2>${list.map(c => `<div class="list-item" onclick="openDetail('${c.id}')">
    <b class="mono">${c.code_suivi}</b><span class="badge type">${TYPE_LABELS[c.type]}</span><span class="badge ${c.statut}">${STATUT_LABELS[c.statut]}</span>
    <span>${escHtml(c.poste || '')}</span><span class="faint" style="margin-left:auto">${formatDate(c.created_at)}</span></div>`).join('')}
    <div class="modal-actions"><button class="btn" data-close>Fermer</button></div>`);
}

/* ───────── Rappel 48h ───────── */
// Exécuté à l'ouverture du panel : un rappel unique par candidature « reçue » sans changement depuis 48h.
async function checkRappels() {
  const due = S.cand.filter(c => c.statut === 'recue' && !c.rappel_envoye && Date.now() - new Date(c.created_at) > 48 * 3600e3);
  if (!due.length) return;
  const ok = await sendWebhook(CONFIG.discord.webhookAdmin, { embeds: [{
    title: '⏰ Candidatures en attente depuis plus de 48h', color: EMBED_COLORS.ko,
    description: due.slice(0, 20).map(c => `• \`${c.code_suivi}\` ${escMd(c.pseudo_discord)} (${TYPE_LABELS[c.type]}) — ${joursDepuis(c.created_at)} j`).join('\n'),
  }] });
  if (ok) {
    await sb.from(T.candid).update({ rappel_envoye: true }).in('id', due.map(c => c.id));
    due.forEach(c => { c.rappel_envoye = true; });
  }
}

init();
