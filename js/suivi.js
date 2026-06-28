// =========================================================
// suivi.js — Suivi et retrait de candidature
// =========================================================

const STEPS = {
  recue: [
    { key: 'recue',    label: 'Candidature reçue',    state: 'done'    },
    { key: 'examen',   label: "En cours d'examen",    state: 'pending' },
    { key: 'decision', label: 'Décision finale',       state: 'pending' },
  ],
  examen: [
    { key: 'recue',    label: 'Candidature reçue',    state: 'done'    },
    { key: 'examen',   label: "En cours d'examen",    state: 'current' },
    { key: 'decision', label: 'Décision finale',       state: 'pending' },
  ],
  acceptee: [
    { key: 'recue',    label: 'Candidature reçue',    state: 'done' },
    { key: 'examen',   label: 'Examinée',             state: 'done' },
    { key: 'decision', label: 'Candidature acceptée', state: 'ok'   },
  ],
  refusee: [
    { key: 'recue',    label: 'Candidature reçue',    state: 'done' },
    { key: 'examen',   label: 'Examinée',             state: 'done' },
    { key: 'decision', label: 'Candidature refusée',  state: 'ko'   },
  ],
  retiree: [
    { key: 'recue',   label: 'Candidature reçue',                     state: 'done' },
    { key: 'retiree', label: 'Candidature retirée par le·la candidat·e', state: 'ko'   },
  ],
};

const STEP_ICONS = { done: '✓', current: '◐', pending: '○', ok: '✓', ko: '✕' };

// --- Init ---
(function init() {
  renderNav('suivi');
  const { code } = getUrlParams();
  if (code) {
    document.getElementById('suivi-code').value = code.toUpperCase();
    checkSuivi();
  }
  document.getElementById('suivi-code').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkSuivi();
  });
})();

// -----------------------------------------------
// Vérification du code
// -----------------------------------------------
async function checkSuivi() {
  const input = document.getElementById('suivi-code');
  const code  = input.value.trim().toUpperCase();
  const result = document.getElementById('suivi-result');

  if (!code) { input.classList.add('field-error'); return; }
  input.classList.remove('field-error');
  input.value = code;

  result.innerHTML = '<div class="loading-wrap"><div class="spinner"></div>Recherche en cours…</div>';
  result.classList.remove('hidden');

  const { data, error } = await sb
    .from('candidatures')
    .select('*')
    .eq('code_suivi', code)
    .single();

  if (error || !data) {
    result.innerHTML = `
      <div class="suivi-card" style="max-width:420px;text-align:center;">
        <div style="font-size:24px;margin-bottom:10px;color:var(--indispo)">○</div>
        <div style="font-weight:600;color:var(--text-1);margin-bottom:6px;">Code introuvable</div>
        <div style="font-size:13px;color:var(--text-2);">
          Le code <code style="font-family:'Courier New',monospace;">${escHtml(code)}</code> ne correspond à aucune candidature.
          Vérifie l'orthographe ou retrouve ton code dans le message Discord Bot reçu lors de ta soumission.
        </div>
      </div>`;
    return;
  }

  renderSuivi(data);
}

// -----------------------------------------------
// Rendu du résultat
// -----------------------------------------------
async function renderSuivi(cand) {
  const table  = cand.type === 'hr' ? 'postes_hr' : cand.type === 'staff' ? 'postes_staff' : null;
  let posteNom = '—', posteContext = '';

  if (table && cand.poste_id) {
    const { data: poste } = await sb.from(table).select('*').eq('id', cand.poste_id).single();
    if (poste) {
      posteNom = cand.type === 'hr' ? poste.rang : poste.nom;
      if (cand.type === 'hr') {
        const clan = CLANS.find(c => c.id === poste.clan);
        posteContext = clan ? clan.nom : '';
      } else {
        posteContext = POLE_LABELS[poste.pole] || '';
      }
    }
  } else if (cand.type === 'staff' && cand.donnees?.roles_vises) {
    posteNom    = cand.donnees.roles_vises.map(r => r.nom).join(' + ');
    posteContext = 'Staff';
  } else if (cand.type === 'oc3') {
    posteNom    = '3ème OC';
    posteContext = cand.donnees?.clan_vise || '';
  } else if (cand.type === 'oc4') {
    posteNom    = '4ème OC';
    posteContext = cand.donnees?.clan_vise || '';
  }

  const steps      = STEPS[cand.statut] || STEPS.recue;
  const canWithdraw = ['recue', 'examen'].includes(cand.statut);

  document.getElementById('suivi-result').innerHTML = `
    <div class="suivi-card">
      <div class="suivi-meta">
        <div>
          <div class="suivi-nom">${escHtml(posteNom)}${posteContext ? ' — ' + escHtml(posteContext) : ''}</div>
          <div class="suivi-date">
            ${['oc3','oc4'].includes(cand.type) ? (cand.type==='oc3'?'3ème OC':'4ème OC') : cand.type === 'hr' ? 'Hauts Rangs' : 'Staff'}
            · Soumise le ${formatDate(cand.created_at)}
          </div>
        </div>
        <span class="badge ${cand.statut}">${STATUT_LABELS[cand.statut] || cand.statut}</span>
      </div>

      <div class="suivi-steps">
        ${steps.map(step => `
          <div class="suivi-step">
            <div class="step-dot ${step.state}">${STEP_ICONS[step.state]}</div>
            <div>
              <div class="step-label">${step.label}</div>
              ${step.state === 'done' || step.state === 'ok' || step.state === 'ko'
                ? `<div class="step-sub">${formatDate(cand.updated_at, true)}</div>`
                : step.state === 'current'
                  ? '<div class="step-sub">L\'équipe staff l\'examine actuellement</div>'
                  : '<div class="step-sub">En attente</div>'
              }
            </div>
          </div>
        `).join('')}
      </div>

      ${cand.statut === 'acceptee' ? `
        <div style="margin-top:1.25rem;padding:1rem;background:var(--ouvert-bg);border:1px solid rgba(45,184,130,.25);border-radius:var(--radius);font-size:13px;color:var(--ouvert);">
          🎉 Félicitations ! Ta candidature a été acceptée. L'équipe prendra contact avec toi sur Discord.
        </div>` : ''}

      ${cand.statut === 'refusee' ? `
        <div style="margin-top:1.25rem;padding:1rem;background:var(--indispo-bg);border:1px solid rgba(192,80,96,.25);border-radius:var(--radius);font-size:13px;color:var(--indispo);">
          Ta candidature n'a pas été retenue cette fois. N'hésite pas à repostuler si d'autres postes s'ouvrent !
        </div>` : ''}

      ${cand.statut === 'retiree' ? `
        <div style="margin-top:1.25rem;padding:1rem;background:var(--bg-surface);border:1px solid var(--border-s);border-radius:var(--radius);font-size:13px;color:var(--text-2);">
          Cette candidature a été retirée. Tu peux en soumettre une nouvelle à tout moment.
        </div>` : ''}

      ${canWithdraw ? `
        <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border);">
          <button class="btn btn-danger btn-sm" onclick="withdrawCandidature('${cand.id}', '${cand.code_suivi}')">
            Retirer ma candidature
          </button>
          <p style="font-size:11px;color:var(--text-3);margin-top:6px;">Cette action est irréversible.</p>
        </div>` : ''}
    </div>
  `;
}

// -----------------------------------------------
// Retrait de candidature
// -----------------------------------------------
async function withdrawCandidature(id, code) {
  const confirmed = confirm(
    'Retirer ta candidature ?\n\nCette action est définitive. Tu pourras repostuler ultérieurement si le poste est encore ouvert.'
  );
  if (!confirmed) return;

  const { error } = await sb.from('candidatures')
    .update({ statut: 'retiree' })
    .eq('id', id);

  if (error) {
    showToast('Erreur lors du retrait. Réessaie.', 'error');
    return;
  }

  showToast('Candidature retirée.', 'info');
  // Rafraîchir l'affichage
  document.getElementById('suivi-code').value = code;
  await checkSuivi();
}