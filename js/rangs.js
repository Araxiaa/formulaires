// =========================================================
// rangs.js — Page publique des hauts rangs actuels
// =========================================================

(async function init() {
  renderNav('rangs');
  const { data, error } = await sb.from('postes_hr').select('*').order('id');
  const main = document.getElementById('rangs-main');
  if (error || !data) {
    main.innerHTML = '<div class="empty-state">Impossible de charger les données.</div>';
    return;
  }

  let html = '';
  CLANS.forEach(clan => {
    const rangs = data.filter(r => r.clan === clan.id);
    const hasOpen = rangs.some(r => r.statut === 'ouvert');
    html += `
      <div style="margin-bottom:2.5rem;">
        <div class="clan-header ${clan.id}" style="margin-bottom:1.25rem;">
          <span class="clan-nom">${clan.nom}</span>
          ${hasOpen ? `<span class="clan-open-badge has">Recrutement ouvert</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">
          ${rangs.map(r => `
            <div class="post-card ${clan.id}" style="flex-direction:row;align-items:center;gap:12px;padding:.875rem 1rem;">
              <div style="flex:1;">
                <div class="card-nom" style="margin-bottom:3px;">${escHtml(r.rang)}</div>
                ${r.titulaire
                  ? `<div style="font-size:12px;color:var(--text-2);">${escHtml(r.titulaire)}</div>`
                  : `<div style="font-size:12px;color:var(--text-3);font-style:italic;">Vacant</div>`
                }
                ${r.note ? `<div class="card-note" style="margin-top:5px;margin-bottom:0;">${escHtml(r.note)}</div>` : ''}
              </div>
              <span class="badge ${r.statut}" style="flex-shrink:0;margin:0;">${STATUT_LABELS[r.statut]}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  main.innerHTML = html;
})();