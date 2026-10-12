const ADMIN_CODE = "araxia_2024_secret";
const adminPassword = localStorage.getItem('admin_authenticated');

function adminLogin() {
    const code = prompt("Code admin:");
    if (hashCode(code) === hashCode(ADMIN_CODE)) {
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_login_time', new Date().toISOString());
    }
}

function validerFormulaire(form) {
    const errors = [];
    
    // Vérifier pseudo
    if (!form.pseudo.value.trim()) {
        errors.push("Le pseudo est obligatoire");
    }
    
    // Vérifier cases à cocher
    if (!form.accept_rules.checked) {
        errors.push("Vous devez accepter le règlement");
    }
    
    if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-errors';
        errorDiv.innerHTML = errors.map(e => `<p>❌ ${e}</p>`).join('');
        form.prepend(errorDiv);
        return false;
    }
    return true;
}

<div id="confirmation-modal" class="modal" style="display: none;">
    <div class="modal-content">
        <h2>Confirmer votre candidature</h2>
        <p>Pseudo : <strong id="confirm-pseudo"></strong></p>
        <p>Rôle : <strong id="confirm-role"></strong></p>
        <div style="display: flex; gap: 10px;">
            <button onclick="submitForm()">✅ Envoyer</button>
            <button onclick="closeModal()">❌ Annuler</button>
        </div>
    </div>
</div>

function verifierDoublon() {
    const lastSubmit = localStorage.getItem('last_submit_time');
    if (lastSubmit) {
        const hours = (Date.now() - parseInt(lastSubmit)) / (1000 * 60 * 60);
        if (hours < 24) {
            alert(`⏳ Vous devez attendre ${Math.round(24 - hours)}h avant de soumettre à nouveau`);
            return false;
        }
    }
    localStorage.setItem('last_submit_time', Date.now().toString());
    return true;
}

function sauvegarderBrouillon(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    localStorage.setItem(`draft_${form.id}`, JSON.stringify(data));
}

function restaurerBrouillon(form) {
    const draft = localStorage.getItem(`draft_${form.id}`);
    if (draft) {
        const data = JSON.parse(draft);
        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) field.value = data[key];
        });
    }
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(99, 91, 255, 0.1);
    border-radius: 2px;
    margin-bottom: 30px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), var(--purple-magic));
    transition: width 0.3s ease;
}

const colorMap = {
    'staff': 0xDFB15B,
    'gestion': 0x9b59b6,
    'haut_rang': 0xf39c12
};

// Dans envoyerViaWebhook :
const embeds = diviserEnEmbeds(fields, colorMap[typeForm]);

<button id="toggle-staff-btn" 
        class="btn-toggle" 
        aria-label="Basculer l'ouverture du recrutement Staff">
    Bascule dynamique
</button>