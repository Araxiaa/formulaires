// =========================================================
// postes.js — Page d'accueil (index.html)
// =========================================================

let attentePosteId   = null;
let attentePosteType = null;

// --- Init ---
(async function init() {
  setActiveNav('postes');
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
  const container = document.getElementById('staff-sections');
  container.innerHTML = '';

  POLES.forEach(pole => {
    const rolesOfPole = postes.filter(p => p.pole === pole.id);
    if (!rolesOfPole.length) return;

    const section = document.createElement('div');
    section.className = 'pole-section';
    section.innerHTML = `
      <div class="pole-header">
        <div class="pole-icon ${pole.id}">◆</div>
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

  return `
    <div class="post-card ${poleId}">
      <div class="card-context ${poleId}">${POLE_LABELS[poleId]}</div>
      <div class="card-nom">${escHtml(poste.nom)}</div>
      <div class="card-desc">${escHtml(poste.description)}</div>
      <span class="badge ${poste.statut}">
        ${STATUT_LABELS[poste.statut]}${canApply ? ' · ' + poste.places_dispo + ' pl.' : ''}
      </span>
      <div class="card-actions">
        <a href="./candidature.html?type=staff&id=${poste.id}"
           class="btn btn-primary btn-sm ${canApply ? '' : 'btn-disabled'}"
           ${canApply ? '' : 'onclick="return false;" style="pointer-events:none;opacity:0.35;"'}>
          Candidater →
        </a>
        ${canWait ? `<button class="btn btn-ghost btn-sm" onclick="openAttente(${poste.id}, 'staff', '${escHtml(poste.nom)}')">Liste d'attente</button>` : ''}
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
  return `
    <div class="post-card ${clan.id}">
      <div class="card-context ${clan.id}">${clan.nom}</div>
      <div class="card-nom">${escHtml(rang.rang)}</div>
      ${rang.titulaire ? `<div class="card-titu">↳ ${escHtml(rang.titulaire)}</div>` : ''}
      ${rang.note      ? `<div class="card-note">${escHtml(rang.note)}</div>` : ''}
      <span class="badge ${rang.statut}">${STATUT_LABELS[rang.statut]}</span>
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