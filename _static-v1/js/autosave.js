/* Brouillons localStorage : lpdt_draft_{formId} */
const Autosave = (() => {
  const key = id => `lpdt_draft_${id}`;
  const fields = form => [...form.querySelectorAll('input[name],textarea[name],select[name]')];
  const read = id => { try { return JSON.parse(localStorage.getItem(key(id))); } catch { return null; } };

  function save(form, id) {
    const data = {};
    fields(form).forEach(f => { if (f.value) data[f.name] = f.value; });
    try {
      if (Object.keys(data).length) localStorage.setItem(key(id), JSON.stringify(data));
      else localStorage.removeItem(key(id));
    } catch {}
  }

  function setVal(f, v) {
    f.value = v;
    f.dispatchEvent(new Event(f.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }

  // Champs statiques d'abord (leurs selects génèrent les champs dynamiques), puis les dynamiques
  function restore(form, data) {
    fields(form).filter(f => !f.hasAttribute('data-dynamic') && data[f.name] != null).forEach(f => setVal(f, data[f.name]));
    fields(form).filter(f => f.hasAttribute('data-dynamic') && data[f.name] != null).forEach(f => setVal(f, data[f.name]));
  }

  function init(form, id) {
    let timer;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => save(form, id), 800); };
    form.addEventListener('input', schedule);
    form.addEventListener('change', schedule);
    const draft = read(id);
    if (!draft || !Object.keys(draft).length) return;
    const bar = document.createElement('div');
    bar.className = 'banner';
    bar.innerHTML = `<i class="ti ti-file-text"></i><span class="grow">Brouillon trouvé</span>
      <button type="button" class="btn sm" data-a="r">Restaurer</button><button type="button" class="btn sm ghost" data-a="i">Ignorer</button>`;
    form.prepend(bar);
    bar.querySelector('[data-a=r]').onclick = () => { restore(form, draft); bar.remove(); showToast('Brouillon restauré.', 'success'); };
    bar.querySelector('[data-a=i]').onclick = () => { try { localStorage.removeItem(key(id)); } catch {} bar.remove(); };
  }
  return { init };
})();

window.clearDraft = id => { try { localStorage.removeItem(`lpdt_draft_${id}`); } catch {} };
