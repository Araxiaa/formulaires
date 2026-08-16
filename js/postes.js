// =========================================================
// DONNÉES DÉTAILLÉES DES RÔLES — pour la popup
// =========================================================
const ROLE_DETAILS = {
  '1': {
    tasks: [
      "Accueil des nouveaux membres et réponse à leurs premières questions",
      "Prise en charge et suivi des tickets ouverts par les membres",
      "Accompagnement lors de la création et validation des premiers personnages",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "5h / semaine minimum",
  },
  '2': {
    tasks: [
      "Lecture et correction des fiches de personnage soumises",
      "Vérification de la cohérence avec les règles du serveur (génétique, noms, rangs)",
      "Retours bienveillants et guidage des membres lors des corrections",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "5h / semaine minimum",
  },
  '3': {
    tasks: [
      "Traitement des demandes de génétique (pelages, yeux, traits hérités)",
      "Gestion et mise à jour du registre génétique du serveur",
      "Accompagnement des membres sur les questions génétiques complexes",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "4h / semaine minimum",
    note: "Une solide maîtrise de la génétique féline et du Codex du serveur est indispensable.",
  },
  '4': {
    tasks: [
      "Conception et animation d'événements Hors-RP (jeux, concours, activités)",
      "Organisation des activités récurrentes (Membre du Mois, OC du Mois…)",
      "Animation de la vie communautaire en dehors du roleplay",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "5h / semaine minimum",
  },
  '5': {
    tasks: [
      "Réponse aux tickets RP pour aider les membres à développer l'histoire de leur OC",
      "Co-construction d'intrigues personnalisées avec les membres en demande",
      "Suivi et cohérence des arcs narratifs en cours",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "5h / semaine minimum",
  },
  '6': {
    tasks: [
      "Rédaction des résumés d'événements et des actualités du serveur",
      "Écriture du lore officiel, des descriptions de lieux et des PNJ notables",
      "Production des textes narratifs pour les grands événements collectifs",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "5h / semaine minimum",
    note: "Un extrait de rédaction narrative est requis lors de la candidature.",
  },
  '7': {
    tasks: [
      "Gestion et incarnation des PNJ lors des interactions avec les membres",
      "Création de nouveaux PNJ cohérents avec le lore et l'univers",
      "Suivi des PNJ impliqués dans plusieurs fils narratifs simultanément",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "5h / semaine minimum",
  },
  '8': {
    tasks: [
      "Création et organisation des salons RP selon la géographie des territoires",
      "Modélisation des événements géographiques (incendies, inondations, nouveaux lieux)",
      "Signalement et gestion des dangers locaux (prédateurs, météo)",
    ],
    anciennete: "1 à 2 mois sur le serveur",
    dispo: "4h / semaine minimum",
    note: "Une bonne maîtrise de la gestion des salons Discord est nécessaire.",
  },
};

// =========================================================
// postes.js — Page d'accueil (index.html)
// =========================================================

let attentePosteId   = null;
let attentePosteType = null;

// --- Init ---
(async function init() {
  renderNav('postes');

  // Bouton Discord depuis config
  const discordBtn = document.getElementById('discord-btn');
  if (discordBtn && typeof CONFIG !== 'undefined') discordBtn.href = CONFIG.site.discordInvite || '#';
  const heroDesc = document.getElementById('hero-desc');
  if (heroDesc && typeof CONFIG !== 'undefined' && CONFIG.site.description) {
    heroDesc.textContent = CONFIG.site.description + ' Découvre les postes disponibles ci-dessous.';
  }

  await Promise.all([loadStaffPostes(), loadHRPostes()]);
})();

// -----------------------------------------------
// Chargement Supabase
// -----------------------------------------------

async function loadStaffPostes() {
  const { data, error } = await sb.from('postes_staff').select('*').order('id');
  if (error) { renderError('staff-sections'); return; }
  renderStaffSections(data);
  updateStaffStats(data);
  setTimeout(initScrollAnimations, 50);
}

async function loadHRPostes() {
  const { data, error } = await sb.from('postes_hr').select('*').order('id');
  if (error) { renderError('hr-sections'); return; }
  renderHRSections(data);
  updateHRStats(data);
}

// -----------------------------------------------
// Rendu — Staff
// -----------------------------------------------

function renderStaffSections(postes) {
  _currentStaffPostes = postes;
  const container = document.getElementById('staff-sections');
  container.innerHTML = '';

  POLES.forEach(pole => {
    const rolesOfPole = postes.filter(p => p.pole === pole.id);
    if (!rolesOfPole.length) return;

    const section = document.createElement('div');
    section.className = 'pole-section';
    section.innerHTML = `
      <div class="pole-header">
        <div class="pole-icon ${pole.id}"><img src="./img/pole-${pole.id}.png" alt="${pole.nom}" style="width:22px;height:22px;object-fit:contain;"></div>
        <div>
          <div class="pole-nom">${pole.nom}</div>
          <div class="pole-desc">${pole.description}</div>
        </div>
      </div>
      <div class="staff-grid">
        ${rolesOfPole.map(p => renderStaffCard(p, pole.id)).join('')}
      </div>
    `;
    container.appendChild(section);
  });
}

function renderStaffCard(poste, poleId) {
  const canApply = poste.statut === 'ouvert';
  const canWait  = poste.statut === 'complet';
  const placesTxt = canApply
    ? `${poste.places_dispo} place${poste.places_dispo > 1 ? 's' : ''} disponible${poste.places_dispo > 1 ? 's' : ''} sur ${poste.places_total}`
    : poste.statut === 'complet' ? 'Toutes les places sont occupées' : 'Poste momentanément indisponible';
  const dureeTxt = canApply && poste.ouvert_le ? formatDuree(poste.ouvert_le) : null;

  return `
    <div class="post-card ${poleId}">
      <div class="card-context ${poleId}">${POLE_LABELS[poleId]}</div>
      <div class="card-nom">${escHtml(poste.nom)}</div>
      <div class="card-desc">${escHtml(poste.description)}</div>
      <span class="badge ${poste.statut}">
        ${STATUT_LABELS[poste.statut]}${canApply ? ' · ' + poste.places_dispo + ' pl.' : ''}
      </span>
      ${dureeTxt ? `<span class="duree-tag">${dureeTxt}</span>` : ''}
      <div class="card-actions">
        <a href="./candidature.html?type=staff&id=${poste.id}"
           class="btn btn-primary btn-sm ${canApply ? '' : 'btn-disabled'}"
           ${canApply ? '' : 'onclick="return false;" style="pointer-events:none;opacity:0.35;"'}>
          Candidater →
        </a>
        ${canWait ? `<button class="btn btn-ghost btn-sm" onclick="openAttente(${poste.id}, 'staff', '${escHtml(poste.nom)}')">Liste d'attente</button>` : ''}
        <button class="card-info-btn" onclick="openRolePopup(${poste.id}, '${poleId}', event)">
          <i class="ti ti-info-circle" aria-hidden="true"></i> En savoir plus
        </button>
      </div>
    </div>
  `;
}

function updateStaffStats(postes) {
  const ouv    = postes.filter(p => p.statut === 'ouvert').length;
  const places = postes.filter(p => p.statut === 'ouvert').reduce((a, p) => a + p.places_dispo, 0);
  const comp   = postes.filter(p => p.statut === 'complet').length;
  document.getElementById('sn-poles').textContent  = POLES.length;
  document.getElementById('sn-ouv').textContent    = ouv;
  document.getElementById('sn-places').textContent = places;
  document.getElementById('sn-comp').textContent   = comp;
}

// -----------------------------------------------
// Rendu — Hauts Rangs
// -----------------------------------------------

function renderHRSections(postes) {
  const container = document.getElementById('hr-sections');
  container.innerHTML = '';

  CLANS.forEach(clan => {
    const rolesOfClan = postes.filter(p => p.clan === clan.id);
    if (!rolesOfClan.length) return;

    const openCount = rolesOfClan.filter(r => r.statut === 'ouvert').length;
    const section = document.createElement('div');
    section.className = 'clan-section';
    section.innerHTML = `
      <div class="clan-header ${clan.id}">
        <span class="clan-nom">${clan.nom}</span>
        <span class="clan-open-badge ${openCount > 0 ? 'has' : 'none'}">
          ${openCount > 0 ? openCount + ' ouvert' + (openCount > 1 ? 's' : '') : 'Tous occupés'}
        </span>
      </div>
      <div class="hr-grid">
        ${rolesOfClan.map(r => renderHRCard(r, clan)).join('')}
      </div>
    `;
    container.appendChild(section);
  });
}

function renderHRCard(rang, clan) {
  const canApply = rang.statut === 'ouvert';
  const dureeHR  = canApply && rang.ouvert_le ? formatDuree(rang.ouvert_le) : null;
  return `
    <div class="post-card ${clan.id}">
      <div class="card-context ${clan.id}">${clan.nom}</div>
      <div class="card-nom">${escHtml(rang.rang)}</div>
      ${rang.titulaire ? `<div class="card-titu">↳ ${escHtml(rang.titulaire)}</div>` : ''}
      ${rang.note      ? `<div class="card-note">${escHtml(rang.note)}</div>` : ''}
      <span class="badge ${rang.statut}">${STATUT_LABELS[rang.statut]}</span>
      ${dureeHR ? `<span class="duree-tag">${dureeHR}</span>` : ''}
      <div class="card-actions">
        <a href="./candidature.html?type=hr&id=${rang.id}"
           class="btn btn-primary btn-sm ${canApply ? '' : ''}"
           ${canApply ? '' : 'onclick="return false;" style="pointer-events:none;opacity:0.35;"'}>
          ${canApply ? 'Candidater →' : 'Indisponible'}
        </a>
      </div>
    </div>
  `;
}

function updateHRStats(postes) {
  const ouv = postes.filter(r => r.statut === 'ouvert').length;
  const ind = postes.filter(r => r.statut === 'indispo').length;
  document.getElementById('hr-ouv').textContent   = ouv;
  document.getElementById('hr-ind').textContent   = ind;
  document.getElementById('hr-total').textContent = postes.length;
}

// -----------------------------------------------
// Switcher Staff / HR
// -----------------------------------------------

function switchType(type, btn) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.subview').forEach(v => v.classList.remove('active'));
  document.getElementById('sv-' + type).classList.add('active');
}

// -----------------------------------------------
// Liste d'attente
// -----------------------------------------------

function openAttente(posteId, posteType, nom) {
  attentePosteId   = posteId;
  attentePosteType = posteType;
  document.getElementById('attente-pseudo').value = '';
  document.getElementById('modal-attente-sub').textContent =
    `Inscris-toi pour être notifié·e sur Discord dès qu'une place se libère pour le poste : ${nom}.`;
  document.getElementById('modal-attente').classList.add('open');
  document.getElementById('attente-pseudo').focus();
}

function closeModal() {
  document.getElementById('modal-attente').classList.remove('open');
}

document.getElementById('modal-attente').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

async function submitAttente() {
  const pseudo = document.getElementById('attente-pseudo').value.trim();
  if (!pseudo) {
    document.getElementById('attente-pseudo').classList.add('field-error');
    return;
  }
  document.getElementById('attente-pseudo').classList.remove('field-error');

  const btn = document.querySelector('#modal-attente .btn-primary');
  setLoading(btn, true, 'Inscription…');

  const { error } = await sb.from('liste_attente').insert({
    poste_id:      attentePosteId,
    poste_type:    attentePosteType,
    pseudo_discord: pseudo,
  });

  setLoading(btn, false);
  closeModal();

  if (error) {
    showToast('Erreur lors de l\'inscription. Réessaie.', 'error');
  } else {
    showToast('Inscrit·e sur la liste d\'attente ! Tu seras contacté·e sur Discord.', 'success');
  }
}

// -----------------------------------------------
// Utilitaire — erreur chargement
// -----------------------------------------------

function renderError(containerId) {
  document.getElementById(containerId).innerHTML =
    '<div class="empty-state">Impossible de charger les postes. Vérifie ta connexion.</div>';
}

// =========================================================
// POPUP DÉTAIL D'UN RÔLE STAFF
// =========================================================

let _currentStaffPostes = []; // référence locale pour le popup

function openRolePopup(posteId, poleId, event) {
  if (event) event.stopPropagation();

  const poste  = _currentStaffPostes.find(p => p.id === posteId);
  const pole   = POLES.find(p => p.id === poleId);
  const detail = ROLE_DETAILS[String(posteId)];
  if (!poste || !pole) return;

  const poleColors = { guide:'var(--guide)', narration:'var(--narration)', batisseur:'var(--batisseur)' };
  const color = poleColors[poleId] || 'var(--accent)';

  document.getElementById('popup-header').innerHTML = `
    <div class="role-popup-pole" style="color:${color};">${pole.nom}</div>
    <div class="role-popup-title">${escHtml(poste.nom)}</div>
    <div class="role-popup-desc">${escHtml(poste.description)}</div>
  `;

  let content = '';
  if (detail?.tasks?.length) {
    content += `<div class="role-popup-tasks">
      <div class="role-popup-tasks-title">Missions & responsabilités</div>
      ${detail.tasks.map(t => `
        <div class="role-popup-task">
          <span class="role-popup-task-dot"></span>
          <span>${escHtml(t)}</span>
        </div>`).join('')}
    </div>`;
  }

  if (detail?.anciennete || detail?.dispo) {
    content += `<div class="role-popup-reqs">`;
    if (detail.anciennete) content += `
      <div class="role-popup-req">
        <i class="ti ti-calendar" aria-hidden="true"></i>
        <span>${escHtml(detail.anciennete)}</span>
      </div>`;
    if (detail.dispo) content += `
      <div class="role-popup-req">
        <i class="ti ti-clock" aria-hidden="true"></i>
        <span>${escHtml(detail.dispo)}</span>
      </div>`;
    content += `</div>`;
  }

  if (detail?.note) {
    content += `<div class="role-popup-note"><i class="ti ti-info-circle" aria-hidden="true"></i> ${escHtml(detail.note)}</div>`;
  }

  document.getElementById('popup-content').innerHTML = content;

  const applyBtn = document.getElementById('popup-apply-btn');
  if (poste.statut === 'ouvert') {
    applyBtn.href = `./candidature.html?type=staff&id=${posteId}`;
    applyBtn.style.display = '';
    applyBtn.textContent = 'Candidater pour ce rôle →';
  } else {
    applyBtn.style.display = 'none';
  }

  document.getElementById('modal-role-detail').classList.add('open');
}

function closeRolePopup() {
  document.getElementById('modal-role-detail').classList.remove('open');
}

// =========================================================
// ANIMATIONS AU DÉFILEMENT
// =========================================================

function initScrollAnimations() {
  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver((entries) => {
    let delay = 0;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        setTimeout(() => el.classList.add('anim-in'), delay);
        delay += 55;
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.post-card, .stat-card').forEach(el => {
    el.classList.add('anim-ready');
    observer.observe(el);
  });
}