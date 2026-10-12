(async function () {
  const el = document.getElementById('rangs');
  if (!sb) { el.innerHTML = '<div class="notice">La base de données n\'est pas encore configurée (<code>js/config.js</code>).</div>'; return; }
  const { data, error } = await sb.from(T.postesHr).select('*').order('id');
  if (error) { el.innerHTML = '<div class="notice">Impossible de charger les rangs.</div>'; return; }
  el.innerHTML = CLANS.map(c => `
    <section data-clan="${c.id}">
      <div class="section-head reveal"><h2>${c.nom}</h2></div>
      <div class="grid">${data.filter(p => p.clan === c.id).map(p => `
        <article class="card reveal" data-clan="${c.id}">
          <h3>${escHtml(p.rang)}</h3>
          <div class="meta">${p.titulaire ? `<b>${escHtml(p.titulaire)}</b>` : '<span class="badge ouvert">Vacant</span>'}</div>
          ${p.note ? `<div class="meta"><i class="ti ti-info-circle"></i> ${escHtml(p.note)}</div>` : ''}
        </article>`).join('')}</div>
    </section>`).join('');
  initReveal(el);
})();
