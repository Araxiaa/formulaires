// =========================================================
// candidature.js — Page de candidature
// =========================================================

let staffPostes = [];
let hrPostes    = [];

// --- Init ---
(async function init() {
  setActiveNav('candidature');
  await Promise.all([loadStaffPostes(), loadHRPostes()]);
  prefillFromUrl();
})();

// -----------------------------------------------
// Chargement Supabase
// -----------------------------------------------

async function loadStaffPostes() {
  const { data } = await sb.from('postes_staff').select('*').eq('statut', 'ouvert').order('id');
  staffPostes = data || [];
}

async function loadHRPostes() {
  const { data } = await sb.from('postes_hr').select('*').eq('statut', 'ouvert').order('id');
  hrPostes = data || [];
  populateHRSelect();
}

function populateHRSelect() {
  const sel = document.getElementById('hr-poste');
  sel.innerHTML = '<option value="">— Sélectionner un rang —</option>';
  hrPostes.forEach(r => {
    const clan = CLANS.find(c => c.id === r.clan);
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.rang} — ${clan ? clan.nom : r.clan}`;
    sel.appendChild(opt);
  });
  if (!hrPostes.length) {
    sel.innerHTML = '<option value="">Aucun rang disponible pour le moment</option>';
  }
}

// -----------------------------------------------
// Sélection du pôle → filtre les rôles
// -----------------------------------------------

function updateRoleOptions() {
  const poleId = document.getElementById('s-pole').value;
  const sel    = document.getElementById('s-role');
  sel.innerHTML = '';

  if (!poleId) {
    sel.innerHTML = '<option value="">— Sélectionner d\'abord un pôle —</option>';
    return;
  }

  const disponibles = staffPostes.filter(p => p.pole === poleId);
  if (!disponibles.length) {
    sel.innerHTML = '<option value="">Aucun poste ouvert dans ce pôle</option>';
    return;
  }
  disponibles.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.nom} (${p.places_dispo} pl.)`;
    sel.appendChild(opt);
  });
}

// -----------------------------------------------
// Pré-remplissage depuis les paramètres URL
// -----------------------------------------------

function prefillFromUrl() {
  const { type, id } = getUrlParams();
  if (!type || !id) return;

  if (type === 'staff') {
    switchTab('staff', document.querySelector('[data-tab="staff"]'));
    // Trouver le poste
    const poste = staffPostes.find(p => p.id == id);
    if (!poste) return;
    // Sélectionner le pôle
    document.getElementById('s-pole').value = poste.pole;
    updateRoleOptions();
    // Sélectionner le rôle
    setTimeout(() => {
      document.getElementById('s-role').value = poste.id;
    }, 10);
    // Banner
    const pole = POLES.find(p => p.id === poste.pole);
    showBanner('staff', `${poste.nom} — ${pole ? pole.nom : ''}`);

  } else if (type === 'hr') {
    switchTab('hr', document.querySelector('[data-tab="hr"]'));
    // Sélectionner le rang
    const rang = hrPostes.find(r => r.id == id);
    if (!rang) return;
    setTimeout(() => {
      document.getElementById('hr-poste').value = rang.id;
    }, 10);
    const clan = CLANS.find(c => c.id === rang.clan);
    showBanner('hr', `${rang.rang} — ${clan ? clan.nom : ''}`);
  }
}

function showBanner(type, label) {
  const banner = document.getElementById(`banner-${type}`);
  if (!banner) return;
  banner.textContent = `Poste sélectionné : ${label}`;
  banner.style.display = 'block';
}

// -----------------------------------------------
// Switcher d'onglets
// -----------------------------------------------

function switchTab(tab, btn) {
  document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.form-view').forEach(v => v.classList.remove('active'));
  document.getElementById('fv-' + tab).classList.add('active');
}

// -----------------------------------------------
// Soumission — Staff
// -----------------------------------------------

async function submitStaff() {
  const poleId  = document.getElementById('s-pole').value;
  const roleId  = document.getElementById('s-role').value;
  const pseudo  = document.getElementById('s-pseudo').value.trim();
  const ancien  = document.getElementById('s-anciennete').value.trim();
  const motiv   = document.getElementById('s-motivation').value.trim();
  const dispo   = document.getElementById('s-dispo').value.trim();
  const xp      = document.getElementById('s-experience').value.trim();

  const valid = validateFields([
    { el: document.getElementById('s-pole'),       min: 1 },
    { el: document.getElementById('s-role'),       min: 1 },
    { el: document.getElementById('s-pseudo'),     min: 2 },
    { el: document.getElementById('s-anciennete'), min: 1 },
    { el: document.getElementById('s-motivation'), min: 50 },
    { el: document.getElementById('s-dispo'),      min: 3 },
  ]);
  if (!valid) { showToast('Merci de remplir tous les champs obligatoires.', 'error'); return; }

  const btn  = document.querySelector('#fv-staff .btn-primary');
  const code = generateCode();

  setLoading(btn, true, 'Envoi en cours…');

  const donnees = { pole: poleId, pseudo_discord: pseudo, anciennete_serveur: ancien,
                    motivation: motiv, disponibilites: dispo, experience_staff: xp };

  const { error } = await sb.from('candidatures').insert({
    code_suivi:     code,
    type:           'staff',
    poste_id:       parseInt(roleId),
    pseudo_discord: pseudo,
    statut:         'recue',
    donnees,
  });

  if (error) {
    setLoading(btn, false);
    showToast('Erreur lors de l\'envoi. Réessaie.', 'error');
    return;
  }

  // Discord webhook
  const poste = staffPostes.find(p => p.id == roleId);
  const pole  = POLES.find(p => p.id === poleId);
  const posteNom   = poste ? poste.nom : roleId;
  const contexte   = pole  ? pole.nom  : '';
  const embed = buildCandidatureEmbed({ type: 'staff', code_suivi: code, pseudo_discord: pseudo, donnees }, posteNom, contexte);
  await sendDiscordWebhook(CONFIG.discord.webhookStaff, { embeds: [embed] });

  setLoading(btn, false);
  showSuccess(code);
}

// -----------------------------------------------
// Soumission — Hauts Rangs
// -----------------------------------------------

async function submitHR() {
  const posteId    = document.getElementById('hr-poste').value;
  const pseudo     = document.getElementById('hr-pseudo').value.trim();
  const oc         = document.getElementById('hr-oc').value.trim();
  const rangActuel = document.getElementById('hr-rang-actuel').value.trim();
  const ancien     = document.getElementById('hr-anciennete').value.trim();
  const motiOoc   = document.getElementById('hr-moti-ooc').value.trim();
  const motiIc    = document.getElementById('hr-moti-ic').value.trim();
  const extrait    = document.getElementById('hr-extrait').value.trim();

  const valid = validateFields([
    { el: document.getElementById('hr-poste'),       min: 1 },
    { el: document.getElementById('hr-pseudo'),      min: 2 },
    { el: document.getElementById('hr-oc'),          min: 2 },
    { el: document.getElementById('hr-rang-actuel'), min: 2 },
    { el: document.getElementById('hr-anciennete'),  min: 1 },
    { el: document.getElementById('hr-moti-ooc'),    min: 50 },
    { el: document.getElementById('hr-moti-ic'),     min: 20 },
    { el: document.getElementById('hr-extrait'),     min: 100 },
  ]);
  if (!valid) { showToast('Merci de remplir tous les champs obligatoires.', 'error'); return; }

  const btn  = document.querySelector('#fv-hr .btn-primary');
  const code = generateCode();

  setLoading(btn, true, 'Envoi en cours…');

  const donnees = { pseudo_discord: pseudo, nom_oc: oc, rang_actuel: rangActuel,
                    anciennete_oc: ancien, motivation_ooc: motiOoc,
                    motivation_ic: motiIc, extrait_rp: extrait };

  const { error } = await sb.from('candidatures').insert({
    code_suivi:     code,
    type:           'hr',
    poste_id:       parseInt(posteId),
    pseudo_discord: pseudo,
    statut:         'recue',
    donnees,
  });

  if (error) {
    setLoading(btn, false);
    showToast('Erreur lors de l\'envoi. Réessaie.', 'error');
    return;
  }

  // Discord webhook
  const rang = hrPostes.find(r => r.id == posteId);
  const clan = rang ? CLANS.find(c => c.id === rang.clan) : null;
  const posteNom = rang ? rang.rang : posteId;
  const contexte = clan ? clan.nom  : '';
  const embed = buildCandidatureEmbed({ type: 'hr', code_suivi: code, pseudo_discord: pseudo, donnees }, posteNom, contexte);
  await sendDiscordWebhook(CONFIG.discord.webhookHR, { embeds: [embed] });

  setLoading(btn, false);
  showSuccess(code);
}

// -----------------------------------------------
// Confirmation de succès
// -----------------------------------------------

function showSuccess(code) {
  const main = document.querySelector('.main');
  main.innerHTML = `
    <div style="max-width:480px; margin:3rem auto; text-align:center;">
      <div style="font-size:40px; margin-bottom:1.5rem;">✓</div>
      <h2 style="font-family:'Cinzel',serif; font-size:20px; color:var(--text-1); margin-bottom:10px;">Candidature envoyée !</h2>
      <p style="color:var(--text-2); font-size:14px; margin-bottom:1.5rem; line-height:1.7;">
        Ta candidature a bien été reçue. L'équipe staff la lira dès que possible.
      </p>
      <div style="background:var(--bg-card); border:1px solid var(--border-s); border-radius:var(--r-card); padding:1.25rem; margin-bottom:1.75rem;">
        <div style="font-size:11px; color:var(--text-3); margin-bottom:6px; letter-spacing:.08em; text-transform:uppercase;">Ton code de suivi</div>
        <div style="font-family:'Courier New',monospace; font-size:22px; font-weight:600; color:var(--text-1); letter-spacing:.1em;">${code}</div>
        <div style="font-size:12px; color:var(--text-3); margin-top:6px;">Conserve-le précieusement — il te permettra de suivre ta candidature.</div>
      </div>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        <a href="./suivi.html?code=${code}" class="btn btn-primary">Suivre ma candidature</a>
        <a href="./index.html" class="btn btn-ghost">Retour aux postes</a>
      </div>
    </div>
  `;
}