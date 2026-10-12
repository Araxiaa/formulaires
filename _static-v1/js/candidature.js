const ROLE_QUESTIONS = {
  'Parrain/Marraine':        ['Comment accueillerais-tu un nouveau membre perdu ?', 'Comment gères-tu un ticket urgent quand tu es occupé·e ?', 'Comment maintiens-tu une attitude bienveillante face à des demandes répétitives ?'],
  'Régisseur·se de fiche':   ['Comment vérifies-tu la cohérence génétique d\'une fiche ?', 'Comment formules-tu un retour de correction sans décourager le membre ?', 'Un membre conteste ta correction — comment réagis-tu ?'],
  'Généticien·ne':           ['Explique le fonctionnement de l\'hérédité de la couleur des yeux dans le Codex.', 'Un membre demande un pelage rare pour son OC — comment évalues-tu la demande ?', 'Comment tiens-tu un registre génétique à jour sur un serveur actif ?'],
  'Animateur/Animatrice':    ['Propose une idée d\'événement Hors-RP pour le serveur.', 'Comment relances-tu la participation quand un événement génère peu d\'engouement ?', 'Comment adaptes-tu une animation pour qu\'elle convienne à différentes tranches d\'horaires ?'],
  'Gestion RP':              ['Un membre vient en ticket avec une intrigue complexe — comment l\'accompagnes-tu ?', 'Comment t\'assures-tu de la cohérence d\'une intrigue avec le lore existant ?', 'Comment équilibres-tu l\'accompagnement de plusieurs membres simultanément ?'],
  'Plume':                   ['Rédige un court texte narratif décrivant une aube dans la forêt du Clan du Tonnerre.', 'Comment résumes-tu un événement collectif important pour une newsletter ?', 'Comment maintiens-tu un style cohérent entre plusieurs auteurs pour le lore officiel ?'],
  'Gestion PNJ':             ['Comment gères-tu un PNJ impliqué dans plusieurs fils narratifs actifs ?', 'Crée un concept de PNJ secondaire pour le Clan de l\'Ombre.', 'Un PNJ que tu joues doit prendre une décision qui déplaira à certains membres — comment procèdes-tu ?'],
  'Bâtisseur/Bâtisseuse':    ['Comment organiserais-tu les salons pour un nouveau lieu RP (ex : une grotte découverte) ?', 'Un incendie narratif ravage une partie du territoire — comment adaptes-tu les salons ?', 'Quelle est la différence entre un salon "privé clan" et un salon "frontière" dans ton organisation ?'],
};

const RANG_QUESTIONS = {
  'meneur': [
    'Un clan allié demande refuge sur ton territoire après une catastrophe. Certains guerriers s\'y opposent. Comment gères-tu cette situation ?',
    'Tu dois prendre une décision vitale pour ton clan en l\'absence de ton lieutenant·e. Comment procèdes-tu ?',
    'Ton clan traverse une période de faible activité. Comment maintiens-tu la cohésion et motives-tu tes membres ?'],
  'lieutenant': [
    'Ton meneur·se est absent·e plusieurs jours. Un conflit éclate entre deux guerriers. Comment interviens-tu ?',
    'Tu dois composer des patrouilles pour la semaine en tenant compte des forces et des tensions entre membres. Décris ton approche.',
    'Un jeune guerrier conteste ouvertement une de tes décisions devant le clan. Comment réagis-tu ?'],
  'guerisseur': [
    'Décris comment tu soignerais un guerrier revenant d\'un combat avec une blessure grave et de la fièvre.',
    'Tu apprends que ton médicat cache une information importante au meneur·se. Que fais-tu ?',
    'Quelle place le Guérisseur·se occupe-t-il selon toi dans l\'équilibre du clan, au-delà des soins physiques ?'],
  'apprenti': [
    'Ton mentor oublie de te former pendant plusieurs jours. Comment gères-tu cette situation ?',
    'Tu assistes à une injustice commise par un guerrier haut placé. Que fais-tu ?',
    'Qu\'est-ce qui t\'a amené·e à vouloir incarner un·e Apprenti·e plutôt qu\'un rang de guerrier ordinaire ?'],
};
const rangKey = r => /meneur/i.test(r) ? 'meneur' : /lieutenant/i.test(r) ? 'lieutenant' : /gu[ée]risseur/i.test(r) ? 'guerisseur' : 'apprenti';
const DYN_MIN = 30;

/* Définition des champs : [name, label, type, min, placeholder] */
const F = (name, label, type = 'text', min = 0, ph = '') => ({ name, label, type, min, ph });
const STAFF_GENERAL = [
  F('pseudo', 'Pseudo Discord (et identifiant si différent)', 'text', 0, 'ex : pseudo#0000 / pseudo'),
  F('anciennete', 'Ancienneté sur le serveur', 'text', 0, 'ex : 2 mois'),
  F('presentation', 'Présentation personnelle', 'textarea', 150),
  F('dispos', 'Disponibilités hebdomadaires', 'textarea', 0, 'Jours, horaires, nombre d\'heures…'),
  F('plaisir', 'Ce qui te plaît dans le serveur', 'textarea', 100),
  F('experience', 'Expérience associative / communautaire précédente', 'textarea', 0),
];
const HR_GENERAL = [
  F('pseudo', 'Pseudo Discord'),
  F('oc_nom', 'Nom de l\'OC candidat·e + rang actuel dans le clan'),
  F('anciennete', 'Ancienneté sur le serveur'),
  F('oc_anciennete', 'Ancienneté de l\'OC'),
  F('frequence', 'Fréquence de jeu avec cet OC (RP par semaine environ)'),
  F('scenes', 'Liens vers 2-3 scènes RP représentatives', 'textarea', 0, 'Un lien par ligne'),
];
const HR_RP = [
  F('motivation', 'Motivation IC : pourquoi cet OC veut ce rang', 'textarea', 150),
  F('extrait', 'Extrait roleplay libre', 'textarea', 200),
];
const OC_FIELDS = [
  F('pseudo', 'Pseudo Discord'),
  F('anciennete', 'Ancienneté sur le serveur'),
  F('ocs_actuels', 'Liste de tes OCs actuels + fréquence de jeu avec chacun', 'textarea'),
  F('activite', 'Activité RP globale (RP par semaine environ)'),
  F('clan', 'Clan visé pour le nouvel OC', 'select'),
  F('nom_oc', 'Nom envisagé pour le personnage'),
  F('concept', 'Concept et personnalité de l\'OC', 'textarea', 120),
  F('pourquoi', 'Pourquoi souhaites-tu un OC supplémentaire ?', 'textarea', 100),
];
const OC4_EXTRA = F('extrait', 'Extrait roleplay obligatoire avec cet OC ou dans le style prévu', 'textarea', 200);

const forms = {};
const $ = id => document.getElementById(id);

function fieldHtml(fid, f, section, extra = '') {
  const id = `${fid}__${f.name}`;
  let ctl;
  if (f.type === 'textarea') ctl = `<textarea id="${id}" name="${f.name}" maxlength="3000" placeholder="${escHtml(f.ph)}" ${extra}></textarea>`;
  else if (f.type === 'select') ctl = `<select id="${id}" name="${f.name}" ${extra}><option value="">— Choisir —</option>${f.options || ''}</select>`;
  else ctl = `<input id="${id}" name="${f.name}" type="text" maxlength="200" placeholder="${escHtml(f.ph)}" ${extra}>`;
  return `<div class="field" data-section="${escHtml(section)}" data-q="${escHtml(f.label)}" data-min="${f.min}">
    <label for="${id}">${escHtml(f.label)} <span class="req">*</span></label>${ctl}
    ${f.min ? `<div class="counter">0 / ${f.min} caractères min.</div>` : ''}
    <div class="err"></div></div>`;
}

const sect = t => `<h2 class="form-section">${escHtml(t)}</h2>`;
const submitBar = `<div class="modal-actions"><button type="submit" class="btn"><i class="ti ti-eye"></i> Prévisualiser et envoyer</button></div>`;

/* Compteurs en temps réel (délégation) */
function bindCounters(form) {
  form.addEventListener('input', e => {
    const wrap = e.target.closest('.field'); if (!wrap) return;
    const min = +wrap.dataset.min; if (!min) return;
    const n = e.target.value.trim().length, c = wrap.querySelector('.counter');
    c.textContent = `${n} / ${min} caractères min.`;
    c.className = 'counter ' + (n >= min ? 'ok' : n > 0 ? 'mid' : '');
    wrap.classList.remove('invalid');
  });
  form.addEventListener('change', e => e.target.closest('.field')?.classList.remove('invalid'));
}

function renderDynamic(box, questions, section, prefix) {
  box.innerHTML = questions.map((q, i) =>
    fieldHtml(box.dataset.form, { name: `${prefix}_q${i + 1}`, label: q, type: 'textarea', min: DYN_MIN }, section, 'data-dynamic')).join('');
}

/* ───────── Staff ───────── */
async function buildStaff(postes) {
  const form = $('form-staff'); forms.staff = form;
  const opts = POLES.map(p => {
    const l = postes.filter(x => x.pole === p.id);
    return l.length ? `<optgroup label="${p.nom}">${l.map(x => `<option value="${x.id}">${escHtml(x.nom)}</option>`).join('')}</optgroup>` : '';
  }).join('');
  form.innerHTML = sect('Informations générales') + STAFF_GENERAL.map(f => fieldHtml('staff', f, 'Informations générales')).join('')
    + sect('Rôle(s) souhaité(s)')
    + fieldHtml('staff', { name: 'role1', label: 'Rôle principal', type: 'select', options: opts }, 'Rôle(s)')
    + fieldHtml('staff', { name: 'role2', label: 'Second rôle (optionnel)', type: 'select', options: opts }, 'Rôle(s)')
    + '<div id="dyn-staff-1" data-form="staff"></div><div id="dyn-staff-2" data-form="staff"></div>' + submitBar;
  form.querySelector('[name=role2]').closest('.field').querySelector('.req').remove();
  form.querySelector('[name=role2]').closest('.field').dataset.optional = '1';
  const upd = (sel, box, prefix) => {
    const opt = sel.selectedOptions[0];
    if (!sel.value) { box.innerHTML = ''; return; }
    renderDynamic(box, ROLE_QUESTIONS[opt.textContent] || [], `Questions — ${opt.textContent}`, prefix);
  };
  const r1 = form.querySelector('[name=role1]'), r2 = form.querySelector('[name=role2]');
  r1.addEventListener('change', () => upd(r1, $('dyn-staff-1'), 'r1'));
  r2.addEventListener('change', () => upd(r2, $('dyn-staff-2'), 'r2'));
  const pre = new URLSearchParams(location.search).get('role');
  if (pre && r1.querySelector(`option[value="${+pre}"]`)) { r1.value = +pre; upd(r1, $('dyn-staff-1'), 'r1'); }
}

/* ───────── Hauts Rangs ───────── */
async function buildHr(postes) {
  const form = $('form-hr'); forms.hr = form;
  const opts = CLANS.map(c => {
    const l = postes.filter(x => x.clan === c.id);
    return l.length ? `<optgroup label="${c.nom}">${l.map(x => `<option value="${x.id}" data-rang="${escHtml(x.rang)}" data-clan="${c.id}">${escHtml(x.rang)}</option>`).join('')}</optgroup>` : '';
  }).join('');
  form.innerHTML = sect('Informations générales') + HR_GENERAL.map(f => fieldHtml('hr', f, 'Informations générales')).join('')
    + sect('Rang visé')
    + (opts ? fieldHtml('hr', { name: 'rang', label: 'Rang', type: 'select', options: opts }, 'Rang visé')
            : '<div class="notice">Aucun poste de Haut Rang n\'est ouvert actuellement.</div>')
    + '<div id="dyn-hr" data-form="hr"></div>'
    + sect('Section RP') + HR_RP.map(f => fieldHtml('hr', f, 'Section RP')).join('') + (opts ? submitBar : '');
  const sel = form.querySelector('[name=rang]');
  if (!sel) return;
  const upd = () => {
    const o = sel.selectedOptions[0];
    if (!sel.value) { $('dyn-hr').innerHTML = ''; return; }
    renderDynamic($('dyn-hr'), RANG_QUESTIONS[rangKey(o.dataset.rang)], `Mises en situation — ${o.dataset.rang}`, 'h');
  };
  sel.addEventListener('change', upd);
  const pre = new URLSearchParams(location.search).get('hr');
  if (pre && sel.querySelector(`option[value="${+pre}"]`)) { sel.value = +pre; upd(); }
}

/* ───────── OC ───────── */
function buildOc(id) {
  const form = $('form-' + id); forms[id] = form;
  const clanOpts = CLANS.map(c => `<option value="${c.nom}">${c.nom}</option>`).join('');
  const fields = OC_FIELDS.map(f => f.name === 'clan' ? { ...f, options: clanOpts } : f);
  if (id === 'oc4') fields.push(OC4_EXTRA);
  form.innerHTML = fields.map(f => fieldHtml(id, f, id === 'oc3' ? '3ème OC' : '4ème OC')).join('') + submitBar;
}

/* ───────── Collecte / validation ───────── */
function validate(form) {
  let first = null;
  form.querySelectorAll('.field').forEach(w => {
    const el = w.querySelector('input,textarea,select');
    if (!el) return;
    const v = el.value.trim(), min = +w.dataset.min;
    let msg = '';
    if (!v && !w.dataset.optional) msg = 'Ce champ est obligatoire.';
    else if (min && v && v.length < min) msg = `Minimum ${min} caractères (${v.length} actuellement).`;
    w.classList.toggle('invalid', !!msg);
    w.querySelector('.err').textContent = msg;
    if (msg && !first) first = w;
  });
  const r1 = form.querySelector('[name=role1]'), r2 = form.querySelector('[name=role2]');
  if (r1 && r2 && r1.value && r1.value === r2.value) {
    const w = r2.closest('.field'); w.classList.add('invalid'); w.querySelector('.err').textContent = 'Choisis deux rôles différents.'; first = first || w;
  }
  if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); showToast('Certains champs sont à corriger.', 'error'); }
  return !first;
}

function collect(type, form) {
  const sections = [], meta = {};
  form.querySelectorAll('.field').forEach(w => {
    const el = w.querySelector('input,textarea,select'); if (!el || !el.value.trim()) return;
    const titre = w.dataset.section;
    let s = sections.find(x => x.titre === titre);
    if (!s) sections.push(s = { titre, items: [] });
    s.items.push({ q: w.dataset.q, r: el.tagName === 'SELECT' ? el.selectedOptions[0].textContent : el.value.trim() });
  });
  const pseudo = form.querySelector('[name=pseudo]').value.trim();
  let poste_id = null;
  if (type === 'staff') {
    const r1 = form.querySelector('[name=role1]'), r2 = form.querySelector('[name=role2]');
    poste_id = +r1.value;
    meta.roles = [r1.selectedOptions[0].textContent, ...(r2.value ? [r2.selectedOptions[0].textContent] : [])];
    meta.poste_ids = [+r1.value, ...(r2.value ? [+r2.value] : [])];
    meta.poste = meta.roles.join(' + ');
  } else if (type === 'hr') {
    const o = form.querySelector('[name=rang]').selectedOptions[0];
    meta.poste_hr_id = +o.value; meta.clan = o.dataset.clan;
    meta.poste = `${o.dataset.rang} — ${CLAN_LABELS[o.dataset.clan]}`;
  } else {
    meta.clan = form.querySelector('[name=clan]').value;
    meta.poste = `${TYPE_LABELS[type]} · ${form.querySelector('[name=nom_oc]').value.trim()}`;
  }
  return { pseudo, poste_id, sections, meta };
}

function previewHtml(sections) {
  return sections.map(s => `<div class="qa-section">${escHtml(s.titre)}</div><dl class="qa">${
    s.items.map(i => `<dt>${escHtml(i.q)}</dt><dd>${escHtml(i.r)}</dd>`).join('')}</dl>`).join('');
}

async function onSubmit(type, form, e) {
  e.preventDefault();
  if (!sb) return showDbError();
  if (!validate(form)) return;
  const c = collect(type, form);
  const btn = form.querySelector('button[type=submit]');
  setLoading(btn, true, 'Vérification…');
  const { data: dup, error: dupErr } = await sb.rpc('cand_doublon', { p_pseudo: c.pseudo, p_type: type });
  setLoading(btn, false);
  if (dupErr) { showToast('Erreur de connexion, réessaie.', 'error'); return; }
  if (dup) { showToast(`Tu as déjà une candidature « ${TYPE_LABELS[type]} » en cours pour ce pseudo.`, 'error'); return; }

  const m = openModal(`<h2>Vérifie ta candidature</h2><p class="muted">${escHtml(c.meta.poste || TYPE_LABELS[type])} · ${escHtml(c.pseudo)}</p>
    ${previewHtml(c.sections)}
    <div class="modal-actions"><button class="btn ghost" data-close>Modifier</button><button class="btn" id="confirm"><i class="ti ti-send"></i> Confirmer l'envoi</button></div>`, { wide: true });
  m.el.querySelector('#confirm').addEventListener('click', ev => submit(type, form, c, m, ev.currentTarget));
}

async function submit(type, form, c, modal, btn) {
  setLoading(btn, true, 'Envoi…');
  let code, error;
  for (let i = 0; i < 4; i++) {
    code = generateCode();
    ({ error } = await sb.from(T.candid).insert({
      code_suivi: code, type, poste_id: c.poste_id, pseudo_discord: c.pseudo,
      donnees: { sections: c.sections, meta: c.meta },
    }));
    if (!error || error.code !== '23505') break; // 23505 = code déjà pris → on retente
  }
  if (error) { setLoading(btn, false); showToast('Envoi impossible, réessaie dans un instant.', 'error'); return; }

  const hook = { staff: CONFIG.discord.webhookStaff, hr: CONFIG.discord.webhookHR }[type] || CONFIG.discord.webhookOC;
  sendWebhook(hook, buildCandidatureEmbed({ type, code, pseudo: c.pseudo, poste: c.meta.poste, sections: c.sections }));
  clearDraft(type);
  form.reset(); form.querySelectorAll('[data-dynamic]').forEach(e => e.closest('.field').remove());
  form.querySelectorAll('.counter').forEach(e => { e.className = 'counter'; e.textContent = e.textContent.replace(/^\d+/, '0'); });

  modal.el.querySelector('.modal').innerHTML = `<div class="center"><h2>Candidature envoyée !</h2>
    <p>Conserve précieusement ton code de suivi :</p>
    <p class="mono" style="font-size:1.8rem;letter-spacing:.1em;color:var(--accent)">${code}</p>
    <div class="modal-actions" style="justify-content:center">
      <button class="btn ghost" id="cp"><i class="ti ti-copy"></i> Copier</button>
      <a class="btn" href="suivi.html?code=${code}">Suivre ma candidature</a></div></div>`;
  modal.el.querySelector('#cp').onclick = async () => showToast(await copyText(code) ? 'Code copié !' : 'Copie impossible.', 'info');
}

/* ───────── Init ───────── */
function showTab(t) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  ['staff', 'hr'].forEach(k => $('panel-' + k).classList.toggle('hidden', t !== k));
  $('panel-oc').classList.toggle('hidden', t !== 'oc');
}
function showOc(o) {
  document.querySelectorAll('#oc-tabs button').forEach(b => b.classList.toggle('active', b.dataset.oc === o));
  $('panel-oc3').classList.toggle('hidden', o !== 'oc3'); $('panel-oc4').classList.toggle('hidden', o !== 'oc4');
}
document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
document.querySelectorAll('#oc-tabs button').forEach(b => b.addEventListener('click', () => showOc(b.dataset.oc)));

(async function init() {
  buildOc('oc3'); buildOc('oc4');
  let staff = [], hr = [];
  if (!sb) {
    $('dbwarn').innerHTML = '<div class="notice">La base de données n\'est pas encore configurée (<code>js/config.js</code>) : les rôles ne peuvent pas être chargés.</div>';
  } else {
    const [s, h] = await Promise.all([
      sb.from(T.postesStaff).select('id,pole,nom').eq('statut', 'ouvert').order('id'),
      sb.from(T.postesHr).select('id,clan,rang').eq('statut', 'ouvert').order('id'),
    ]);
    if (s.error || h.error) $('dbwarn').innerHTML = '<div class="notice">Impossible de charger les postes ouverts.</div>';
    staff = s.data || []; hr = h.data || [];
  }
  await buildStaff(staff); await buildHr(hr);
  for (const [type, form] of Object.entries(forms)) {
    bindCounters(form);
    form.addEventListener('submit', e => onSubmit(type, form, e));
    Autosave.init(form, type);
  }
  const p = new URLSearchParams(location.search);
  if (p.get('tab') === 'hr' || p.get('hr')) showTab('hr');
  initReveal();
})();
