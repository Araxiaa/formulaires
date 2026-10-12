const MESSAGES = {
  recue:    'Ta candidature est bien arrivée chez nous. Merci de ta confiance : un·e membre du staff va bientôt s\'en occuper.',
  examen:   'Ton dossier est en cours d\'examen par l\'équipe. Cela peut prendre quelques jours, merci de ta patience.',
  acceptee: 'Félicitations, ta candidature est acceptée ! Le staff te contactera sur Discord pour la suite.',
  refusee:  'Ta candidature n\'a malheureusement pas été retenue cette fois. Tu pourras retenter plus tard, et le staff est là si tu as des questions.',
  retiree:  'Cette candidature a été retirée.',
};
const $ = id => document.getElementById(id);
const res = $('result');

function setMode(mode) {
  document.querySelectorAll('.toggle button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('form-code').classList.toggle('hidden', mode !== 'code');
  $('form-pseudo').classList.toggle('hidden', mode !== 'pseudo');
  res.innerHTML = '';
}
document.querySelectorAll('.toggle button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });

async function loadCode(code) {
  if (!sb) return showDbError();
  code = code.trim().toUpperCase();
  if (!/^TRV-[A-Z0-9]{6}$/.test(code)) { showToast('Format attendu : TRV-XXXXXX', 'error'); return; }
  const btn = $('form-code').querySelector('button');
  setLoading(btn, true, 'Recherche…');
  const { data, error } = await sb.rpc('cand_suivi_code', { p_code: code });
  setLoading(btn, false);
  if (error) { showToast('Erreur de connexion, réessaie.', 'error'); return; }
  if (!data || !data.length) { res.innerHTML = '<div class="notice">Aucune candidature trouvée pour ce code.</div>'; return; }
  renderResult(data[0]);
}

function renderResult(c) {
  const s = c.statut, retiree = s === 'retiree';
  const lvl = { recue: 1, examen: 2, acceptee: 3, refusee: 3, retiree: 0 }[s];
  const step = (n, icon, label, extra = '') =>
    `<div class="step ${lvl >= n ? 'done' : ''} ${extra}"><div class="dot"><i class="ti ${icon}"></i></div><span>${label}</span></div>`;
  const decIcon = s === 'acceptee' ? 'ti-check' : s === 'refusee' ? 'ti-x' : 'ti-gavel';
  const decLabel = s === 'acceptee' ? 'Acceptée' : s === 'refusee' ? 'Refusée' : 'Décision';
  const shareUrl = `${CONFIG.site.url}suivi.html?code=${c.code_suivi}`;
  res.innerHTML = `<div class="panel reveal in">
    <div class="row"><h2 class="mono grow" style="margin:0">${escHtml(c.code_suivi)}</h2><span class="badge ${s}">${STATUT_LABELS[s]}</span></div>
    <p class="muted">${TYPE_LABELS[c.type] || c.type}${c.poste_nom ? ' · ' + escHtml(c.poste_nom) : ''} · ${escHtml(c.pseudo_discord)}</p>
    ${retiree ? '' : `<div class="steps">${step(1, 'ti-inbox', 'Reçue')}${step(2, 'ti-eye', 'En cours d\'examen')}${step(3, decIcon, decLabel, s === 'acceptee' ? 'ok' : s === 'refusee' ? 'bad' : '')}</div>`}
    <p>${MESSAGES[s]}</p>
    <p class="faint">${formatDuree(c.created_at, 'Ouverte depuis')} · déposée le ${formatDate(c.created_at)}</p>
    <div class="row">
      <button class="btn ghost" id="share"><i class="ti ti-share"></i> Partager ma candidature</button>
      ${s === 'recue' || s === 'examen' ? '<button class="btn danger" id="withdraw"><i class="ti ti-trash"></i> Retirer ma candidature</button>' : ''}
    </div></div>`;
  $('share').onclick = async () => showToast(await copyText(shareUrl) ? 'Lien copié !' : 'Copie impossible.', 'info');
  const w = $('withdraw');
  if (w) w.onclick = async () => {
    if (!confirm('Retirer définitivement cette candidature ?')) return;
    setLoading(w, true, 'Retrait…');
    const { data, error } = await sb.rpc('cand_retirer', { p_code: c.code_suivi });
    setLoading(w, false);
    if (error || data !== true) { showToast('Retrait impossible.', 'error'); return; }
    showToast('Candidature retirée.', 'success');
    loadCode(c.code_suivi);
  };
}

$('form-code').addEventListener('submit', e => { e.preventDefault(); loadCode($('code').value); });

$('form-pseudo').addEventListener('submit', async e => {
  e.preventDefault();
  if (!sb) return showDbError();
  const pseudo = $('pseudo').value.trim();
  if (pseudo.length < 2) return;
  const btn = e.target.querySelector('button');
  setLoading(btn, true, 'Recherche…');
  const { data, error } = await sb.rpc('cand_suivi_pseudo', { p_pseudo: pseudo });
  setLoading(btn, false);
  if (error) { showToast('Erreur de connexion, réessaie.', 'error'); return; }
  if (!data.length) { res.innerHTML = '<div class="notice">Aucune candidature pour ce pseudo.</div>'; return; }
  res.innerHTML = data.map(c => `<div class="list-item" data-code="${escHtml(c.code_suivi)}">
      <b class="mono">${escHtml(c.code_suivi)}</b><span class="badge type">${TYPE_LABELS[c.type] || c.type}</span>
      <span class="badge ${c.statut}">${STATUT_LABELS[c.statut]}</span><span class="faint" style="margin-left:auto">${formatDate(c.created_at)}</span></div>`).join('');
  res.querySelectorAll('.list-item').forEach(it => it.addEventListener('click', () => {
    setMode('code'); $('code').value = it.dataset.code; loadCode(it.dataset.code);
  }));
});

const urlCode = new URLSearchParams(location.search).get('code');
if (urlCode) { $('code').value = urlCode.toUpperCase(); loadCode(urlCode); }
