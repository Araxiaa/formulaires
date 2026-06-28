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
}

// -----------------------------------------------
// Chargement global
// -----------------------------------------------

async function loadAll() {
  await Promise.all([loadStaff(), loadHR(), loadCandidatures(), loadAttente()]);
  loadStats();
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

async function saveCandidatureStatut(id) {
  const newStatut = document.getElementById(`cand-statut-${id}`).value;
  const { error } = await sb.from('candidatures').update({ statut: newStatut }).eq('id', id);
  if (error) { showToast('Erreur mise à jour statut.', 'error'); return; }

  const idx = allCandidatures.findIndex(c => c.id === id);
  if (idx !== -1) allCandidatures[idx].statut = newStatut;
  showToast(`Statut mis à jour : ${STATUT_LABELS[newStatut]}`, 'success');

  // Notification Discord automatique pour les décisions finales
  if (newStatut === 'acceptee' || newStatut === 'refusee') {
    const cand     = allCandidatures.find(c => c.id === id);
    const posteNom = cand ? getPosteNom(cand) : '—';
    const embed    = buildDecisionEmbed(cand, newStatut, posteNom);
    await sendDiscordWebhook(CONFIG.discord.webhookNotifCandidats, { embeds: [embed] });
    showToast('Notification Discord envoyée.', 'info');
  }
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

  input.value = '';
  showToast('Note ajoutée.', 'success');
  await loadNotes(candidatureId);
}