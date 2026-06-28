// =========================================================
// admin.js — Panel d'administration
// =========================================================

let allCandidatures = [];
let staffPostes     = [];
let hrPostes        = [];

// --- Init ---
(async function init() {
  // Vérifier session existante
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showPanel(session.user.email);
    loadAll();
  }

  // Enter sur les champs de login
  ['admin-email', 'admin-pw'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') loginAdmin();
    });
  });

  // Fermer modal detail en cliquant l'overlay
  document.getElementById('modal-detail').addEventListener('click', function(e) {
    if (e.target === this) closeDetailModal();
  });
})();

// -----------------------------------------------
// Authentification
// -----------------------------------------------

async function loginAdmin() {
  const email = document.getElementById('admin-email').value.trim();
  const pw    = document.getElementById('admin-pw').value;

  if (!email || !pw) { showToast('Remplis les deux champs.', 'error'); return; }

  const btn = document.querySelector('#admin-gate .btn-primary');
  setLoading(btn, true, 'Connexion…');

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
  setLoading(btn, false);

  if (error) {
    showToast('Identifiants incorrects.', 'error');
    return;
  }
  showPanel(data.user.email);
  loadAll();
}

async function logoutAdmin() {
  await sb.auth.signOut();
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-gate').classList.remove('hidden');
  document.getElementById('admin-email').value = '';
  document.getElementById('admin-pw').value    = '';
}

function showPanel(email) {
  document.getElementById('admin-gate').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  document.getElementById('admin-user-info').textContent = `Connecté·e en tant que ${email}`;
}

// -----------------------------------------------
// Chargement global
// -----------------------------------------------

async function loadAll() {
  await Promise.all([loadStaff(), loadHR(), loadCandidatures()]);
}

// -----------------------------------------------
// Postes Staff
// -----------------------------------------------

async function loadStaff() {
  const { data, error } = await sb.from('postes_staff').select('*').order('id');
  if (error) { showToast('Erreur chargement postes staff.', 'error'); return; }
  staffPostes = data;
  renderStaffTable(data);
}

function renderStaffTable(postes) {
  const tbody = document.getElementById('admin-staff-tbody');
  if (!postes.length) { tbody.innerHTML = '<tr><td colspan="5" class="td-muted">Aucun poste.</td></tr>'; return; }

  tbody.innerHTML = postes.map(p => {
    const pole = POLES.find(x => x.id === p.pole);
    return `
      <tr id="staff-row-${p.id}">
        <td style="font-weight:500;">${escHtml(p.nom)}</td>
        <td class="td-muted">${pole ? pole.nom : p.pole}</td>
        <td>
          <input type="number" min="0" max="20" value="${p.places_dispo}"
            class="admin-input-inline" style="width:50px;"
            id="staff-places-${p.id}">
          <span class="td-muted"> / </span>
          <input type="number" min="0" max="20" value="${p.places_total}"
            class="admin-input-inline" style="width:50px;"
            id="staff-total-${p.id}">
        </td>
        <td>
          <select class="admin-select" id="staff-statut-${p.id}">
            <option value="ouvert"  ${p.statut === 'ouvert'  ? 'selected' : ''}>Ouvert</option>
            <option value="complet" ${p.statut === 'complet' ? 'selected' : ''}>Complet</option>
          </select>
        </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="saveStaff(${p.id})">Enregistrer</button>
        </td>
      </tr>`;
  }).join('');
}

async function saveStaff(id) {
  const oldPoste = staffPostes.find(p => p.id === id);
  const statut   = document.getElementById(`staff-statut-${id}`).value;
  const places_dispo = parseInt(document.getElementById(`staff-places-${id}`).value) || 0;
  const places_total = parseInt(document.getElementById(`staff-total-${id}`).value) || 1;

  const btn = document.querySelector(`#staff-row-${id} .btn-primary`);
  setLoading(btn, true, '…');

  const { error } = await sb.from('postes_staff')
    .update({ statut, places_dispo, places_total })
    .eq('id', id);

  if (error) { setLoading(btn, false); showToast('Erreur lors de la sauvegarde.', 'error'); return; }

  // Si le poste passe à "ouvert", notifier la liste d'attente
  if (oldPoste && oldPoste.statut !== 'ouvert' && statut === 'ouvert') {
    await notifyWaitlist(id, 'staff', oldPoste.nom);
  }

  // Mettre à jour les données locales
  const idx = staffPostes.findIndex(p => p.id === id);
  if (idx !== -1) staffPostes[idx] = { ...staffPostes[idx], statut, places_dispo, places_total };

  setLoading(btn, false);
  showToast('Poste Staff mis à jour.', 'success');
}

// -----------------------------------------------
// Hauts Rangs
// -----------------------------------------------

async function loadHR() {
  const { data, error } = await sb.from('postes_hr').select('*').order('id');
  if (error) { showToast('Erreur chargement HR.', 'error'); return; }
  hrPostes = data;
  renderHRTable(data);
}

function renderHRTable(postes) {
  const tbody = document.getElementById('admin-hr-tbody');
  if (!postes.length) { tbody.innerHTML = '<tr><td colspan="5" class="td-muted">Aucun rang.</td></tr>'; return; }

  tbody.innerHTML = postes.map(r => {
    const clan = CLANS.find(c => c.id === r.clan);
    return `
      <tr id="hr-row-${r.id}">
        <td style="font-weight:500;">${escHtml(r.rang)}</td>
        <td class="td-muted">${clan ? clan.nom : r.clan}</td>
        <td>
          <input type="text" class="admin-input-inline" style="width:180px;"
            id="hr-titu-${r.id}"
            value="${escHtml(r.titulaire || '')}"
            placeholder="— Aucun titulaire —">
        </td>
        <td>
          <select class="admin-select" id="hr-statut-${r.id}">
            <option value="ouvert"  ${r.statut === 'ouvert'  ? 'selected' : ''}>Ouvert</option>
            <option value="indispo" ${r.statut === 'indispo' ? 'selected' : ''}>Non disponible</option>
          </select>
        </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="saveHR(${r.id})">Enregistrer</button>
        </td>
      </tr>`;
  }).join('');
}

async function saveHR(id) {
  const oldRang  = hrPostes.find(r => r.id === id);
  const statut   = document.getElementById(`hr-statut-${id}`).value;
  const titulaire = document.getElementById(`hr-titu-${id}`).value.trim() || null;

  const btn = document.querySelector(`#hr-row-${id} .btn-primary`);
  setLoading(btn, true, '…');

  const { error } = await sb.from('postes_hr')
    .update({ statut, titulaire })
    .eq('id', id);

  if (error) { setLoading(btn, false); showToast('Erreur lors de la sauvegarde.', 'error'); return; }

  // Notification liste d'attente si passage à ouvert
  if (oldRang && oldRang.statut !== 'ouvert' && statut === 'ouvert') {
    await notifyWaitlist(id, 'hr', oldRang.rang);
  }

  const idx = hrPostes.findIndex(r => r.id === id);
  if (idx !== -1) hrPostes[idx] = { ...hrPostes[idx], statut, titulaire };

  setLoading(btn, false);
  showToast('Rang HR mis à jour.', 'success');
}

// -----------------------------------------------
// Candidatures
// -----------------------------------------------

async function loadCandidatures() {
  const { data, error } = await sb.from('candidatures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { showToast('Erreur chargement candidatures.', 'error'); return; }
  allCandidatures = data;
  filterCandidatures();
}

function filterCandidatures() {
  const typeF   = document.getElementById('filter-cand-type').value;
  const statutF = document.getElementById('filter-cand-statut').value;
  const filtered = allCandidatures.filter(c =>
    (!typeF   || c.type   === typeF)   &&
    (!statutF || c.statut === statutF)
  );
  renderCandidaturesTable(filtered);
}

function renderCandidaturesTable(cands) {
  const tbody = document.getElementById('admin-cand-tbody');
  if (!cands.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="td-muted">Aucune candidature pour ces filtres.</td></tr>';
    return;
  }

  tbody.innerHTML = cands.map(c => {
    const posteNom = getPosteNom(c);
    return `
      <tr id="cand-row-${c.id}">
        <td class="td-mono">${escHtml(c.code_suivi)}</td>
        <td>${escHtml(c.pseudo_discord)}</td>
        <td><span class="badge ${c.type === 'hr' ? 'examen' : 'done'}" style="font-size:9px;margin:0;">${c.type === 'hr' ? 'HR' : 'Staff'}</span></td>
        <td class="td-muted" style="font-size:12px;">${escHtml(posteNom)}</td>
        <td class="td-muted" style="font-size:11px;">${formatDate(c.created_at)}</td>
        <td>
          <select class="admin-select" id="cand-statut-${c.id}" onchange="saveCandidatureStatut(${c.id})">
            <option value="recue"    ${c.statut === 'recue'    ? 'selected' : ''}>Reçue</option>
            <option value="examen"   ${c.statut === 'examen'   ? 'selected' : ''}>En examen</option>
            <option value="acceptee" ${c.statut === 'acceptee' ? 'selected' : ''}>Acceptée</option>
            <option value="refusee"  ${c.statut === 'refusee'  ? 'selected' : ''}>Refusée</option>
          </select>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="showDetail(${c.id})">Lire →</button>
        </td>
      </tr>`;
  }).join('');
}

function getPosteNom(cand) {
  if (cand.type === 'staff') {
    const p = staffPostes.find(x => x.id === cand.poste_id);
    if (!p) return `Poste #${cand.poste_id}`;
    const pole = POLES.find(x => x.id === p.pole);
    return `${p.nom}${pole ? ' — ' + pole.nom : ''}`;
  } else {
    const r = hrPostes.find(x => x.id === cand.poste_id);
    if (!r) return `Rang #${cand.poste_id}`;
    const clan = CLANS.find(c => c.id === r.clan);
    return `${r.rang}${clan ? ' — ' + clan.nom : ''}`;
  }
}

async function saveCandidatureStatut(id) {
  const newStatut = document.getElementById(`cand-statut-${id}`).value;
  const { error } = await sb.from('candidatures').update({ statut: newStatut }).eq('id', id);
  if (error) { showToast('Erreur mise à jour statut.', 'error'); return; }
  const idx = allCandidatures.findIndex(c => c.id === id);
  if (idx !== -1) allCandidatures[idx].statut = newStatut;
  showToast(`Statut mis à jour : ${STATUT_LABELS[newStatut]}`, 'success');
}

// -----------------------------------------------
// Détail candidature (modale)
// -----------------------------------------------

function showDetail(id) {
  const cand = allCandidatures.find(c => c.id === id);
  if (!cand) return;

  const posteNom = getPosteNom(cand);
  document.getElementById('detail-title').textContent = `${posteNom}`;

  const d = cand.donnees || {};
  let rows = [];

  if (cand.type === 'staff') {
    rows = [
      ['Pseudo Discord',    d.pseudo_discord],
      ['Ancienneté serveur', d.anciennete_serveur],
      ['Disponibilités',    d.disponibilites],
      ['Expérience staff',  d.experience_staff || 'Non renseigné'],
    ];
  } else {
    rows = [
      ['Pseudo Discord',    d.pseudo_discord],
      ['Personnage (OC)',   d.nom_oc],
      ['Rang actuel',       d.rang_actuel],
      ['Ancienneté OC',     d.anciennete_oc],
    ];
  }

  const longFields = cand.type === 'staff'
    ? [['Motivation', d.motivation]]
    : [['Motivation OOC', d.motivation_ooc], ['Motivation IC', d.motivation_ic], ['Extrait RP', d.extrait_rp]];

  document.getElementById('detail-content').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:1.25rem;">
      ${rows.map(([k, v]) => `
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:.75rem;">
          <div style="font-size:10px;color:var(--text-3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;">${k}</div>
          <div style="font-size:13px;color:var(--text-1);">${escHtml(v || '—')}</div>
        </div>`).join('')}
    </div>
    ${longFields.map(([k, v]) => `
      <div style="margin-bottom:1rem;">
        <div style="font-size:11px;color:var(--text-3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">${k}</div>
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:.875rem;font-size:13px;color:var(--text-2);line-height:1.7;white-space:pre-wrap;">${escHtml(v || '—')}</div>
      </div>`).join('')}
  `;

  document.getElementById('modal-detail').classList.add('open');
}

function closeDetailModal() {
  document.getElementById('modal-detail').classList.remove('open');
}

// -----------------------------------------------
// Notification liste d'attente → Discord
// -----------------------------------------------

async function notifyWaitlist(posteId, posteType, posteNom) {
  const { data: entries } = await sb
    .from('liste_attente')
    .select('id, pseudo_discord')
    .eq('poste_id', posteId)
    .eq('poste_type', posteType)
    .eq('notifie', false);

  if (!entries || !entries.length) return;

  const pseudos = entries.map(e => e.pseudo_discord);
  const embed   = buildWaitlistNotifEmbed(posteNom, pseudos);
  await sendDiscordWebhook(CONFIG.discord.webhookAdmin, { embeds: [embed] });

  // Marquer comme notifiés
  await sb.from('liste_attente')
    .update({ notifie: true })
    .in('id', entries.map(e => e.id));

  showToast(`${pseudos.length} personne(s) à notifier sur Discord.`, 'info');
}