const ROLE_DETAILS = {
  '1': { tasks: ["Accueil des nouveaux membres et réponse à leurs premières questions", "Prise en charge et suivi des tickets ouverts par les membres", "Accompagnement lors de la création et validation des premiers personnages"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "5h / semaine minimum" },
  '2': { tasks: ["Lecture et correction des fiches de personnage soumises", "Vérification de la cohérence avec les règles du serveur (génétique, noms, rangs)", "Retours bienveillants et guidage des membres lors des corrections"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "5h / semaine minimum" },
  '3': { tasks: ["Traitement des demandes de génétique (pelages, yeux, traits hérités)", "Gestion et mise à jour du registre génétique du serveur", "Accompagnement des membres sur les questions génétiques complexes"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "4h / semaine minimum",
         note: "Une solide maîtrise de la génétique féline et du Codex du serveur est indispensable." },
  '4': { tasks: ["Conception et animation d'événements Hors-RP (jeux, concours, activités)", "Organisation des activités récurrentes (Membre du Mois, OC du Mois…)", "Animation de la vie communautaire en dehors du roleplay"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "5h / semaine minimum" },
  '5': { tasks: ["Réponse aux tickets RP pour aider les membres à développer l'histoire de leur OC", "Co-construction d'intrigues personnalisées avec les membres en demande", "Suivi et cohérence des arcs narratifs en cours"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "5h / semaine minimum" },
  '6': { tasks: ["Rédaction des résumés d'événements et des actualités du serveur", "Écriture du lore officiel, des descriptions de lieux et des PNJ notables", "Production des textes narratifs pour les grands événements collectifs"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "5h / semaine minimum",
         note: "Un extrait de rédaction narrative est requis lors de la candidature." },
  '7': { tasks: ["Gestion et incarnation des PNJ lors des interactions avec les membres", "Création de nouveaux PNJ cohérents avec le lore et l'univers", "Suivi des PNJ impliqués dans plusieurs fils narratifs simultanément"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "5h / semaine minimum" },
  '8': { tasks: ["Création et organisation des salons RP selon la géographie des territoires", "Modélisation des événements géographiques (incendies, inondations, nouveaux lieux)", "Signalement et gestion des dangers locaux (prédateurs, météo)"],
         anciennete: "1 à 2 mois sur le serveur", dispo: "4h / semaine minimum",
         note: "Une bonne maîtrise de la gestion des salons Discord est nécessaire." },
};

let staffPostes = [], hrPostes = [], currentView = 'staff';

async function loadPostes() {
  if (!sb) { document.getElementById('view').innerHTML = '<div class="notice">La base de données n\'est pas encore configurée (<code>js/config.js</code>).</div>'; return; }
  const [s, h] = await Promise.all([
    sb.from(T.postesStaff).select('*').order('id'),
    sb.from(T.postesHr).select('*').order('id'),
  ]);
  if (s.error || h.error) { document.getElementById('view').innerHTML = '<div class="notice">Impossible de charger les postes. Réessaie dans un instant.</div>'; return; }
  staffPostes = s.data; hrPostes = h.data;
  render();
}

function render() {
  const el = document.getElementById('view');
  el.innerHTML = currentView === 'staff' ? renderStaff() : renderHr();
  initReveal(el);
}

function statsBar(items) {
  return `<div class="stats">${items.map(([n, l]) => `<div class="stat reveal"><b>${n}</b><span>${l}</span></div>`).join('')}</div>`;
}

function renderStaff() {
  const ouverts = staffPostes.filter(p => p.statut === 'ouvert');
  const places = ouverts.reduce((a, p) => a + (p.places_dispo || 0), 0);
  let html = statsBar([
    [POLES.length, 'Pôles'], [ouverts.length, 'Postes ouverts'], [places, 'Places disponibles'],
    [staffPostes.filter(p => p.statut === 'complet').length, 'Complets'],
  ]);
  for (const pole of POLES) {
    const list = staffPostes.filter(p => p.pole === pole.id);
    html += `<section data-pole="${pole.id}">
      <div class="section-head reveal"><div class="pole-ico"><img src="img/pole-${pole.id}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'ti ${pole.icon}'}))"></div>
      <div><h2>${pole.nom}</h2><p>${pole.description}</p></div></div>
      <div class="grid">${list.map(staffCard).join('')}</div></section>`;
  }
  return html;
}

function staffCard(p) {
  const open = p.statut === 'ouvert', full = p.statut === 'complet';
  return `<article class="card reveal ${open ? '' : 'dim'}" data-pole="${p.pole}">
    <div><span class="badge ${p.statut}">${STATUT_LABELS[p.statut]}</span></div>
    <h3>${escHtml(p.nom)}</h3>
    <div class="meta">${open ? `${p.places_dispo}/${p.places_total} place${p.places_total > 1 ? 's' : ''} · ${formatDuree(p.ouvert_le)}` : `${p.places_total} place${p.places_total > 1 ? 's' : ''}`}</div>
    <div class="actions">
      ${open ? `<a class="btn sm" href="candidature.html?role=${p.id}">Candidater</a>` : ''}
      ${full ? `<button class="btn sm ghost" onclick="openWaitlist('staff',${p.id})">Liste d'attente</button>` : ''}
      <button class="btn sm ghost" onclick="openRole(${p.id})">En savoir plus</button>
    </div></article>`;
}

function renderHr() {
  const ouverts = hrPostes.filter(p => p.statut === 'ouvert').length;
  let html = statsBar([[CLANS.length, 'Clans'], [ouverts, 'Postes ouverts'], [hrPostes.length - ouverts, 'Occupés'], [hrPostes.length, 'Rangs au total']]);
  for (const clan of CLANS) {
    const list = hrPostes.filter(p => p.clan === clan.id);
    const o = list.filter(p => p.statut === 'ouvert').length;
    html += `<section data-clan="${clan.id}">
      <div class="section-head reveal"><div><h2>${clan.nom}</h2></div>
      <span class="badge ${o ? 'ouvert' : 'indispo'}">${o ? `${o} ouvert${o > 1 ? 's' : ''}` : 'Tous occupés'}</span></div>
      <div class="grid">${list.map(hrCard).join('')}</div></section>`;
  }
  return html;
}

function hrCard(p) {
  const open = p.statut === 'ouvert';
  return `<article class="card reveal ${open ? '' : 'dim'}" data-clan="${p.clan}">
    <div><span class="badge ${p.statut}">${STATUT_LABELS[p.statut]}</span></div>
    <h3>${escHtml(p.rang)}</h3>
    <div class="meta">${p.titulaire ? `Titulaire : <b>${escHtml(p.titulaire)}</b>` : (open ? 'Poste vacant' : 'Aucun·e titulaire')}</div>
    ${p.note ? `<div class="meta"><i class="ti ti-info-circle"></i> ${escHtml(p.note)}</div>` : ''}
    ${open ? `<div class="meta">${formatDuree(p.ouvert_le)}</div>` : ''}
    <div class="actions">
      ${open ? `<a class="btn sm" href="candidature.html?tab=hr&hr=${p.id}">Candidater</a>`
             : `<button class="btn sm ghost" onclick="openWaitlist('hr',${p.id})">Liste d'attente</button>`}
    </div></article>`;
}

function openRole(id) {
  const p = staffPostes.find(x => x.id === id), d = ROLE_DETAILS[String(id)] || { tasks: [] };
  const pole = POLES.find(x => x.id === p.pole);
  const m = openModal(`
    <div class="faint">${pole.nom}</div>
    <h2>${escHtml(p.nom)}</h2>
    <p class="muted">${pole.description_long}</p>
    <h3>Missions</h3><ul>${d.tasks.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
    <h3>Prérequis</h3><ul><li>Ancienneté : ${escHtml(d.anciennete || '—')}</li><li>Disponibilités : ${escHtml(d.dispo || '—')}</li></ul>
    ${d.note ? `<div class="notice"><i class="ti ti-alert-circle"></i> ${escHtml(d.note)}</div>` : ''}
    <div class="modal-actions"><button class="btn ghost" data-close>Fermer</button>
    ${p.statut === 'ouvert' ? `<a class="btn" href="candidature.html?role=${p.id}">Candidater pour ce rôle →</a>` : ''}</div>`);
}

function openWaitlist(kind, id) {
  if (!sb) return showDbError();
  const p = (kind === 'staff' ? staffPostes : hrPostes).find(x => x.id === id);
  const nom = kind === 'staff' ? p.nom : `${p.rang} — ${CLAN_LABELS[p.clan]}`;
  const m = openModal(`
    <h2>Liste d'attente</h2><p class="muted">${escHtml(nom)}</p>
    <div class="field"><label for="wl-pseudo">Pseudo Discord</label><input id="wl-pseudo" type="text" maxlength="40" autocomplete="off">
    <div class="hint" id="wl-hint">Tu seras mentionné·e sur Discord quand le poste ouvrira.</div></div>
    <div class="modal-actions"><button class="btn ghost" data-close>Annuler</button><button class="btn" id="wl-go">M'inscrire</button></div>`);
  const inp = m.el.querySelector('#wl-pseudo'), hint = m.el.querySelector('#wl-hint');
  inp.addEventListener('blur', async () => {
    const v = inp.value.trim(); if (!v) return;
    const { data } = await sb.rpc('cand_discord_connu', { p_pseudo: v });
    if (data === true) hint.textContent = 'Ton identifiant Discord est déjà connu du staff : rien d\'autre à fournir.';
  });
  m.el.querySelector('#wl-go').addEventListener('click', async e => {
    const pseudo = inp.value.trim();
    if (pseudo.length < 2) { showToast('Indique ton pseudo Discord.', 'error'); return; }
    setLoading(e.currentTarget, true, 'Envoi…');
    const { error } = await sb.from(T.attente).insert({ poste_id: id, poste_type: kind, pseudo_discord: pseudo });
    setLoading(e.currentTarget, false);
    if (error) { showToast('Inscription impossible, réessaie.', 'error'); return; }
    showToast('Tu es sur la liste d\'attente !', 'success'); m.close();
  });
  inp.focus();
}

document.querySelectorAll('#view-toggle button').forEach(b => b.addEventListener('click', () => {
  currentView = b.dataset.view;
  document.querySelectorAll('#view-toggle button').forEach(x => x.classList.toggle('active', x === b));
  render();
}));
loadPostes();
