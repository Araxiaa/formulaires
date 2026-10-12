document.addEventListener("DOMContentLoaded", function () {
    
    const FORMSPREE_STAFF     = "https://formspree.io/f/xjgzjovl";
const FORMSPREE_HAUT_RANG = "https://formspree.io/f/mnjrlzql";
const FORMSPREE_GESTION   = "https://formspree.io/f/maqkabyz";

async function envoyerViaWebhook(formData, formspreeUrl, titre, couleur) {
    const response = await fetch(formspreeUrl, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(formData)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Formspree: ${err.error || response.status}`);
    }
    return true;
}

    // ==========================================
    // DICTIONNAIRE DE TRADUCTION DES QUESTIONS
    // ==========================================
    const questionLabels = {
        // STAFF
        "pseudo": "Pseudo Discord",
        "anciennete": "Ancienneté sur le serveur",
        "roles": "Rôles visés",
        "age": "Âge",
        "dispo": "Disponibilité hebdomadaire",
        "experience": "Expérience staff antérieure",
        "experience_details": "Détails expérience antérieure",
        "q7": "Gestion des conflits",
        "q8": "Réaction aux critiques",
        "q9": "Motivation pour rejoindre le staff",
        "q10": "Compréhension du rôle staff",
        "notes_sup": "Notes supplémentaires",
        "accept_rules": "Acceptation du règlement",
        "accept_sincerity": "Confirmé sincérité",
        // HELPER spécifiques
        "helper_1": "Question Helper 1",
        "helper_2": "Question Helper 2",
        "helper_3": "Question Helper 3",
        "helper_4": "Question Helper 4",
        // CORRECTEUR spécifiques
        "correcteur_1": "Question Correcteur 1",
        "correcteur_2": "Question Correcteur 2",
        "correcteur_3": "Question Correcteur 3",
        "correcteur_4": "Question Correcteur 4",
        // GENETICIEN spécifiques
        "geneticien_1": "Niveau connaissance génétique féline",
        "geneticien_2": "Origine des connaissances",
        "geneticien_3": "Gestion pelage impossible",
        "geneticien_4": "Communication concepts complexes",
        // NARRATEUR spécifiques
        "narrateur_1": "Idée événement narratif",
        "narrateur_2": "Gestion événement imprévu",
        "narrateur_3": "Équilibre événement narratif",
        "narrateur_4": "Gestion membre impacté",
        // PNJ spécifiques
        "pnj_1": "Organisation PNJ surpeuplé",
        "pnj_2": "Gestion doublons familles",
        "pnj_3": "Variété tâches PNJ",
        "pnj_4": "Lore développé empiétant",
        // VEILLEUR spécifiques
        "veilleur_1": "Planification transition saison",
        "veilleur_2": "Rédaction immersive",
        "veilleur_3": "Événement météo urgent",
        "veilleur_4": "Coordination Bâtisseurs",
        // BATISSEUR spécifiques
        "batisseur_1": "Modification territoriale incohérente",
        "batisseur_2": "Gestion cartes et territoires",
        "batisseur_3": "Lieu caché découvert",
        "batisseur_4": "Cohérence modifications territoriales",

        // GESTION
        "gest_pseudo": "Pseudo Discord",
        "gest_anciennete": "Ancienneté sur le serveur",
        "role_gestion_vise": "Rôle de gestion visé",
        "gest_age": "Âge",
        "gest_dispo": "Disponibilité hebdomadaire",
        "gest_experience": "Expérience gestion antérieure",
        "gest_experience_details": "Détails expérience antérieure",
        "gest_rigueur": "Rigueur tâches répétitives",
        "gest_q8": "Amélioration personnelle",
        "gest_q9": "Motivation rôle gestion",
        "gest_q10": "Différence gestion/staff",
        "gest_q11": "Gestion contestation décision",
        "gest_autonomie": "Confort travail autonome",
        "gest_q13": "Organisation tâches en suspens",
        "gest_notes_sup": "Notes supplémentaires",
        "gest_accept_rules": "Acceptation du règlement",
        "gest_accept_distinction": "Confirmé distinction gestion/staff",
        "gest_accept_sincerity": "Confirmé sincérité",
        // SCRIBE spécifiques
        "scribe_1": "Mise à jour fiches régulière",
        "scribe_2": "Contact joueur pas à jour",
        "scribe_3": "Suivi tableaux/listes",
        "scribe_4": "Gestion contestation PV",
        // INTENDANT spécifiques
        "intendant_1": "Gestion technique Discord",
        "intendant_2": "Archivage salon fiche",
        "intendant_3": "Priorisation demandes",
        "intendant_4": "Clarté architecture serveur",
        // PASSEUR spécifiques
        "passeur_1": "Suivi transfert Archives",
        "passeur_2": "Discrétion infos sensibles",
        "passeur_3": "Gestion deuil joueur",
        "passeur_4": "Suivi aucune fiche oubliée",

        // HAUT RANG
        "hr_pseudo": "Pseudo Discord",
        "experience_rp": "Expérience RP écrit",
        "ancien_hr": "Expérience haut rang antérieur",
        "ancien_hr_details": "Détails expérience antérieure",
        "hr_dispo": "Disponibilité hebdomadaire",
        "conflit_narratif": "Gestion conflits narratifs",
        "critique_staff": "Réaction critiques staff",
        "rang_vise": "Rang visé",
        "clan_vise": "Clan concerné",
        "nom_oc": "Nom complet du OC",
        "mots_cles_oc": "Mots clés caractère",
        "motivation_oc": "Motivation grande du OC",
        "faiblesse_oc": "Plus grande faiblesse du OC",
        "silence_ancetres": "Positionnement silence Clan des Étoiles",
        "hr_notes_sup": "Notes supplémentaires",
        "hr_accept_rules": "Acceptation du règlement",
        "hr_accept_sincerity": "Confirmé sincérité",
        // CHEF spécifiques
        "chef_1": "Relations autres clans",
        "chef_2": "Décision rapide sans lieutenant",
        "chef_3": "Gestion remise en question publique",
        "chef_4": "Vision pour les prochaines saisons",
        // LIEUTENANT spécifiques
        "lieutenant_1": "Rôle du lieutenant",
        "lieutenant_2": "Réaction décision désaccord",
        "lieutenant_3": "Organisation patrouilles clan affaibli",
        "lieutenant_4": "Chef absent, menace à la frontière",
        // GUERISSEUR spécifiques
        "guerisseur_1": "Perception rôle silence Clan des Étoiles",
        "guerisseur_2": "Choix entre deux blessés graves",
        "guerisseur_3": "Guerrier refuse soins",
        "guerisseur_4": "Connaissances herboristerie",
        // APPRENTI GUERISSEUR spécifiques
        "app_guerisseur_1": "Attirance médecine",
        "app_guerisseur_2": "Erreur dosage patient",
        "app_guerisseur_3": "Relation avec mentor",
        "app_guerisseur_4": "Code guérisseur compagnon/petits"
    };

    // ==========================================
    // SAUVEGARDE ET SYNC DES ACCÈS (localStorage)
    // ==========================================
    if (localStorage.getItem('session_staff_open') === null) {
        localStorage.setItem('session_staff_open', 'true'); 
    }
    if (localStorage.getItem('session_gestion_open') === null) {
        localStorage.setItem('session_gestion_open', 'false'); 
    }

    function rafraichirTouteLaPageIndex() {
        const staffEstOuvert = localStorage.getItem('session_staff_open') === 'true';
        const gestionEstOuvert = localStorage.getItem('session_gestion_open') === 'true';

        const badgeStaff = document.getElementById('badge-staff');
        const actionStaff = document.getElementById('action-staff');
        const btnToggleStaff = document.getElementById('toggle-staff-btn');

        const badgeGestion = document.getElementById('badge-gestion');
        const actionGestion = document.getElementById('action-gestion');
        const btnToggleGestion = document.getElementById('toggle-gestion-btn');

        // ---- CARTE STAFF ----
        if (badgeStaff && actionStaff) {
            if (staffEstOuvert) {
                badgeStaff.className = "badge open";
                badgeStaff.innerText = "Ouvert";
                actionStaff.innerHTML = `<a href="staff.html" class="btn btn-primary">Entrer dans le Staff</a>`;
            } else {
                badgeStaff.className = "badge closed";
                badgeStaff.innerText = "Clos";
                actionStaff.innerHTML = `<button class="btn btn-disabled" disabled>Portails Fermés</button>`;
            }
        }
        if (btnToggleStaff) {
            btnToggleStaff.innerText = staffEstOuvert ? "🔮 FERMER LE STAFF" : "✨ OUVRIR LE STAFF";
            btnToggleStaff.style.background = staffEstOuvert ? "#c0392b" : "#27ae60";
        }

        // ---- CARTE GESTION ----
        if (badgeGestion && actionGestion) {
            if (gestionEstOuvert) {
                badgeGestion.className = "badge open";
                badgeGestion.innerText = "Ouvert";
                actionGestion.innerHTML = `<a href="gestion.html" class="btn btn-primary">Entrer dans la Gestion</a>`;
            } else {
                badgeGestion.className = "badge closed";
                badgeGestion.innerText = "Clos";
                actionGestion.innerHTML = `<button class="btn btn-disabled" disabled>Portails Fermés</button>`;
            }
        }
        if (btnToggleGestion) {
            btnToggleGestion.innerText = gestionEstOuvert ? "🔮 FERMER LA GESTION" : "✨ OUVRIR LA GESTION";
            btnToggleGestion.style.background = gestionEstOuvert ? "#c0392b" : "#27ae60";
        }
    }

    // ACTIONS CLIC INTERRUPTEURS ARAXIA avec protection
    const toggleStaff = document.getElementById('toggle-staff-btn');
    if (toggleStaff) {
        toggleStaff.addEventListener('click', function () {
            // Protection simple : demander le pseudo d'Araxia
            const userInput = prompt("🔐 Code d'accès administrateur ?");
            if (userInput === ".araxia." || userInput === "araxia") {
                const actuel = localStorage.getItem('session_staff_open') === 'true';
                localStorage.setItem('session_staff_open', (!actuel).toString());
                rafraichirTouteLaPageIndex();
                // Feedback visuel
                this.style.animation = 'pulse 0.6s';
                setTimeout(() => this.style.animation = '', 600);
            } else if (userInput !== null) {
                alert("❌ Accès refusé. Les astres ne sont pas alignés pour toi.");
            }
        });
    }

    const toggleGestion = document.getElementById('toggle-gestion-btn');
    if (toggleGestion) {
        toggleGestion.addEventListener('click', function () {
            const userInput = prompt("🔐 Code d'accès administrateur ?");
            if (userInput === ".araxia." || userInput === "araxia") {
                const actuel = localStorage.getItem('session_gestion_open') === 'true';
                localStorage.setItem('session_gestion_open', (!actuel).toString());
                rafraichirTouteLaPageIndex();
                // Feedback visuel
                this.style.animation = 'pulse 0.6s';
                setTimeout(() => this.style.animation = '', 600);
            } else if (userInput !== null) {
                alert("❌ Accès refusé. Les astres ne sont pas alignés pour toi.");
            }
        });
    }

    rafraichirTouteLaPageIndex();

    // ==========================================
    // SECURITE DE VERROUILLAGE DES PAGES FORMULAIRES
    // ==========================================
    function verifierVerrouLocal(cleStockage, idFormulaire, nomAffichage) {
        const formulaire = document.getElementById(idFormulaire);
        if (!formulaire) return;

        const estOuvert = localStorage.getItem(cleStockage) === 'true';
        if (!estOuvert) {
            const sectionAlerte = document.createElement('div');
            sectionAlerte.className = "admin-glow-box";
            sectionAlerte.style.textAlign = "center";
            sectionAlerte.style.borderColor = "var(--closed-color)";
            sectionAlerte.style.marginBottom = "20px";
            sectionAlerte.innerHTML = `
                <h2 style="color: var(--closed-color); font-family: var(--font-title); font-size: 1.8rem; margin-bottom: 15px;">🔒 Session Interrompue</h2>
                <p>Le recrutement pour le pôle <strong>${nomAffichage}</strong> est actuellement verrouillé.</p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 10px;">Les astres ne sont pas alignés. Repassez lorsque les fondateurs auront ouvert les vagues.</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <a href="index.html" class="btn btn-primary" style="display: inline-block; width: auto; padding: 10px 30px;">Retour au Sanctuaire</a>
                </div>
            `;
            formulaire.parentNode.insertBefore(sectionAlerte, formulaire);
            formulaire.style.display = "none";
        }
    }

    verifierVerrouLocal('session_staff_open', 'staffForm', 'Staff');
    verifierVerrouLocal('session_gestion_open', 'gestionForm', 'Gestion');

    // ==========================================
    // GESTION DES SECTIONS SPÉCIALISÉES (AFFICHER/MASQUER)
    // ==========================================
    
    // Staff - Gestion des rôles
    const staffRoleCheckboxes = document.querySelectorAll('input[name="roles"]');
    staffRoleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const maxRoles = 2;
            const checkedCount = document.querySelectorAll('input[name="roles"]:checked').length;
            
            if (checkedCount > maxRoles) {
                this.checked = false;
                alert(`⚠️ Vous ne pouvez sélectionner que ${maxRoles} rôles maximum.`);
                return;
            }

            // Afficher/masquer les sections spécialisées
            const roles = ['helper', 'correcteur', 'geneticien', 'narrateur', 'pnj', 'veilleur', 'batisseur'];
            roles.forEach(role => {
                const section = document.getElementById(`section-${role}`);
                if (section) {
                    const shouldShow = document.querySelector(`input[name="roles"][value="${role}"]:checked`) !== null;
                    section.style.display = shouldShow ? 'block' : 'none';
                }
            });
        });
    });

    // Gestion - Gestion du rôle visé
    const gestionRoleSelect = document.getElementById('role_gestion_vise');
    if (gestionRoleSelect) {
        gestionRoleSelect.addEventListener('change', function() {
            const roles = ['scribe', 'intendant', 'passeur'];
            roles.forEach(role => {
                const section = document.getElementById(`section-${role}`);
                if (section) {
                    section.style.display = (this.value === role.charAt(0).toUpperCase() + role.slice(1)) ? 'block' : 'none';
                }
            });
        });
    }

    // Haut Rang - Gestion du rang visé
    const hautRangSelect = document.getElementById('rang_vise');
    if (hautRangSelect) {
        hautRangSelect.addEventListener('change', function() {
            const rangMap = {
                'Chef': 'chef',
                'Lieutenant': 'lieutenant',
                'Guerisseur': 'guerisseur',
                'Apprenti-Guerisseur': 'apprenti-guerisseur'
            };
            
            Object.values(rangMap).forEach(rang => {
                const section = document.getElementById(`section-${rang}`);
                if (section) {
                    section.style.display = 'none';
                }
            });

            if (rangMap[this.value]) {
                const sectionToShow = document.getElementById(`section-${rangMap[this.value]}`);
                if (sectionToShow) {
                    sectionToShow.style.display = 'block';
                }
            }
        });
    }

    // ==========================================
    // GESTION DES WEBHOOKS ET ENVOI DISCORD
    // ==========================================

    /**
     * Valide les champs obligatoires d'un formulaire
     */
    function validerFormulaire(form) {
        const errors = [];
        
        // Vérifier tous les champs required
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (field.type === 'checkbox') {
                if (!field.checked) {
                    errors.push(`⚠️ ${field.closest('label').textContent.trim()}`);
                }
            } else if (!field.value.trim()) {
                const label = form.querySelector(`label[for="${field.id}"]`);
                const labelText = label ? label.textContent.replace(' *', '') : field.name;
                errors.push(`⚠️ ${labelText} est obligatoire`);
            }
        });

        return errors;
    }

    /**
     * Affiche les erreurs de validation
     */
    function afficherErreurs(errors, feedbackEl) {
        feedbackEl.className = 'feedback-message text-error';
        feedbackEl.innerHTML = '<strong>❌ Veuillez corriger les erreurs :</strong><ul style="margin: 10px 0; text-align: left;">' + 
                                errors.map(e => `<li>${e}</li>`).join('') + 
                                '</ul>';
        feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Demande une confirmation avant envoi
     */
    function demanderConfirmation(pseudo, titre) {
        return new Promise((resolve) => {
            const confirmed = confirm(`✋ Confirmez-vous l'envoi de votre candidature ?\n\nPseudo: ${pseudo}\n\n(Cette action ne peut pas être annulée)`);
            resolve(confirmed);
        });
    }

    // ==========================================
    // GESTION DES WEBHOOKS ET ENVOI DISCORD
    // ==========================================

    /**
     * Divise un message long en plusieurs embeds (max 4096 chars par embed)
     */
    function diviserEnEmbeds(fields, couleur = 0xDFB15B) {
        const embeds = [];
        let currentEmbed = {
            color: couleur,
            fields: []
        };
        let currentLength = 0;

        fields.forEach(field => {
            const fieldLength = (field.name || '').length + (field.value || '').length + 50;
            
            if (currentLength + fieldLength > 4096) {
                embeds.push(currentEmbed);
                currentEmbed = { color: couleur, fields: [] };
                currentLength = 0;
            }
            
            currentEmbed.fields.push(field);
            currentLength += fieldLength;
        });

        if (currentEmbed.fields.length > 0) {
            embeds.push(currentEmbed);
        }

        return embeds;
    }

    /**
 * Envoie les données du formulaire proprement à Formspree ou FormSubmit
 */
async function envoyerViaWebhook(formData, externalServiceUrl, titre) {
    try {
        const dataToSend = {};

        // On traduit les clés techniques en beaux labels lisibles dans tes e-mails
        for (const [key, value] of Object.entries(formData)) {
            if (!value || String(value).trim() === '') continue;

            const label = questionLabels[key] || key;
            dataToSend[label] = value;
        }

        // On ajoute un titre au tableau pour savoir de quel formulaire ça vient
        dataToSend["Type de Formulaire"] = titre;
        dataToSend["Date d'envoi"] = new Date().toLocaleString("fr-FR");

        // Envoi de la requête au site externe
        const response = await fetch(externalServiceUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Erreur serveur: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de l\'envoi externe:', error);
        throw error;
    }
}

    // ==========================================
    // GESTION DES FORMULAIRES
    // ==========================================

    // --- FORMULAIRE STAFF ---
    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const feedbackEl = document.getElementById('formFeedback');
            
            // Validation
            const errors = validerFormulaire(this);
            if (errors.length > 0) {
                afficherErreurs(errors, feedbackEl);
                submitBtn.disabled = false;
                return;
            }

            // Demander confirmation
            const pseudoField = this.querySelector('input[name="pseudo"]');
            const pseudo = pseudoField ? pseudoField.value : 'Candidat';
            const confirmed = await demanderConfirmation(pseudo, 'Candidature Staff');
            
            if (!confirmed) {
                feedbackEl.className = 'feedback-message text-error';
                feedbackEl.textContent = '❌ Candidature annulée.';
                return;
            }

            submitBtn.disabled = true;
            feedbackEl.className = 'feedback-message';
            feedbackEl.textContent = '⏳ Envoi en cours...';

            try {
                const formData = new FormData(this);
                const data = {};

                // Collecter les données
                for (const [key, value] of formData.entries()) {
                    if (key === 'roles') {
                        // Gérer les rôles multiples
                        if (!data.roles) data.roles = [];
                        data.roles.push(value);
                    } else if (key !== 'accept_rules' && key !== 'accept_sincerity') {
                        data[key] = value;
                    } else {
                        data[key] = value;
                    }
                }

                // Convertir array roles en string
                if (Array.isArray(data.roles)) {
                    data.roles = data.roles.join(', ');
                }

                // Envoyer à Discord
                await envoyerViaWebhook(data, FORMSPREE_STAFF, 'Candidature Staff');

                feedbackEl.className = 'feedback-message text-success';
                feedbackEl.textContent = '✅ Candidature envoyée avec succès ! Merci de votre intérêt.';
                staffForm.reset();

            } catch (error) {
                feedbackEl.className = 'feedback-message text-error';
                feedbackEl.textContent = `❌ Erreur: ${error.message}`;
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // --- FORMULAIRE GESTION ---
    const gestionForm = document.getElementById('gestionForm');
    if (gestionForm) {
        gestionForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('gestSubmitBtn');
            const feedbackEl = document.getElementById('gestFormFeedback');
            
            // Validation
            const errors = validerFormulaire(this);
            if (errors.length > 0) {
                afficherErreurs(errors, feedbackEl);
                submitBtn.disabled = false;
                return;
            }

            // Demander confirmation
            const pseudoField = this.querySelector('input[name="gest_pseudo"]');
            const pseudo = pseudoField ? pseudoField.value : 'Candidat';
            const confirmed = await demanderConfirmation(pseudo, 'Candidature Gestion');
            
            if (!confirmed) {
                feedbackEl.className = 'feedback-message text-error';
                feedbackEl.textContent = '❌ Candidature annulée.';
                return;
            }

            submitBtn.disabled = true;
            feedbackEl.className = 'feedback-message';
            feedbackEl.textContent = '⏳ Envoi en cours...';

            try {
                const formData = new FormData(this);
                const data = {};

                for (const [key, value] of formData.entries()) {
                    data[key] = value;
                }

                await envoyerViaWebhook(data, FORMSPREE_GESTION, 'Candidature Gestion');

                feedbackEl.className = 'feedback-message text-success';
                feedbackEl.textContent = '✅ Candidature envoyée avec succès !';
                gestionForm.reset();

            } catch (error) {
                feedbackEl.className = 'feedback-message text-error';
                feedbackEl.textContent = `❌ Erreur: ${error.message}`;
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // --- FORMULAIRE HAUT RANG ---
    const hautRangForm = document.getElementById('hautRangForm');
    if (hautRangForm) {
        hautRangForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('hrSubmitBtn');
            const feedbackEl = document.getElementById('hrFormFeedback');
            
            // Validation
            const errors = validerFormulaire(this);
            if (errors.length > 0) {
                afficherErreurs(errors, feedbackEl);
                submitBtn.disabled = false;
                return;
            }

            // Demander confirmation
            const pseudoField = this.querySelector('input[name="hr_pseudo"]');
            const pseudo = pseudoField ? pseudoField.value : 'Candidat';
            const confirmed = await demanderConfirmation(pseudo, 'Candidature Haut Rang');
            
            if (!confirmed) {
                feedbackEl.className = 'feedback-message text-error';
                feedbackEl.textContent = '❌ Candidature annulée.';
                return;
            }

            submitBtn.disabled = true;
            feedbackEl.className = 'feedback-message';
            feedbackEl.textContent = '⏳ Envoi en cours...';

            try {
                const formData = new FormData(this);
                const data = {};

                for (const [key, value] of formData.entries()) {
                    data[key] = value;
                }

                await envoyerViaWebhook(data, FORMSPREE_HAUT_RANG, 'Candidature Haut Rang');

                feedbackEl.className = 'feedback-message text-success';
                feedbackEl.textContent = '✅ Dossier envoyé avec succès ! Bonne chance !';
                hautRangForm.reset();

            } catch (error) {
                feedbackEl.className = 'feedback-message text-error';
                feedbackEl.textContent = `❌ Erreur: ${error.message}`;
            } finally {
                submitBtn.disabled = false;
            }
        });

        // Auto-sauvegarder les brouillons
    setInterval(() => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            localStorage.setItem(`draft_${form.id}`, JSON.stringify(data));
        });
    }, 30000); // Chaque 30 secondes

    // Restaurer les brouillons au chargement
    document.querySelectorAll('form').forEach(form => {
        const draft = localStorage.getItem(`draft_${form.id}`);
        if (draft) {
            const data = JSON.parse(draft);
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) field.value = data[key];
            });
        }
    });
}
});