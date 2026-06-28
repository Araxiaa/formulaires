// =========================================================
// candidature.js — Page de candidature (Staff + HR + OC)
// =========================================================

let staffPostes = [];
let hrPostes    = [];

// -----------------------------------------------
// Questions spécifiques par rôle staff
// -----------------------------------------------
const ROLE_META = {
  '1': { label: 'Parrain / Marraine',    pole: 'guide'     },
  '2': { label: 'Régisseur·se fiche',   pole: 'guide'     },
  '3': { label: 'Généticien·ne',         pole: 'guide'     },
  '4': { label: 'Animateur·rice',        pole: 'guide'     },
  '5': { label: 'Gestion RP',            pole: 'narration' },
  '6': { label: 'Plume',                 pole: 'narration' },
  '7': { label: 'Gestion PNJ',           pole: 'narration' },
  '8': { label: 'Bâtisseur·se',          pole: 'batisseur' },
};

const ROLE_QUESTIONS = {
  '1': [
    {
      id: 'accueil',
      label: "Qu'est-ce qui t'attire dans l'accueil et l'accompagnement des membres, des plus nouveaux aux plus anciens ?",
      rows: 4, min: 40,
    },
    {
      id: 'conflit',
      label: "Comment gérerais-tu un membre frustré, en désaccord avec une décision staff ou en conflit avec un autre membre de la communauté ?",
      rows: 4, min: 50,
    },
    {
      id: 'tickets',
      label: "As-tu de l'expérience dans la gestion de tickets, la modération ou le support communautaire ? Décris les situations que tu as rencontrées et comment tu les as traitées.",
      rows: 4, min: 30,
      hint: "Si tu n'as pas d'expérience staff, décris comment tu procéderais face à un ticket difficile.",
    },
  ],
  '2': [
    {
      id: 'regles',
      label: "Décris ta connaissance des règles de création de personnage du serveur : races autorisées, règles de pelage, noms, rangs de départ…",
      rows: 4, min: 50,
    },
    {
      id: 'lore_fiche',
      label: "Comment réagirais-tu face à une fiche présentant une incohérence lore ou ne respectant pas les règles du serveur ? Décris ta démarche, du signalement à la correction.",
      rows: 4, min: 50,
    },
    {
      id: 'rigueur',
      label: "La correction de fiches demande de la rigueur et de la bienveillance. Comment gardes-tu le fil entre l'ensemble des fiches en cours de validation ? Qu'est-ce qui te rend fiable dans ce type de travail ?",
      rows: 3, min: 30,
    },
  ],
  '3': [
    {
      id: 'genetique',
      label: "Décris tes connaissances en génétique féline : transmission des couleurs de robe, locus (B, O, D, A…), patterns tabby, traits spécifiques de race. Sois aussi précis·e que possible.",
      rows: 5, min: 80,
      hint: "Une bonne maîtrise du Codex Génétique du serveur est indispensable pour ce poste.",
    },
    {
      id: 'codex',
      label: "As-tu déjà étudié ou utilisé le Codex Génétique du serveur ? Y a-t-il des points que tu maîtrises moins bien et que tu souhaiterais approfondir ?",
      rows: 3, min: 30,
    },
    {
      id: 'suivi',
      label: "Comment t'organiserais-tu pour documenter et suivre les lignées génétiques du serveur, en t'assurant de la cohérence des naissances au fil du temps ?",
      rows: 4, min: 40,
    },
  ],
  '4': [
    {
      id: 'idees_anim',
      label: "Quelles idées d'animations Hors-RP proposerais-tu pour dynamiser la communauté ? Décris au moins deux concepts concrets (type d'événement, format, fréquence envisagée).",
      rows: 5, min: 60,
    },
    {
      id: 'experience_anim',
      label: "As-tu de l'expérience dans l'organisation d'événements communautaires, que ce soit sur Discord ou ailleurs ? Décris ce que tu as mis en place et comment tu t'y es pris·e.",
      rows: 4, min: 30,
      hint: "Si tu n'as pas d'expérience directe, explique comment tu approcherais l'organisation de ton premier événement.",
    },
    {
      id: 'accessibilite',
      label: "Comment t'assures-tu que tes animations restent accessibles, inclusives et agréables pour tous les profils de membres (nouveaux arrivants, membres discrets, habitués) ?",
      rows: 3, min: 30,
    },
  ],
  '5': [
    {
      id: 'rp_experience',
      label: "Décris ton expérience en roleplay écrit : depuis combien de temps pratiques-tu, sur quels types de serveurs ou communautés, quel est ton rapport à l'écriture narrative ?",
      rows: 4, min: 50,
    },
    {
      id: 'aide_oc',
      label: "Un membre te contacte en ticket : il ne sait pas comment faire avancer l'histoire de son personnage, qui tourne en rond depuis plusieurs semaines. Comment l'aiderais-tu concrètement ?",
      rows: 5, min: 60,
    },
    {
      id: 'exemple_intrigue',
      label: "Propose un exemple d'intrigue RP — impliquant un ou plusieurs personnages — que tu pourrais soumettre à un membre pour enrichir son histoire au sein du serveur.",
      rows: 5, min: 60,
    },
  ],
  '6': [
    {
      id: 'extrait_plume',
      label: "Soumets un extrait de texte narratif représentatif de ton style d'écriture : résumé d'événement, description de lieu, fragment de lore, ou tout autre texte à visée officielle.",
      rows: 8, min: 150,
      hint: "Cet extrait est le principal critère d'évaluation pour le poste de Plume.",
    },
    {
      id: 'idees_events',
      label: "Quelles idées d'événements narratifs proposerais-tu pour le serveur (quêtes, catastrophes naturelles, intrigues inter-clans, révélations lore…) ? Décris au moins une idée développée.",
      rows: 5, min: 60,
    },
    {
      id: 'coherence_lore',
      label: "Comment t'assures-tu de la cohérence lore lorsque tu rédiges du contenu officiel ? Quels réflexes as-tu pour vérifier qu'un texte respecte l'univers établi ?",
      rows: 3, min: 40,
    },
  ],
  '7': [
    {
      id: 'role_pnj',
      label: "Comment imagines-tu le rôle des PNJ dans l'enrichissement de l'expérience RP du serveur ? Quelle place leur donnes-tu par rapport aux personnages joueurs ?",
      rows: 4, min: 40,
    },
    {
      id: 'concept_pnj',
      label: "Propose un concept de PNJ original qui pourrait s'intégrer dans l'univers du serveur : nom, clan, personnalité, rôle narratif, comment il interagirait avec les membres.",
      rows: 6, min: 80,
    },
    {
      id: 'gestion_parallele',
      label: "Comment gérerais-tu un PNJ impliqué dans plusieurs fils RP simultanément, avec des membres différents, en veillant à la cohérence de ses actions et de sa personnalité ?",
      rows: 4, min: 40,
    },
  ],
  '8': [
    {
      id: 'discord_mastery',
      label: "Décris ta maîtrise de la gestion des salons Discord : organisation des catégories, permissions par rôle, fils de discussion, paramétrage avancé. As-tu déjà administré un serveur ?",
      rows: 4, min: 40,
    },
    {
      id: 'evenement_geo',
      label: "Un incendie ravage une partie du territoire du Clan du Tonnerre. Comment procéderais-tu pour le modéliser dans les salons RP du serveur, étape par étape ?",
      rows: 5, min: 60,
      hint: "Pense à l'organisation des salons, aux descriptions, aux restrictions temporaires d'accès, aux notifications…",
    },
    {
      id: 'idees_lieux',
      label: "As-tu des idées de nouveaux lieux, de modifications du territoire ou d'évolutions saisonnières qui enrichiraient l'expérience RP ? Décris au moins une idée concrète.",
      rows: 4, min: 50,
    },
  ],
};


// -----------------------------------------------
// Questions spécifiques par type de rang HR
// (Neutres — aucune référence au lore du serveur)
// -----------------------------------------------
const RANG_QUESTIONS = {
  meneur: [
    {
      id: 'conflit_interne',
      label: "Un conflit éclate entre deux membres importants de ton clan. Les tensions montent, les prises de position se durcissent et la cohésion du groupe en pâtit. Décris comment ton personnage aborde la situation en tant que meneur·se : sa démarche, ses paroles, les décisions qu'il/elle prend.",
      rows: 6, min: 100,
    },
    {
      id: 'decision_solitaire',
      label: "Ton clan est confronté à une décision grave qui ne souffre pas d'être retardée. Certains de tes conseillers sont absents ou divisés. Ton personnage doit trancher seul·e. Comment vit-il/elle ce moment ? Quels sont ses doutes, ses certitudes, et comment assume-t-il/elle la responsabilité de ce choix ?",
      rows: 5, min: 80,
    },
    {
      id: 'incarnation_quotidienne',
      label: "Comment imagines-tu la présence quotidienne de ton meneur·se dans la vie du clan ? Dans quels types de scènes, d'interactions ou de moments te voit-on régulièrement ? Décris ta vision de ce que signifie incarner ce rang au jour le jour.",
      rows: 4, min: 60,
    },
  ],
  lieutenant: [
    {
      id: 'prise_en_charge',
      label: "Ton/ta meneur·se est absent·e et une situation urgente survient qui nécessite une décision immédiate. Comment ton lieutenant·e prend-il/elle les choses en main ? Décris sa façon d'agir, de communiquer et d'assumer ce rôle de relais.",
      rows: 5, min: 80,
    },
    {
      id: 'mediation',
      label: "Un membre du clan vient te voir en privé pour te confier une difficulté personnelle qui commence à affecter son comportement lors des activités collectives. Comment ton lieutenant·e reçoit-il/elle cette confidence et quelle démarche adopte-t-il/elle ?",
      rows: 5, min: 80,
    },
    {
      id: 'vision_du_rang',
      label: "Au-delà des missions concrètes, qu'est-ce que le rang de lieutenant·e représente pour ton personnage ? Quel lien imagines-tu entre lui/elle et le reste du clan, et comment se positionne-t-il/elle entre le meneur·se et les autres membres ?",
      rows: 4, min: 60,
    },
  ],
  guerisseur: [
    {
      id: 'scene_de_soin',
      label: "Un membre du clan rentre d'une patrouille dans un état préoccupant — blessure visible, épuisement marqué ou comportement inhabituel. Décris la scène de prise en charge de ton guérisseur·se : comment il/elle évalue la situation, agit et communique avec le patient et les personnes présentes.",
      rows: 6, min: 100,
    },
    {
      id: 'dilemme_secret',
      label: "Lors d'une consultation, un patient te révèle quelque chose de grave en te demandant expressément le secret. Cette information pourrait pourtant avoir des répercussions sur d'autres membres du clan. Comment ton personnage navigue-t-il entre la confidentialité et sa responsabilité envers le groupe ?",
      rows: 5, min: 80,
    },
    {
      id: 'place_dans_le_clan',
      label: "Le guérisseur·se occupe une position singulière — soignant·e, confident·e, gardien·ne d'un savoir. Comment ton personnage s'intègre-t-il/elle dans la vie sociale et relationnelle du clan, au-delà de sa seule fonction médicale ?",
      rows: 4, min: 60,
    },
  ],
  apprenti: [
    {
      id: 'premier_defi',
      label: "Tu es seul·e pour quelques instants quand un camarade arrive avec une blessure que tu n'as encore jamais traitée seul·e. Ton/ta mentor·e n'est pas là. Décris comment ton apprenti·e réagit : ses gestes, ses doutes, les décisions qu'il/elle prend et comment il/elle gère la situation.",
      rows: 5, min: 80,
    },
    {
      id: 'relation_mentor',
      label: "Décris la dynamique que tu imagines entre ton apprenti·e et son guérisseur·se mentor. Comment ton personnage apprend-il/elle ? Quels sont ses questionnements, ses maladresses, ses élans ? Y a-t-il de la complexité dans cette relation, de l'admiration, des tensions ?",
      rows: 5, min: 80,
    },
    {
      id: 'vocation',
      label: "Qu'est-ce qui a conduit ce personnage vers cette voie plutôt qu'une autre ? Illustre cette inclination à travers une courte scène ou un moment de réflexion intérieure — sans référence au lore du serveur, uniquement ce que ressent et pense ce personnage.",
      rows: 5, min: 60,
    },
  ],
};

// Détecter le type de rang depuis son nom
function getRangType(rangNom) {
  const n = rangNom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('apprenti'))                         return 'apprenti';
  if (n.includes('guerisseur') || n.includes('medecin')) return 'guerisseur';
  if (n.includes('lieutenant') || n.includes('deputy')) return 'lieutenant';
  if (n.includes('meneur') || n.includes('chef') || n.includes('leader')) return 'meneur';
  return null;
}

// -----------------------------------------------
// Init
// -----------------------------------------------
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
    const opt  = document.createElement('option');
    opt.value  = r.id;
    opt.textContent = `${r.rang} — ${clan ? clan.nom : r.clan}`;
    sel.appendChild(opt);
  });
  if (!hrPostes.length) {
    sel.innerHTML = '<option value="">Aucun rang disponible pour le moment</option>';
  }
}

// Déclenché quand le rang est sélectionné
function onRangChange() {
  const sel     = document.getElementById('hr-poste');
  const rangId  = sel.value;
  const container = document.getElementById('hr-specific-container');
  const rpTitle   = document.getElementById('hr-rp-title');
  const icGroup   = document.getElementById('hr-moti-ic-group');
  const extGroup  = document.getElementById('hr-extrait-group');
  const submitWrap = document.getElementById('hr-submit-wrap');

  if (!rangId) {
    container.innerHTML = '';
    [rpTitle, icGroup, extGroup, submitWrap].forEach(el => el.style.display = 'none');
    return;
  }

  const rang     = hrPostes.find(r => r.id == rangId);
  const rangType = rang ? getRangType(rang.rang) : null;
  const qs       = rangType ? RANG_QUESTIONS[rangType] : null;

  if (!qs) {
    container.innerHTML = '<div class="no-role-hint">Les questions spécifiques à ce rang ne sont pas encore configurées.</div>';
  } else {
    const clan     = rang ? CLANS.find(c => c.id === rang.clan) : null;
    const clanCls  = clan ? clan.id : '';
    container.innerHTML = `
      <div class="role-specific-block">
        <div class="role-block-header">
          <span class="role-block-dot ${clanCls}" style="background:var(--${clanCls}, var(--accent))"></span>
          <span class="role-block-title">Mises en situation — ${rang.rang}</span>
        </div>
        ${qs.map(q => `
          <div class="form-group">
            <label class="form-label" for="hr-sq-${q.id}">${q.label}</label>
            <textarea id="hr-sq-${q.id}" rows="${q.rows || 5}"
              data-min="${q.min || 60}" placeholder="Ta réponse…"></textarea>
            ${q.hint ? `<p class="form-hint">${q.hint}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Afficher la suite du formulaire
  [rpTitle, icGroup, extGroup, submitWrap].forEach(el => el.style.display = '');
}

// -----------------------------------------------
// Switchers
// -----------------------------------------------
function switchTab(tab, btn) {
  document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.form-view').forEach(v => v.classList.remove('active'));
  document.getElementById('fv-' + tab).classList.add('active');
}

function switchOCTab(tab, btn) {
  document.querySelectorAll('.oc-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.oc-subview').forEach(v => v.classList.remove('active'));
  document.getElementById(tab + '-view').classList.add('active');
}

// -----------------------------------------------
// Gestion des rôles staff — sélection dynamique
// -----------------------------------------------
function onRole1Change() {
  rebuildRole2Options();
  renderSpecificQuestions();
}

function onRole2Change() {
  renderSpecificQuestions();
}

function rebuildRole2Options() {
  const r1  = document.getElementById('s-role-1').value;
  const sel = document.getElementById('s-role-2');
  const cur = sel.value;

  sel.innerHTML = '<option value="">— Aucun second rôle —</option>';
  if (!r1) return;

  const groups = [
    { label: '── Pôle Guide ──',     roles: ['1','2','3','4'] },
    { label: '── Pôle Narration ──', roles: ['5','6','7']     },
    { label: '── Pôle Bâtisseur ──', roles: ['8']             },
  ];
  groups.forEach(g => {
    const available = g.roles.filter(id => id !== r1);
    if (!available.length) return;
    const og = document.createElement('optgroup');
    og.label = g.label;
    available.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = ROLE_META[id].label;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });

  // Restaurer la sélection précédente si encore valide
  if (cur && cur !== r1) sel.value = cur;
}

function renderSpecificQuestions() {
  const r1  = document.getElementById('s-role-1').value;
  const r2  = document.getElementById('s-role-2').value;
  const box = document.getElementById('specific-questions-container');

  if (!r1) {
    box.innerHTML = '<div class="no-role-hint">Sélectionne un rôle ci-dessus pour voir les questions spécifiques.</div>';
    return;
  }

  let html = '';
  html += buildRoleBlock(r1, 1);
  if (r2 && r2 !== r1) html += buildRoleBlock(r2, 2);
  box.innerHTML = html;
}

function buildRoleBlock(roleId, slot) {
  const meta = ROLE_META[roleId];
  const qs   = ROLE_QUESTIONS[roleId] || [];
  if (!meta || !qs.length) return '';

  const slotLabel = slot === 1 ? '1er choix' : '2ème choix';

  return `
    <div class="role-specific-block" id="role-block-${slot}">
      <div class="role-block-header">
        <img src="./img/pole-${meta.pole}.png" alt="${meta.label}" style="width:22px;height:22px;object-fit:contain;">
        <span class="role-block-title">${meta.label}</span>
        <span class="role-slot-badge">${slotLabel}</span>
      </div>
      ${qs.map(q => `
        <div class="form-group">
          <label class="form-label" for="rq-${slot}-${q.id}">${q.label}</label>
          <textarea id="rq-${slot}-${q.id}" rows="${q.rows || 4}"
            data-min="${q.min || 20}" placeholder="Ta réponse…"></textarea>
          ${q.hint ? `<p class="form-hint">${q.hint}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// -----------------------------------------------
// Pré-remplissage depuis URL
// -----------------------------------------------
function prefillFromUrl() {
  const { type, id } = getUrlParams();
  if (!type) return;

  if (type === 'staff') {
    switchTab('staff', document.querySelector('[data-tab="staff"]'));
    if (id) {
      document.getElementById('s-role-1').value = id;
      rebuildRole2Options();
      renderSpecificQuestions();
    }
  } else if (type === 'hr') {
    switchTab('hr', document.querySelector('[data-tab="hr"]'));
    const rang = hrPostes.find(r => r.id == id);
    if (!rang) return;
    setTimeout(() => { document.getElementById('hr-poste').value = rang.id; }, 10);
    const clan = CLANS.find(c => c.id === rang.clan);
    showBanner('hr', `${rang.rang} — ${clan ? clan.nom : ''}`);
  } else if (type === 'oc3' || type === 'oc4') {
    switchTab('oc', document.querySelector('[data-tab="oc"]'));
    const btn = document.querySelector(`.oc-tab.${type}`);
    if (btn) switchOCTab(type, btn);
  }
}

function showBanner(type, label) {
  const b = document.getElementById(`banner-${type}`);
  if (!b) return;
  b.textContent = `Poste sélectionné : ${label}`;
  b.style.display = 'block';
}

// -----------------------------------------------
// Collecte des réponses spécifiques
// -----------------------------------------------
function collectSpecificAnswers(roleId, slot) {
  const qs = ROLE_QUESTIONS[roleId] || [];
  const answers = {};
  qs.forEach(q => {
    const el = document.getElementById(`rq-${slot}-${q.id}`);
    if (el) answers[q.id] = el.value.trim();
  });
  return answers;
}

function validateSpecificAnswers(roleId, slot) {
  const qs = ROLE_QUESTIONS[roleId] || [];
  let valid = true;
  qs.forEach(q => {
    const el = document.getElementById(`rq-${slot}-${q.id}`);
    if (!el) return;
    const empty = !el.value.trim() || el.value.trim().length < (q.min || 20);
    el.classList.toggle('field-error', empty);
    if (empty) valid = false;
  });
  return valid;
}

// -----------------------------------------------
// Soumission Staff
// -----------------------------------------------
async function submitStaff() {
  const r1     = document.getElementById('s-role-1').value;
  const r2     = document.getElementById('s-role-2').value;
  const pseudo = document.getElementById('s-pseudo').value.trim();
  const ancien = document.getElementById('s-anciennete').value.trim();
  const presen = document.getElementById('s-presentation').value.trim();
  const dispo  = document.getElementById('s-dispo').value.trim();
  const xp     = document.getElementById('s-experience').value.trim();
  const qualit = document.getElementById('s-qualites').value.trim();

  // Validation champs généraux
  const generalValid = validateFields([
    { el: document.getElementById('s-pseudo'),       min: 2  },
    { el: document.getElementById('s-anciennete'),   min: 1  },
    { el: document.getElementById('s-presentation'), min: 60 },
    { el: document.getElementById('s-dispo'),        min: 3  },
    { el: document.getElementById('s-qualites'),     min: 30 },
    { el: document.getElementById('s-role-1'),       min: 1  },
  ]);

  // Validation questions spécifiques
  let specificValid = true;
  if (r1) specificValid = validateSpecificAnswers(r1, 1) && specificValid;
  if (r2) specificValid = validateSpecificAnswers(r2, 2) && specificValid;

  if (!generalValid || !specificValid) {
    showToast('Merci de remplir tous les champs obligatoires.', 'error');
    // Scroll vers premier champ en erreur
    const first = document.querySelector('.field-error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn  = document.querySelector('#fv-staff .btn-primary');
  const code = generateCode();
  setLoading(btn, true, 'Envoi en cours…');

  // Construction des rôles visés
  const rolesVises = [{ id: r1, nom: ROLE_META[r1]?.label, pole: ROLE_META[r1]?.pole }];
  if (r2 && r2 !== r1) rolesVises.push({ id: r2, nom: ROLE_META[r2]?.label, pole: ROLE_META[r2]?.pole });

  const donnees = {
    pseudo_discord:        pseudo,
    anciennete_serveur:    ancien,
    presentation:          presen,
    disponibilites:        dispo,
    experience_staff:      xp,
    qualites:              qualit,
    roles_vises:           rolesVises,
    reponses_specifiques: {
      [r1]: collectSpecificAnswers(r1, 1),
      ...(r2 && r2 !== r1 ? { [r2]: collectSpecificAnswers(r2, 2) } : {}),
    },
  };

  const { error } = await sb.from('candidatures').insert({
    code_suivi:     code,
    type:           'staff',
    poste_id:       null,       // plusieurs rôles possibles → stocké dans donnees
    pseudo_discord: pseudo,
    statut:         'recue',
    donnees,
  });

  if (error) { setLoading(btn, false); showToast('Erreur lors de l\'envoi. Réessaie.', 'error'); return; }

  // Discord embed
  const embed = buildStaffEmbed(code, pseudo, rolesVises);
  await sendDiscordWebhook(CONFIG.discord.webhookStaff, { embeds: [embed] });

  setLoading(btn, false);
  if (window.clearDraft) window.clearDraft('form-staff');
  showSuccess(code);
}

function buildStaffEmbed(code, pseudo, rolesVises) {
  const rolesStr = rolesVises.map(r => r.nom).join(' + ');
  return {
    title: `📋 Candidature Staff — ${rolesStr}`,
    color: 0x2DB882,
    fields: [
      { name: 'Code de suivi',  value: `\`${code}\``, inline: true },
      { name: 'Pseudo Discord', value: pseudo,         inline: true },
      { name: 'Rôle(s) visé(s)', value: rolesVises.map(r => `**${r.nom}** (${POLE_LABELS[r.pole] || r.pole})`).join('\n'), inline: false },
    ],
    footer: { text: `Le Prix de la Trêve · ${new Date().toLocaleDateString('fr-FR')}` },
    timestamp: new Date().toISOString(),
  };
}

// -----------------------------------------------
// Soumission Hauts Rangs
// -----------------------------------------------



// -----------------------------------------------
// Soumission Hauts Rangs
// -----------------------------------------------
async function submitHR() {
  const posteId     = document.getElementById('hr-poste').value;
  const pseudo      = document.getElementById('hr-pseudo').value.trim();
  const oc          = document.getElementById('hr-oc').value.trim();
  const rangActuel  = document.getElementById('hr-rang-actuel').value.trim();
  const ancServeur  = document.getElementById('hr-anciennete-serveur').value.trim();
  const ancOc       = document.getElementById('hr-anciennete-oc').value.trim();
  const activite    = document.getElementById('hr-activite').value.trim();
  const motiOoc     = document.getElementById('hr-moti-ooc').value.trim();
  const motiIc      = document.getElementById('hr-moti-ic').value.trim();
  const extrait     = document.getElementById('hr-extrait').value.trim();

  // Validation champs généraux
  const generalValid = validateFields([
    { el: document.getElementById('hr-poste'),              min: 1   },
    { el: document.getElementById('hr-pseudo'),             min: 2   },
    { el: document.getElementById('hr-oc'),                 min: 2   },
    { el: document.getElementById('hr-rang-actuel'),        min: 2   },
    { el: document.getElementById('hr-anciennete-serveur'), min: 1   },
    { el: document.getElementById('hr-anciennete-oc'),      min: 1   },
    { el: document.getElementById('hr-activite'),           min: 30  },
    { el: document.getElementById('hr-moti-ooc'),           min: 50  },
    { el: document.getElementById('hr-moti-ic'),            min: 20  },
    { el: document.getElementById('hr-extrait'),            min: 100 },
  ]);

  // Validation questions spécifiques
  const rang     = hrPostes.find(r => r.id == posteId);
  const rangType = rang ? getRangType(rang.rang) : null;
  const qs       = rangType ? RANG_QUESTIONS[rangType] : [];
  let specificValid = true;
  qs.forEach(q => {
    const el = document.getElementById(`hr-sq-${q.id}`);
    if (!el) return;
    const empty = !el.value.trim() || el.value.trim().length < (q.min || 60);
    el.classList.toggle('field-error', empty);
    if (empty) specificValid = false;
  });

  if (!generalValid || !specificValid) {
    showToast('Merci de remplir tous les champs obligatoires.', 'error');
    const first = document.querySelector('#fv-hr .field-error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn  = document.querySelector('#hr-submit-wrap .btn-primary');
  const code = generateCode();
  setLoading(btn, true, 'Envoi en cours…');

  // Collecte des réponses spécifiques
  const reponsesSpecifiques = {};
  qs.forEach(q => {
    const el = document.getElementById(`hr-sq-${q.id}`);
    if (el) reponsesSpecifiques[q.id] = el.value.trim();
  });

  const clan = rang ? CLANS.find(c => c.id === rang.clan) : null;
  const donnees = {
    pseudo_discord:       pseudo,
    nom_oc:               oc,
    rang_actuel:          rangActuel,
    anciennete_serveur:   ancServeur,
    anciennete_oc:        ancOc,
    activite_rp:          activite,
    motivation_ooc:       motiOoc,
    rang_type:            rangType,
    reponses_specifiques: reponsesSpecifiques,
    motivation_ic:        motiIc,
    extrait_rp:           extrait,
  };

  const { error } = await sb.from('candidatures').insert({
    code_suivi:     code,
    type:           'hr',
    poste_id:       parseInt(posteId),
    pseudo_discord: pseudo,
    statut:         'recue',
    donnees,
  });

  if (error) { setLoading(btn, false); showToast("Erreur lors de l'envoi. Réessaie.", 'error'); return; }

  const embed = buildCandidatureEmbed(
    { type: 'hr', code_suivi: code, pseudo_discord: pseudo, donnees },
    rang ? rang.rang : posteId,
    clan ? clan.nom  : ''
  );
  await sendDiscordWebhook(CONFIG.discord.webhookHR, { embeds: [embed] });
  setLoading(btn, false);
  if (window.clearDraft) window.clearDraft('form-hr');
  showSuccess(code);
}

// -----------------------------------------------
// Soumission OC
// -----------------------------------------------
async function submitOC(num) {
  const is4 = num === 'oc4';
  const p   = id => document.getElementById(`${num}-${id}`);

  const commonFields = [
    { el: p('pseudo'),      min: 2  },
    { el: p('anciennete'),  min: 1  },
    { el: p('ocs-actuels'), min: 5  },
    { el: p('activite'),    min: 30 },
    { el: p('clan'),        min: 1  },
    { el: p('concept'),     min: 50 },
    { el: p('justif'),      min: 30 },
  ];
  if (is4) commonFields.push({ el: p('extrait'), min: 80 });

  const valid = validateFields(commonFields);
  if (!valid) { showToast('Merci de remplir tous les champs obligatoires.', 'error'); return; }

  const pseudo  = p('pseudo').value.trim();
  const clan    = p('clan').value;
  const clanObj = CLANS.find(c => c.id === clan);

  const donnees = {
    pseudo_discord:  pseudo,
    anciennete:      p('anciennete').value.trim(),
    ocs_actuels:     p('ocs-actuels').value.trim(),
    activite:        p('activite').value.trim(),
    clan_vise:       clanObj ? clanObj.nom : clan,
    nom_envisage:    p('nom').value.trim() || null,
    concept:         p('concept').value.trim(),
    justification:   p('justif').value.trim(),
    ...(is4 && { extrait_rp: p('extrait').value.trim() }),
  };

  const btn  = document.querySelector(`#form-${num} .btn-primary`);
  const code = generateCode();
  setLoading(btn, true, 'Envoi en cours…');

  const { error } = await sb.from('candidatures').insert({
    code_suivi: code, type: num, poste_id: null,
    pseudo_discord: pseudo, statut: 'recue', donnees,
  });

  if (error) { setLoading(btn, false); showToast('Erreur lors de l\'envoi. Réessaie.', 'error'); return; }

  const embed = buildOCEmbed(num, code, pseudo, donnees);
  await sendDiscordWebhook(CONFIG.discord.webhookOC, { embeds: [embed] });
  setLoading(btn, false);
  if (window.clearDraft) window.clearDraft('form-' + num);
  showSuccess(code, num);
}

function buildOCEmbed(num, code, pseudo, donnees) {
  const is4  = num === 'oc4';
  return {
    title: is4 ? '🐾 Demande de 4ème OC' : '🐾 Demande de 3ème OC',
    description: is4
      ? 'Une demande de **4ème personnage** a été soumise. Vérification approfondie requise.'
      : 'Une demande de **3ème personnage** a été soumise.',
    color: is4 ? 0x8470D8 : 0x2DB882,
    fields: [
      { name: 'Code de suivi',  value: `\`${code}\``,              inline: true },
      { name: 'Pseudo Discord', value: pseudo,                      inline: true },
      { name: 'Clan envisagé',  value: donnees.clan_vise || '—',    inline: true },
      { name: 'Nom envisagé',   value: donnees.nom_envisage || '—', inline: true },
    ],
    footer: { text: `Le Prix de la Trêve · ${new Date().toLocaleDateString('fr-FR')}` },
    timestamp: new Date().toISOString(),
  };
}

// -----------------------------------------------
// Écran de confirmation
// -----------------------------------------------
function showSuccess(code, type) {
  const isOC = type && (type === 'oc3' || type === 'oc4');
  document.querySelector('.main').innerHTML = `
    <div style="max-width:480px;margin:3rem auto;text-align:center;">
      <div style="font-size:40px;margin-bottom:1.5rem;">✓</div>
      <h2 style="font-family:'Cinzel',serif;font-size:20px;color:var(--text-1);margin-bottom:10px;">
        ${isOC ? 'Demande envoyée !' : 'Candidature envoyée !'}
      </h2>
      <p style="color:var(--text-2);font-size:14px;margin-bottom:1.5rem;line-height:1.7;">
        ${isOC
          ? `Ta demande de <strong style="color:var(--text-1)">${type === 'oc3' ? '3ème' : '4ème'} OC</strong> a bien été reçue. L'équipe l'examinera dès que possible.`
          : 'Ta candidature a bien été reçue. L\'équipe staff la lira dès que possible.'
        }
      </p>
      <div style="background:var(--bg-card);border:1px solid var(--border-s);border-radius:var(--r-card);padding:1.25rem;margin-bottom:1.75rem;">
        <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;letter-spacing:.08em;text-transform:uppercase;">Ton code de suivi</div>
        <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:600;color:var(--text-1);letter-spacing:.1em;">${code}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:6px;">Conserve-le précieusement pour suivre l'état de ta demande.</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a href="./suivi.html?code=${code}" class="btn btn-primary">Suivre ma demande</a>
        <a href="./index.html" class="btn btn-ghost">Retour aux postes</a>
      </div>
    </div>
  `;
}