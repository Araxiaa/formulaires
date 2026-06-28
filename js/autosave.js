// =========================================================
// autosave.js — Sauvegarde automatique des formulaires
// Sauvegarde dans localStorage, restauration au retour
// =========================================================

(function () {
  'use strict';

  const SAVE_DELAY  = 800;  // ms après la dernière frappe
  const CHANGE_DELAY = 300; // ms après un changement de select
  const timers = {};

  // -----------------------------------------------
  // Stockage
  // -----------------------------------------------

  function getKey(formId) {
    return 'lpdt_draft_' + formId;
  }

  function hasDraft(formId) {
    try { return !!localStorage.getItem(getKey(formId)); } catch(e) { return false; }
  }

  function getDraft(formId) {
    try {
      const raw = localStorage.getItem(getKey(formId));
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  // Exposé globalement pour être appelé depuis candidature.js au succès
  window.clearDraft = function(formId) {
    try { localStorage.removeItem(getKey(formId)); } catch(e) {}
    const banner = document.getElementById('autosave-banner-' + formId);
    if (banner) banner.remove();
  };

  // -----------------------------------------------
  // Sauvegarde
  // -----------------------------------------------

  function saveForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const data = {};
    form.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
      data[el.id] = el.value;
    });
    try {
      localStorage.setItem(getKey(formId), JSON.stringify({ ts: Date.now(), data }));
      flashIndicator(formId);
    } catch(e) {}
  }

  function debouncedSave(formId, delay) {
    clearTimeout(timers[formId]);
    timers[formId] = setTimeout(() => saveForm(formId), delay || SAVE_DELAY);
  }

  // -----------------------------------------------
  // Restauration
  // -----------------------------------------------

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Applique les valeurs sauvegardées sur les champs actuellement dans le DOM
  function applyData(data) {
    Object.entries(data).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && el.value !== value) el.value = value;
    });
  }

  async function restoreForm(formId, data) {
    // Phase 1 — champs statiques (toujours présents)
    applyData(data);

    // Phase 2 — déclencher le rendu des champs dynamiques Staff
    if (formId === 'form-staff') {
      const r1 = data['s-role-1'];
      if (r1 && typeof onRole1Change === 'function') {
        document.getElementById('s-role-1').value = r1;
        onRole1Change();
        await sleep(60);
        applyData(data); // restaure les questions spécifiques du rôle 1

        const r2 = data['s-role-2'];
        if (r2 && typeof onRole2Change === 'function') {
          document.getElementById('s-role-2').value = r2;
          onRole2Change();
          await sleep(60);
          applyData(data); // restaure les questions spécifiques du rôle 2
        }
      }
    }

    // Phase 3 — déclencher le rendu des champs dynamiques HR
    if (formId === 'form-hr') {
      const posteId = data['hr-poste'];
      if (posteId && typeof onRangChange === 'function') {
        document.getElementById('hr-poste').value = posteId;
        onRangChange();
        await sleep(80);
        applyData(data); // restaure les mises en situation + champs RP
      }
    }
  }

  // -----------------------------------------------
  // Bannière de restauration
  // -----------------------------------------------

  function timeLabel(ts) {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1)  return 'il y a quelques secondes';
    if (diff < 60) return `il y a ${diff} min`;
    const d = new Date(ts);
    return `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function showRestoreBanner(formId, draft) {
    const form = document.getElementById(formId);
    if (!form || document.getElementById('autosave-banner-' + formId)) return;

    const banner = document.createElement('div');
    banner.id        = 'autosave-banner-' + formId;
    banner.className = 'autosave-restore-banner';
    banner.innerHTML = `
      <span>📝 Brouillon trouvé — sauvegardé ${timeLabel(draft.ts)}.</span>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="btn btn-primary btn-sm" onclick="window.restoreDraft('${formId}')">Restaurer</button>
        <button class="btn btn-ghost  btn-sm" onclick="window.ignoreDraft('${formId}')">Ignorer</button>
      </div>
    `;
    form.insertBefore(banner, form.firstChild);
  }

  // -----------------------------------------------
  // Indicateur de sauvegarde (discret, en bas du form)
  // -----------------------------------------------

  function flashIndicator(formId) {
    let ind = document.getElementById('autosave-ind-' + formId);
    if (!ind) {
      ind = document.createElement('div');
      ind.id        = 'autosave-ind-' + formId;
      ind.className = 'autosave-indicator';
      const form = document.getElementById(formId);
      if (form) form.appendChild(ind);
    }
    ind.textContent = 'Brouillon sauvegardé ✓';
    ind.classList.add('visible');
    clearTimeout(ind._timer);
    ind._timer = setTimeout(() => ind.classList.remove('visible'), 2500);
  }

  // -----------------------------------------------
  // Actions globales (appelées depuis les onclick du banner)
  // -----------------------------------------------

  window.restoreDraft = async function (formId) {
    const draft = getDraft(formId);
    if (!draft) return;
    window.clearDraft(formId); // retire la bannière
    await restoreForm(formId, draft.data);
    if (typeof showToast === 'function') showToast('Brouillon restauré.', 'success');
  };

  window.ignoreDraft = function (formId) {
    window.clearDraft(formId);
  };

  // -----------------------------------------------
  // Initialisation de chaque formulaire
  // -----------------------------------------------

  function setupForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Sauvegarde sur frappe
    form.addEventListener('input',  () => debouncedSave(formId, SAVE_DELAY));
    // Sauvegarde plus rapide sur changement de select
    form.addEventListener('change', () => debouncedSave(formId, CHANGE_DELAY));

    // Bannière si brouillon existant
    const draft = getDraft(formId);
    if (draft) showRestoreBanner(formId, draft);
  }

  // Lancer après que candidature.js a tout initialisé
  window.addEventListener('load', () => {
    // Petit délai pour que les selects HR soient peuplés depuis Supabase
    setTimeout(() => {
      setupForm('form-staff');
      setupForm('form-hr');
      setupForm('form-oc3');
      setupForm('form-oc4');
    }, 600);
  });

})();