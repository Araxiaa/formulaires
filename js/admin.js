// =========================================================
// admin.js — Panel d'administration (Staff + HR + OC)
// =========================================================

let allCandidatures = [];
let staffPostes     = [];
let hrPostes        = [];

const TYPE_LABELS = {
  staff: 'Staff',
  hr:    'Hauts Rangs',
  oc3:   '3ème OC',
  oc4:   '4ème OC',
};

// --- Init ---
(async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showPanel(session.user.email);
    loadAll();
  }
  ['admin-email', 'admin-pw'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') loginAdmin();
    });
  });
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

  if (error) { showToast('Identifiants incorrects.', 'error'); return; }
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
  document.querySelector('.sidebar-link[onclick*="dashboard"]')?.classList.add('active');
}

// -----------------------------------------------
// Chargement global
// -----------------------------------------------

async function loadAll() {
  await Promise.all([loadStaff(), loadHR(), loadCandidatures(), loadAttente()]);
  loadStats();
  loadDashboard();
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
          <input type="number" min="0" max="20" value="${p.places_dispo}" class="admin-input-inline" style="width:50px;" id="staff-places-${p.id}">
          <span class="td-muted"> / </span>
          <input type="number" min="0" max="20" value="${p.places_total}" class="admin-input-inline" style="width:50px;" id="staff-total-${p.id}">
        </td>
        <td>
          <select class="admin-select" id="staff-statut-${p.id}">
            <option value="ouvert"  ${p.statut === 'ouvert'  ? 'selected' : ''}>Ouvert</option>
            <option value="complet" ${p.statut === 'complet' ? 'selected' : ''}>Complet</option>
          </select>
        </td>
        <td><button class="btn btn-primary btn-sm" onclick="saveStaff(${p.id})">Enregistrer</button></td>
      </tr>`;
  }).join('');
}

async function saveStaff(id) {
  const oldPoste     = staffPostes.find(p => p.id === id);
  const statut       = document.getElementById(`staff-statut-${id}`).value;
  const places_dispo = parseInt(document.getElementById(`staff-places-${id}`).value) || 0;
  const places_total = parseInt(document.getElementById(`staff-total-${id}`).value)  || 1;

  const btn = document.querySelector(`#staff-row-${id} .btn-primary`);
  setLoading(btn, true, '…');

  const { error } = await sb.from('postes_staff').update({ statut, places_dispo, places_total }).eq('id', id);
  if (error) { setLoading(btn, false); showToast('Erreur sauvegarde.', 'error'); return; }

  if (oldPoste && oldPoste.statut !== 'ouvert' && statut === 'ouvert') {
    await notifyWaitlist(id, 'staff', oldPoste.nom);
  }
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
            id="hr-titu-${r.id}" value="${escHtml(r.titulaire || '')}" placeholder="— Aucun titulaire —">
        </td>
        <td>
          <select class="admin-select" id="hr-statut-${r.id}">
            <option value="ouvert"  ${r.statut === 'ouvert'  ? 'selected' : ''}>Ouvert</option>
            <option value="indispo" ${r.statut === 'indispo' ? 'selected' : ''}>Non disponible</option>
          </select>
        </td>
        <td><button class="btn btn-primary btn-sm" onclick="saveHR(${r.id})">Enregistrer</button></td>
      </tr>`;
  }).join('');
}

async function saveHR(id) {
  const oldRang  = hrPostes.find(r => r.id === id);
  const statut   = document.getElementById(`hr-statut-${id}`).value;
  const titulaire = document.getElementById(`hr-titu-${id}`).value.trim() || null;

  const btn = document.querySelector(`#hr-row-${id} .btn-primary`);
  setLoading(btn, true, '…');

  const { error } = await sb.from('postes_hr').update({ statut, titulaire }).eq('id', id);
  if (error) { setLoading(btn, false); showToast('Erreur sauvegarde.', 'error'); return; }

  if (oldRang && oldRang.statut !== 'ouvert' && statut === 'ouvert') {
    await notifyWaitlist(id, 'hr', oldRang.rang);
  }
  const idx = hrPostes.findIndex(r => r.id === id);
  if (idx !== -1) hrPostes[idx] = { ...hrPostes[idx], statut, titulaire };
  setLoading(btn, false);
  showToast('Rang HR mis à jour.', 'success');
}

// -----------------------------------------------
// Candidatures (Staff + HR + OC3 + OC4)
// -----------------------------------------------

async function loadCandidatures() {
  const { data, error } = await sb.from('candidatures')
    .select('*').order('created_at', { ascending: false }).limit(150);
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
  document.getElementById('cand-count').textContent = `${cands.length} résultat${cands.length > 1 ? 's' : ''}`;
  tbody.innerHTML = cands.map(c => {
    const typeLabel = TYPE_LABELS[c.type] || c.type;
    const typeCls   = c.type === 'staff' ? 'ouvert' : c.type === 'hr' ? 'examen' : c.type === 'oc3' ? 'recue' : 'complet';
    return `
      <tr id="cand-row-${c.id}">
        <td class="td-mono">${escHtml(c.code_suivi)}</td>
        <td>${escHtml(c.pseudo_discord)}</td>
        <td><span class="badge ${typeCls}" style="font-size:9px;margin:0;">${typeLabel}</span></td>
        <td class="td-muted" style="font-size:12px;">${escHtml(getPosteNom(c))}</td>
        <td class="td-muted" style="font-size:11px;">${formatDate(c.created_at)}</td>
        <td>
          <div class="assign-wrap">
            <input type="text" class="admin-input-inline assign-input"
              id="assign-${c.id}"
              value="${escHtml(c.assigne_a || '')}"
              placeholder="—"
              onkeydown="if(event.key==='Enter') saveAssignment(${c.id})">
            <button class="btn btn-ghost btn-sm" style="padding:3px 6px;" onclick="saveAssignment(${c.id})" title="Enregistrer">
              <i class="ti ti-check" style="font-size:12px;" aria-hidden="true"></i>
            </button>
            <span class="assign-saved" id="assign-saved-${c.id}">✓</span>
          </div>
        </td>
        <td>
          <select class="admin-select" id="cand-statut-${c.id}" onchange="saveCandidatureStatut(${c.id})" ${c.statut === 'retiree' ? 'disabled' : ''}>
            <option value="recue"    ${c.statut === 'recue'    ? 'selected' : ''}>Reçue</option>
            <option value="examen"   ${c.statut === 'examen'   ? 'selected' : ''}>En examen</option>
            <option value="acceptee" ${c.statut === 'acceptee' ? 'selected' : ''}>Acceptée</option>
            <option value="refusee"  ${c.statut === 'refusee'  ? 'selected' : ''}>Refusée</option>
            ${c.statut === 'retiree' ? '<option value="retiree" selected>Retirée</option>' : ''}
          </select>
        </td>
        <td><button class="btn btn-ghost btn-sm" onclick="showDetail(${c.id})">Lire →</button></td>
      </tr>`;
  }).join('');
}

function getPosteNom(cand) {
  if (cand.type === 'oc3') return '3ème OC — ' + (cand.donnees?.clan_vise || '');
  if (cand.type === 'oc4') return '4ème OC — ' + (cand.donnees?.clan_vise || '');
  if (cand.type === 'staff') {
    const rv = cand.donnees?.roles_vises;
    if (rv && rv.length) return rv.map(r => r.nom).join(' + ');
    if (cand.poste_id) {
      const p = staffPostes.find(x => x.id === cand.poste_id);
      if (p) { const pole = POLES.find(x => x.id === p.pole); return `${p.nom}${pole ? ' — ' + pole.nom : ''}`; }
    }
    return 'Staff';
  }
  if (cand.type === 'hr') {
    const r = hrPostes.find(x => x.id === cand.poste_id);
    if (!r) return `Rang #${cand.poste_id}`;
    const clan = CLANS.find(c => c.id === r.clan);
    return `${r.rang}${clan ? ' — ' + clan.nom : ''}`;
  }
  return '—';
}

// État en cours pour la modale de décision
let _pendingDecision = null;

async function saveCandidatureStatut(id) {
  const sel      = document.getElementById(`cand-statut-${id}`);
  const newStatut = sel.value;
  const cand     = allCandidatures.find(c => c.id === id);

  // Décisions finales : note obligatoire
  if (newStatut === 'acceptee' || newStatut === 'refusee') {
    // Annuler le changement visuel pour l'instant
    if (cand) sel.value = cand.statut;
    _pendingDecision = { id, newStatut };
    openDecisionNoteModal(newStatut);
    return;
  }

  await _applyStatutChange(id, newStatut);
}

async function _applyStatutChange(id, newStatut, note) {
  const { error } = await sb.from('candidatures').update({ statut: newStatut }).eq('id', id);
  if (error) { showToast('Erreur mise à jour statut.', 'error'); return; }

  const idx = allCandidatures.findIndex(c => c.id === id);
  if (idx !== -1) allCandidatures[idx].statut = newStatut;

  // Mettre à jour le select dans le tableau
  const sel = document.getElementById(`cand-statut-${idx >= 0 ? id : id}`);
  if (sel) sel.value = newStatut;

  showToast(`Statut mis à jour : ${STATUT_LABELS[newStatut]}`, 'success');

  // Notification Discord
  if (newStatut === 'acceptee' || newStatut === 'refusee') {
    const cand     = allCandidatures.find(c => c.id === id);
    const posteNom = cand ? getPosteNom(cand) : '—';
    const embed    = buildDecisionEmbed(cand, newStatut, posteNom);
    await sendDiscordWebhook(CONFIG.discord.webhookNotifCandidats, { embeds: [embed] });
  }
}

// --- Modale note obligatoire ---
function openDecisionNoteModal(statut) {
  const isAccept = statut === 'acceptee';
  document.getElementById('decision-note-title').textContent =
    isAccept ? '✓ Accepter la candidature' : '✕ Refuser la candidature';
  document.getElementById('decision-note-sub').textContent =
    isAccept
      ? 'Écris une note pour confirmer l\'acceptation et expliquer les prochaines étapes à l\'équipe.'
      : 'Écris une note pour expliquer les raisons du refus. Elle sera consultable dans le panel staff.';
  document.getElementById('decision-note-input').value = '';
  document.getElementById('decision-note-counter').textContent = '0 caractères — minimum 20';
  document.getElementById('decision-note-counter').className = 'char-counter low';

  // Compteur en temps réel
  const ta = document.getElementById('decision-note-input');
  ta.oninput = () => {
    const len = ta.value.trim().length;
    const counter = document.getElementById('decision-note-counter');
    counter.textContent = `${len} / 20 caractères minimum`;
    counter.className = 'char-counter ' + (len >= 20 ? 'ok' : len >= 10 ? 'mid' : 'low');
  };

  document.getElementById('modal-decision-note').classList.add('open');
  setTimeout(() => ta.focus(), 100);
}

async function confirmDecisionNote() {
  if (!_pendingDecision) return;
  const note = document.getElementById('decision-note-input').value.trim();
  if (note.length < 20) {
    showToast('La note doit contenir au moins 20 caractères.', 'error');
    document.getElementById('decision-note-input').classList.add('field-error');
    return;
  }

  const { id, newStatut } = _pendingDecision;
  const btn = document.querySelector('#modal-decision-note .btn-primary');
  setLoading(btn, true, 'Enregistrement…');

  // Changer le statut
  await _applyStatutChange(id, newStatut, note);

  // Sauvegarder la note
  const { data: { session } } = await sb.auth.getSession();
  const auteur = session?.user?.email || 'Staff';
  await sb.from('notes_candidatures').insert({
    candidature_id: id,
    auteur,
    contenu: `[${STATUT_LABELS[newStatut].toUpperCase()}] ${note}`,
  });

  // Webhook Discord — notification note de décision
  const cand     = allCandidatures.find(c => c.id === id);
  const posteNom = cand ? getPosteNom(cand) : '—';
  const decisionEmbed = {
    title: `${newStatut === 'acceptee' ? '✅' : '❌'} Décision — ${posteNom}`,
    description: `**${auteur}** a ${newStatut === 'acceptee' ? 'accepté' : 'refusé'} la candidature de **${cand?.pseudo_discord || '—'}**.`,
    color: newStatut === 'acceptee' ? 0x4aaa80 : 0xb04848,
    fields: [
      { name: 'Note de décision', value: note, inline: false },
      { name: 'Code de suivi', value: cand?.code_suivi ? `\`${cand.code_suivi}\`` : '—', inline: true },
    ],
    footer: { text: `Le Prix de la Trêve · ${new Date().toLocaleDateString('fr-FR')}` },
    timestamp: new Date().toISOString(),
  };
  await sendDiscordWebhook(CONFIG.discord.webhookAdmin, { embeds: [decisionEmbed] });

  setLoading(btn, false);
  cancelDecisionNote();
  showToast('Décision enregistrée avec note.', 'success');

  // Rafraîchir le détail si ouvert
  if (document.getElementById('modal-detail').classList.contains('open')) {
    await loadNotes(id);
  }
}

function cancelDecisionNote() {
  document.getElementById('modal-decision-note').classList.remove('open');
  _pendingDecision = null;
}

// -----------------------------------------------
// Détail candidature (modale)
// -----------------------------------------------

function showDetail(id) {
  const cand = allCandidatures.find(c => c.id === id);
  if (!cand) return;

  document.getElementById('detail-title').textContent = getPosteNom(cand);
  const d = cand.donnees || {};

  let metaRows = [];
  let longFields = [];

  if (cand.type === 'staff') {
    // Nouveau format avec questions spécifiques par rôle
    if (d.roles_vises) {
      metaRows   = [['Pseudo', d.pseudo_discord], ['Ancienneté', d.anciennete_serveur], ['Disponibilités', d.disponibilites], ['Rôle(s) visé(s)', d.roles_vises.map(r => r.nom).join(' + ')]];
      longFields = [['Présentation', d.presentation], ['Qualités', d.qualites], ['Expérience staff', d.experience_staff]];
      // Ajouter les questions spécifiques de chaque rôle
      if (d.reponses_specifiques) {
        Object.entries(d.reponses_specifiques).forEach(([roleId, answers]) => {
          const roleMeta = { '1':'Parrain / Marraine','2':'Régisseur·se fiche','3':'Généticien·ne','4':'Animateur·rice','5':'Gestion RP','6':'Plume','7':'Gestion PNJ','8':'Bâtisseur·se' };
          const roleNom  = roleMeta[roleId] || `Rôle #${roleId}`;
          Object.entries(answers).forEach(([qId, ans]) => {
            longFields.push([`${roleNom} — ${qId}`, ans]);
          });
        });
      }
    } else {
      // Ancien format
      metaRows   = [['Pseudo', d.pseudo_discord], ['Ancienneté', d.anciennete_serveur], ['Disponibilités', d.disponibilites]];
      longFields = [['Motivation', d.motivation], ['Expérience', d.experience_staff]];
    }

  } else if (cand.type === 'hr') {
    metaRows   = [
      ['Pseudo',            d.pseudo_discord],
      ['OC',                d.nom_oc],
      ['Rang actuel',       d.rang_actuel],
      ['Ancienneté serveur',d.anciennete_serveur || d.anciennete_oc],
      ['Ancienneté OC',     d.anciennete_oc],
    ].filter(([,v]) => v);
    longFields = [['Activité RP', d.activite_rp], ['Motivation OOC', d.motivation_ooc]];
    // Ajouter les réponses aux mises en situation
    if (d.reponses_specifiques) {
      const qLabels = {
        conflit_interne:'Conflit interne', decision_solitaire:'Décision solitaire', incarnation_quotidienne:'Incarnation quotidienne',
        prise_en_charge:'Prise en charge', mediation:'Médiation', vision_du_rang:'Vision du rang',
        scene_de_soin:'Scène de soin', dilemme_secret:'Dilemme / Secret', place_dans_le_clan:'Place dans le clan',
        premier_defi:'Premier défi', relation_mentor:'Relation mentor', vocation:'Vocation',
      };
      Object.entries(d.reponses_specifiques).forEach(([k, v]) => {
        longFields.push([qLabels[k] || k, v]);
      });
    }
    longFields.push(['Motivation IC', d.motivation_ic], ['Extrait RP', d.extrait_rp]);

  } else if (cand.type === 'oc3') {
    metaRows    = [['Pseudo', d.pseudo_discord], ['Ancienneté serveur', d.anciennete], ['Clan visé', d.clan_vise], ['Nom envisagé', d.nom_envisage || '—']];
    longFields  = [['OCs actuels', d.ocs_actuels], ['Activité RP', d.activite], ['Concept', d.concept], ['Justification', d.justification]];

  } else if (cand.type === 'oc4') {
    metaRows    = [['Pseudo', d.pseudo_discord], ['Ancienneté serveur', d.anciennete], ['Clan visé', d.clan_vise], ['Nom envisagé', d.nom_envisage || '—']];
    longFields  = [['3 OCs actuels', d.ocs_actuels], ['Activité détaillée', d.activite], ['Justification renforcée', d.justification], ['Concept', d.concept], ['Extrait RP', d.extrait_rp]];
  }

  document.getElementById('detail-content').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:1.25rem;">
      ${metaRows.map(([k, v]) => `
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:.75rem;">
          <div style="font-size:10px;color:var(--text-3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;">${k}</div>
          <div style="font-size:13px;color:var(--text-1);">${escHtml(v || '—')}</div>
        </div>`).join('')}
    </div>
    ${longFields.map(([k, v]) => `
      <div style="margin-bottom:1rem;">
        <div style="font-size:10px;color:var(--text-3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">${k}</div>
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:.875rem;font-size:13px;color:var(--text-2);line-height:1.7;white-space:pre-wrap;">${escHtml(v || '—')}</div>
      </div>`).join('')}
  `;
  // Ajouter la section notes
  const dc = document.getElementById('detail-content');
  if (dc) {
    dc.innerHTML += `
      <div class="notes-section">
        <div class="notes-title">Notes internes staff</div>
        <div id="notes-list-${cand.id}"><div style="font-size:12px;color:var(--text-3);">Chargement…</div></div>
        <div class="notes-add">
          <textarea id="note-input-${cand.id}" placeholder="Ajouter une note interne visible uniquement par le staff…"></textarea>
          <button id="note-btn-${cand.id}" class="btn btn-ghost btn-sm" style="align-self:flex-end;" onclick="addNote(${cand.id})">Ajouter la note</button>
        </div>
      </div>`;
  }
  document.getElementById('modal-detail').classList.add('open');
  loadNotes(cand.id);
}

function closeDetailModal() {
  document.getElementById('modal-detail').classList.remove('open');
}

// -----------------------------------------------
// -----------------------------------------------
// Notification liste d'attente → Discord (améliorée)
// -----------------------------------------------

async function notifyWaitlist(posteId, posteType, posteNom) {
  const { data: entries } = await sb
    .from('liste_attente')
    .select('id, pseudo_discord, discord_id')
    .eq('poste_id', posteId)
    .eq('poste_type', posteType)
    .eq('notifie', false);

  if (!entries || !entries.length) {
    showToast("Aucune personne en liste d'attente pour ce poste.", 'info');
    return;
  }

  const withId    = entries.filter(e => e.discord_id);
  const withoutId = entries.filter(e => !e.discord_id);
  const mentionContent = [
    ...withId.map(e => `<@${e.discord_id}>`),
    ...withoutId.map(e => e.pseudo_discord),
  ].join(' ');

  // Webhook public (salon membres) — vraies mentions Discord
  const siteUrl = CONFIG.site?.url || '';
  const publicPayload = {
    content: `\uD83D\uDD14 ${mentionContent}`,
    embeds: [{
      title: `\uD83D\uDFE2 Poste ouvert \u2014 ${posteNom}`,
      description: `Le poste **${posteNom}** est maintenant ouvert aux candidatures !`,
      color: 0x4aaa80,
      fields: [
        { name: 'Candidater', value: `[Acc\u00e9der au formulaire](${siteUrl}/candidature.html)`, inline: true },
        ...(withoutId.length ? [{
          name: '\u26A0\uFE0F Sans ID Discord (pinger manuellement)',
          value: withoutId.map(e => e.pseudo_discord).join(', '),
          inline: false,
        }] : []),
      ],
      footer: { text: `Le Prix de la Tr\u00eave \u00b7 ${new Date().toLocaleDateString('fr-FR')}` },
      timestamp: new Date().toISOString(),
    }],
  };
  await sendDiscordWebhook(CONFIG.discord.webhookOuvertures, publicPayload);

  // Webhook admin — résumé interne
  const adminEmbed = buildWaitlistNotifEmbed(posteNom, entries.map(e =>
    e.discord_id ? `<@${e.discord_id}> (${e.pseudo_discord})` : e.pseudo_discord
  ));
  await sendDiscordWebhook(CONFIG.discord.webhookAdmin, { embeds: [adminEmbed] });

  // Marquer notifiés
  await sb.from('liste_attente').update({ notifie: true }).in('id', entries.map(e => e.id));
  showToast(`${entries.length} personne(s) notifi\u00e9e(s) sur Discord.`, 'success');
  await loadAttente();
}

// -----------------------------------------------
// Gestion des listes d'attente dans le panel admin
// -----------------------------------------------

let attenteEntries = [];

async function loadAttente() {
  const { data } = await sb
    .from('liste_attente')
    .select('id, pseudo_discord, discord_id, poste_id, poste_type, notifie, created_at')
    .eq('notifie', false)
    .order('created_at', { ascending: true });

  attenteEntries = data || [];
  const count = document.getElementById('attente-count');
  if (count) count.textContent = attenteEntries.length ? `(${attenteEntries.length})` : '';
  renderAttenteTable(attenteEntries);
}

function renderAttenteTable(entries) {
  const tbody = document.getElementById('admin-attente-tbody');
  if (!tbody) return;
  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="td-muted">Aucune inscription en attente.</td></tr>';
    return;
  }
  tbody.innerHTML = entries.map(e => {
    const posteNom = getAttentePosteNom(e);
    const hasValidId = e.discord_id && /^\d{17,19}$/.test(e.discord_id);
    return `
      <tr id="attente-row-${e.id}">
        <td style="font-weight:500;">${escHtml(e.pseudo_discord)}</td>
        <td>
          <input type="text" class="admin-input-inline" style="width:190px;border-color:${hasValidId ? 'var(--ouvert)' : ''};"
            id="attente-id-${e.id}"
            value="${escHtml(e.discord_id || '')}"
            placeholder="ex : 123456789012345678">
        </td>
        <td class="td-muted">${escHtml(posteNom)}</td>
        <td class="td-muted" style="font-size:11px;">${formatDate(e.created_at)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="saveAttenteId(${e.id}, '${escHtml(e.pseudo_discord)}')">
            Enregistrer
          </button>
        </td>
      </tr>`;
  }).join('');
}

function getAttentePosteNom(entry) {
  if (entry.poste_type === 'staff') {
    const p = staffPostes.find(x => x.id === entry.poste_id);
    if (p) { const pole = POLES.find(x => x.id === p.pole); return `${p.nom}${pole ? ' \u2014 ' + pole.nom : ''}`; }
  } else if (entry.poste_type === 'hr') {
    const r = hrPostes.find(x => x.id === entry.poste_id);
    if (r) { const clan = CLANS.find(c => c.id === r.clan); return `${r.rang}${clan ? ' \u2014 ' + clan.nom : ''}`; }
  }
  return `Poste #${entry.poste_id}`;
}

async function saveAttenteId(id, pseudo) {
  const input     = document.getElementById(`attente-id-${id}`);
  const discordId = input.value.trim();

  if (discordId && !/^\d{17,19}$/.test(discordId)) {
    showToast("L'ID Discord doit contenir 17 \u00e0 19 chiffres.", 'error');
    input.style.borderColor = 'var(--indispo)';
    return;
  }

  const btn = document.querySelector(`#attente-row-${id} .btn-primary`);
  setLoading(btn, true, '\u2026');

  const { error } = await sb.from('liste_attente')
    .update({ discord_id: discordId || null })
    .eq('id', id);

  if (error) { setLoading(btn, false); showToast('Erreur lors de la sauvegarde.', 'error'); return; }

  // M\u00e9moriser dans membres_discord pour les prochaines fois
  if (discordId) {
    await sb.from('membres_discord').upsert(
      { pseudo_discord: pseudo, discord_id: discordId },
      { onConflict: 'pseudo_discord' }
    );
  }

  const idx = attenteEntries.findIndex(e => e.id === id);
  if (idx !== -1) attenteEntries[idx].discord_id = discordId || null;

  setLoading(btn, false);
  input.style.borderColor = discordId ? 'var(--ouvert)' : '';
  showToast(discordId ? `ID enregistr\u00e9 pour ${pseudo}. M\u00e9moris\u00e9 pour les prochaines fois.` : 'ID supprim\u00e9.', 'success');
}


// =========================================================
// STATISTIQUES LÉGÈRES
// =========================================================

async function loadStats() {
  const now       = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Candidatures ce mois
  const { count: moisCount } = await sb
    .from('candidatures')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startMonth);

  // En attente de décision
  const { count: pendingCount } = await sb
    .from('candidatures')
    .select('*', { count: 'exact', head: true })
    .in('statut', ['recue', 'examen']);

  // Décisions pour taux + délai
  const { data: decided } = await sb
    .from('candidatures')
    .select('statut, created_at, updated_at')
    .in('statut', ['acceptee', 'refusee'])
    .limit(200);

  const taux = decided?.length
    ? Math.round(decided.filter(d => d.statut === 'acceptee').length / decided.length * 100)
    : null;

  const delaiMoyen = decided?.length
    ? Math.round(decided.reduce((acc, d) => {
        return acc + (new Date(d.updated_at) - new Date(d.created_at)) / 86400000;
      }, 0) / decided.length)
    : null;

  const el = id => document.getElementById(id);
  if (el('stat-mois'))    el('stat-mois').textContent    = moisCount    ?? '—';
  if (el('stat-taux'))    el('stat-taux').textContent    = taux != null  ? taux + '%' : '—';
  if (el('stat-delai'))   el('stat-delai').textContent   = delaiMoyen != null ? delaiMoyen + ' j.' : '—';
  if (el('stat-attente')) el('stat-attente').textContent = pendingCount ?? '—';
}


// =========================================================
// NOTES INTERNES STAFF
// =========================================================

async function loadNotes(candidatureId) {
  const container = document.getElementById(`notes-list-${candidatureId}`);
  if (!container) return;

  const { data, error } = await sb
    .from('notes_candidatures')
    .select('*')
    .eq('candidature_id', candidatureId)
    .order('created_at');

  if (error || !data?.length) {
    container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0;">Aucune note pour l\'instant.</div>';
    return;
  }

  container.innerHTML = data.map(n => `
    <div class="note-item">
      <div class="note-meta">
        <strong>${escHtml(n.auteur)}</strong>
        <span>·</span>
        <span>${formatDate(n.created_at, true)}</span>
      </div>
      <div class="note-content">${escHtml(n.contenu)}</div>
    </div>
  `).join('');
}

async function addNote(candidatureId) {
  const input   = document.getElementById(`note-input-${candidatureId}`);
  const contenu = input?.value.trim();
  if (!contenu) return;

  const { data: { session } } = await sb.auth.getSession();
  const auteur = session?.user?.email || 'Staff';

  const btn = document.getElementById(`note-btn-${candidatureId}`);
  setLoading(btn, true, '…');

  const { error } = await sb.from('notes_candidatures').insert({
    candidature_id: candidatureId,
    auteur,
    contenu,
  });

  setLoading(btn, false);
  if (error) { showToast('Erreur lors de l\'ajout de la note.', 'error'); return; }

  // Webhook Discord — notification note staff
  const cand     = allCandidatures.find(c => c.id === candidatureId);
  const posteNom = cand ? getPosteNom(cand) : '—';
  const noteEmbed = {
    title: `📝 Note staff — ${posteNom}`,
    description: `**${auteur}** a ajouté une note sur la candidature de **${cand?.pseudo_discord || '—'}**.`,
    color: 0xC4872A,
    fields: [
      { name: 'Note', value: contenu, inline: false },
      { name: 'Code', value: cand?.code_suivi ? `\`${cand.code_suivi}\`` : '—', inline: true },
    ],
    footer: { text: `Le Prix de la Trêve · ${new Date().toLocaleDateString('fr-FR')}` },
    timestamp: new Date().toISOString(),
  };
  await sendDiscordWebhook(CONFIG.discord.webhookAdmin, { embeds: [noteEmbed] });

  input.value = '';
  showToast('Note ajoutée.', 'success');
  await loadNotes(candidatureId);
}


// =========================================================
// DASHBOARD — Graphiques, activité, recherche, attribution
// =========================================================

let _chartTypes   = null;
let _chartMonthly = null;

// --- Appeler depuis loadAll ---
async function loadDashboard() {
  await Promise.all([loadActivityFeed(), renderCharts()]);
}

// -----------------------------------------------
// FIL D'ACTIVITÉ RÉCENTE
// -----------------------------------------------
async function loadActivityFeed() {
  const { data } = await sb
    .from('candidatures')
    .select('id, code_suivi, type, pseudo_discord, statut, created_at, updated_at, assigne_a')
    .order('updated_at', { ascending: false })
    .limit(18);

  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  if (!data?.length) {
    feed.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-3);font-size:12px;">Aucune activité récente.</div>';
    return;
  }

  const typeLabels = { staff:'Staff', hr:'HR', oc3:'3ème OC', oc4:'4ème OC' };
  const statusIcons = { recue:'⬤', examen:'◐', acceptee:'✓', refusee:'✕', retiree:'—' };

  feed.innerHTML = data.map(c => {
    const elapsed = getElapsed(c.updated_at);
    const label   = typeLabels[c.type] || c.type;
    return `
      <div class="activity-item">
        <div class="activity-dot ${c.type}"></div>
        <div class="activity-body">
          <div class="activity-title">${escHtml(c.pseudo_discord)} · ${label}</div>
          <div class="activity-meta">
            <span class="badge ${c.statut}" style="font-size:9px;margin:0 4px 0 0;">${STATUT_LABELS[c.statut]||c.statut}</span>
            ${elapsed}
          </div>
        </div>
      </div>`;
  }).join('');
}

function getElapsed(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (diff < 1)  return 'à l\'instant';
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? 's' : ''}`;
}

// -----------------------------------------------
// GRAPHIQUES (Chart.js)
// -----------------------------------------------
async function renderCharts() {
  if (typeof Chart === 'undefined') return;

  const { data: all } = await sb.from('candidatures').select('type, statut, created_at');
  if (!all?.length) return;

  const palette = {
    staff:   '#B8813A',
    hr:      '#C4872A',
    oc3:     '#5A9A70',
    oc4:     '#8A9A42',
  };

  // --- Donut : répartition par type ---
  const typeCounts = { staff:0, hr:0, oc3:0, oc4:0 };
  all.forEach(c => { if (typeCounts[c.type] !== undefined) typeCounts[c.type]++; });

  const ctxTypes = document.getElementById('chart-types');
  if (ctxTypes) {
    if (_chartTypes) _chartTypes.destroy();
    _chartTypes = new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: ['Staff', 'Hauts Rangs', '3ème OC', '4ème OC'],
        datasets: [{
          data: [typeCounts.staff, typeCounts.hr, typeCounts.oc3, typeCounts.oc4],
          backgroundColor: Object.values(palette),
          borderWidth: 2,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#1F1610',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-2').trim() || '#A08060',
              font: { size: 11 },
              boxWidth: 10,
              padding: 12,
            }
          }
        }
      }
    });
  }

  // --- Barres : 6 derniers mois ---
  const now   = new Date();
  const months = [];
  const counts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
    const start = d.toISOString();
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    counts.push(all.filter(c => c.created_at >= start && c.created_at < end).length);
  }

  const ctxMonth = document.getElementById('chart-monthly');
  if (ctxMonth) {
    if (_chartMonthly) _chartMonthly.destroy();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-2').trim() || '#A08060';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(180,140,100,.13)';
    _chartMonthly = new Chart(ctxMonth, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Candidatures',
          data: counts,
          backgroundColor: 'rgba(184,129,58,.5)',
          borderColor: '#B8813A',
          borderWidth: 1.5,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          y: { ticks: { color: textColor, font: { size: 10 }, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
        }
      }
    });
  }
}

// -----------------------------------------------
// RECHERCHE GLOBALE
// -----------------------------------------------
let _searchTimer = null;

function onSearchInput(val) {
  document.getElementById('clear-search-btn').style.display = val ? '' : 'none';
  clearTimeout(_searchTimer);
  if (!val.trim()) { closeSearch(); return; }
  _searchTimer = setTimeout(() => globalSearch(val.trim()), 350);
}

function clearSearch() {
  document.getElementById('global-search-input').value = '';
  document.getElementById('clear-search-btn').style.display = 'none';
  closeSearch();
}

function closeSearch() {
  const el = document.getElementById('search-results');
  el.innerHTML = '';
  el.classList.remove('open');
}

async function globalSearch(q) {
  const { data } = await sb
    .from('candidatures')
    .select('id, code_suivi, type, pseudo_discord, statut, created_at')
    .or(`pseudo_discord.ilike.%${q}%,code_suivi.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  const el = document.getElementById('search-results');
  if (!data?.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0;">Aucun résultat.</div>';
    el.classList.add('open');
    return;
  }

  const typeLabels = { staff:'Staff', hr:'Hauts Rangs', oc3:'3ème OC', oc4:'4ème OC' };
  el.innerHTML = data.map(c => `
    <div class="search-result-item" onclick="openDetailFromSearch(${c.id})">
      <span class="badge ${c.statut}" style="font-size:9px;margin:0;flex-shrink:0;">${STATUT_LABELS[c.statut]||c.statut}</span>
      <span style="font-size:12px;font-weight:500;color:var(--text-1);">${escHtml(c.pseudo_discord)}</span>
      <span style="font-size:11px;color:var(--text-3);">${typeLabels[c.type]||c.type}</span>
      <span style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);margin-left:auto;">${c.code_suivi}</span>
    </div>`).join('');
  el.classList.add('open');
}

function openDetailFromSearch(id) {
  closeSearch();
  clearSearch();
  const cand = allCandidatures.find(c => c.id === id);
  if (cand) { showDetail(id); return; }
  // Si pas en mémoire, recharger et ouvrir
  sb.from('candidatures').select('*').eq('id', id).single().then(({ data }) => {
    if (data) { allCandidatures.push(data); showDetail(id); }
  });
}

// -----------------------------------------------
// ATTRIBUTION (assigner à un staff)
// -----------------------------------------------
async function saveAssignment(id) {
  const input = document.getElementById(`assign-${id}`);
  const val   = input?.value.trim() || null;
  const { error } = await sb.from('candidatures').update({ assigne_a: val }).eq('id', id);
  if (error) { showToast('Erreur sauvegarde attribution.', 'error'); return; }
  const idx = allCandidatures.findIndex(c => c.id === id);
  if (idx !== -1) allCandidatures[idx].assigne_a = val;
  const saved = document.getElementById(`assign-saved-${id}`);
  if (saved) { saved.style.display = 'inline'; setTimeout(() => saved.style.display = 'none', 2000); }
}

// -----------------------------------------------
// Mettre à jour loadAll et renderCandidaturesTable
// -----------------------------------------------


// =========================================================
// NAVIGATION SIDEBAR
// =========================================================

function switchSection(name, clickedEl) {
  // Sections
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('section-' + name);
  if (target) target.classList.add('active');

  // Liens sidebar
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (clickedEl) clickedEl.classList.add('active');
}