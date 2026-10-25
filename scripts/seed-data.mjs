// Source unique des données initiales (formulaires, postes, FAQ…).
// `node scripts/gen-seed.mjs` génère supabase/migrations/002_seed.sql.
// Tout ce contenu est ensuite modifiable depuis le dashboard staff.

const q = (id, label, extra = {}) => ({ id, label, type: 'textarea', min: 30, required: true, ...extra })

export const groupes = [
  { id: 'guide', categorie: 'pole', nom: 'Pôle Guide', couleur: '#5A9A70', icone: 'boussole', ordre: 1,
    description: 'Vos compagnons de route, de votre première minute sur le serveur à la validation de votre premier personnage.',
    description_longue: "Les Staffs Guides sont vos compagnons de route, de votre toute première minute sur le serveur jusqu'à la création et la validation de votre premier personnage. Toujours à votre écoute, ils répondent à vos questions, étudient vos suggestions, gèrent vos tickets et corrigent vos fiches avec bienveillance. Ce sont également eux qui insufflent de la vie et de la joie dans la communauté en organisant toutes les animations Hors-RP du serveur." },
  { id: 'narration', categorie: 'pole', nom: 'Pôle Narration', couleur: '#8A9A42', icone: 'plume', ordre: 2,
    description: "Maîtres d'œuvre de votre expérience de jeu : grands événements, PNJ et intrigues personnelles.",
    description_longue: "Ces staffs sont les maîtres d'œuvre de votre expérience de jeu ! De la création des grands événements narratifs à la gestion rigoureuse des PNJs, en passant par l'aide personnalisée en ticket pour développer vos propres intrigues, ils sont les gardiens de la cohérence et de l'évolution de tout l'univers des Clans." },
  { id: 'tonnerre', categorie: 'clan', nom: 'Clan du Tonnerre', couleur: '#6aa07a', icone: 'eclair', ordre: 1, description: '', description_longue: '' },
  { id: 'vent', categorie: 'clan', nom: 'Clan du Vent', couleur: '#cdbf8c', icone: 'brume', ordre: 2, description: '', description_longue: '' },
  { id: 'ombre', categorie: 'clan', nom: "Clan de l'Ombre", couleur: '#5aa19c', icone: 'pin', ordre: 3, description: '', description_longue: '' },
]

const ANC = '1 à 2 mois sur le serveur'
const OPT = "Les options sont facultatives : tu peux candidater au rôle sans en choisir."
export const postesStaff = [
  { groupe: 'guide', nom: 'Staff Guide', places: 3, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'Aider, accompagner et animer : le visage du serveur pour les membres.',
    note_candidat: OPT,
    missions: ['Aider et accompagner les membres', 'Créer des animations', "Lire et accepter les questionnaires d'entrée", 'Gérer les conflits et les tickets'],
    questions: [
      q('q1', 'Comment accueillerais-tu un nouveau membre perdu ?'),
      q('q2', 'Comment gères-tu un ticket urgent quand tu es occupé·e ?'),
      q('q3', "Deux membres s'opposent dans un salon et la tension monte. Comment gères-tu ce conflit ?"),
      q('q4', "Un questionnaire d'entrée est incomplet ou limite. Comment décides-tu, et que réponds-tu au candidat ?"),
      q('q5', 'Propose une idée d’animation pour le serveur.')],
    options: [
      { id: 'regisseur', nom: 'Régisseur·se de fiche', description: 'Correction des fiches de personnage.',
        missions: ['Lecture et correction des fiches de personnage soumises', 'Vérification de la cohérence avec les règles du serveur (noms, rangs, génétique)', 'Retours bienveillants et guidage des membres lors des corrections'], places_total: 2, places_dispo: 2, membres: [],
        questions: [q('q1', "Comment vérifies-tu la cohérence d'une fiche avec les règles du serveur ?"), q('q2', 'Comment formules-tu un retour de correction sans décourager le membre ?'), q('q3', 'Un membre conteste ta correction — comment réagis-tu ?')] },
      { id: 'geneticien', nom: 'Généticien·ne', description: 'Correction génétique des personnages.',
        missions: ['Traitement des demandes de génétique (pelages, yeux, traits hérités)', 'Gestion et mise à jour du registre génétique du serveur', 'Accompagnement des membres sur les questions génétiques complexes'], places_total: 1, places_dispo: 1, membres: [],
        questions: [q('q1', "Explique le fonctionnement de l'hérédité de la couleur des yeux dans le Codex."), q('q2', 'Un membre demande un pelage rare pour son OC — comment évalues-tu la demande ?'), q('q3', 'Comment tiens-tu un registre génétique à jour sur un serveur actif ?')] },
    ] },
  { groupe: 'narration', nom: 'Staff Narration', places: 2, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'Faire vivre le roleplay : tickets, événements et cohérence narrative.',
    note_candidat: OPT,
    missions: ['Aider les membres en ticket pour le RP', 'Créer des événements role-play', "S'assurer que les règles role-play sont appliquées", 'Créer des tâches dans le clan'],
    questions: [
      q('q1', "Un membre vient en ticket avec une intrigue complexe — comment l'accompagnes-tu ?"),
      q('q2', 'Un membre enfreint une règle RP en pleine scène — comment interviens-tu sans casser l’immersion ?'),
      q('q3', 'Propose une idée d’événement role-play pour le serveur.'),
      q('q4', 'Quelles tâches imagines-tu pour dynamiser la vie d’un clan ?')],
    options: [
      { id: 'pnj', nom: 'Gestion PNJ', description: "Gestion et incarnation des PNJ de l'univers.",
        missions: ['Gestion et incarnation des PNJ lors des interactions avec les membres', "Création de nouveaux PNJ cohérents avec le lore et l'univers", 'Suivi des PNJ impliqués dans plusieurs fils narratifs simultanément'], places_total: 2, places_dispo: 2, membres: [],
        questions: [q('q1', 'Comment gères-tu un PNJ impliqué dans plusieurs fils narratifs actifs ?'), q('q2', "Crée un concept de PNJ secondaire pour le Clan de l'Ombre."), q('q3', 'Un PNJ que tu joues doit prendre une décision qui déplaira à certains membres — comment procèdes-tu ?')] },
    ] },
]

export const questionsRang = {
  meneur: [
    q('q1', "Un clan allié demande refuge sur ton territoire après une catastrophe. Certains guerriers s'y opposent. Comment gères-tu cette situation ?"),
    q('q2', "Tu dois prendre une décision vitale pour ton clan en l'absence de ton lieutenant·e. Comment procèdes-tu ?"),
    q('q3', 'Ton clan traverse une période de faible activité. Comment maintiens-tu la cohésion et motives-tu tes membres ?')],
  lieutenant: [
    q('q1', 'Ton meneur·se est absent·e plusieurs jours. Un conflit éclate entre deux guerriers. Comment interviens-tu ?'),
    q('q2', 'Tu dois composer des patrouilles pour la semaine en tenant compte des forces et des tensions entre membres. Décris ton approche.'),
    q('q3', 'Un jeune guerrier conteste ouvertement une de tes décisions devant le clan. Comment réagis-tu ?')],
  guerisseur: [
    q('q1', "Décris comment tu soignerais un guerrier revenant d'un combat avec une blessure grave et de la fièvre."),
    q('q2', 'Tu apprends que ton médicat cache une information importante au meneur·se. Que fais-tu ?'),
    q('q3', "Quelle place le Guérisseur·se occupe-t-il selon toi dans l'équilibre du clan, au-delà des soins physiques ?")],
  apprenti: [
    q('q1', 'Ton mentor oublie de te former pendant plusieurs jours. Comment gères-tu cette situation ?'),
    q('q2', 'Tu assistes à une injustice commise par un guerrier haut placé. Que fais-tu ?'),
    q('q3', "Qu'est-ce qui t'a amené·e à vouloir incarner un·e Apprenti·e plutôt qu'un rang de guerrier ordinaire ?")],
}

const rangs = [
  ['meneur', 'Meneur·se Étoile'], ['lieutenant', 'Lieutenant·e'], ['guerisseur', 'Guérisseur·se'], ['apprenti', 'Apprenti·e'],
]
const titulaires = {
  tonnerre: ['Étoile de Framboisier', "Clapotis d'Étang", 'Aube du Myosotis', null],
  vent: ["Étoile d'Ocre", 'Rafale des Joncs', 'Chant de Cigale', null],
  ombre: ['Truffe Champêtre', null, 'Illusion du Puceron', null],
}
export const postesHr = ['tonnerre', 'vent', 'ombre'].flatMap((clan) =>
  rangs.map(([type, nom], i) => ({
    groupe: clan, nom, type_rang: type, titulaire: titulaires[clan][i],
    statut: clan === 'ombre' && type === 'lieutenant' ? 'ouvert' : 'indispo',
    note: clan === 'ombre' && type === 'apprenti' ? 'Prochainement Petit Lys' : null,
    questions: questionsRang[type],
  })))

const ancienneteOpts = ["Moins d'un mois", '1 à 2 mois', '3 à 6 mois', 'Plus de 6 mois', "Plus d'un an"]
const freqOpts = ['1 à 3 RP / semaine', '4 à 7 RP / semaine', '8 à 14 RP / semaine', 'Plus de 14 RP / semaine']

const pseudo = { id: 'pseudo', label: 'Ton pseudo Discord', type: 'text', required: true, hint: "Celui qu'on retrouve sur le serveur.", placeholder: 'ex : araxia' }
const anc = { id: 'anciennete', label: 'Depuis combien de temps es-tu sur le serveur ?', type: 'choice', required: true, options: ancienneteOpts }

export const formulaires = [
  { type: 'staff', titre: 'Candidature Staff', ouvert: true,
    description: "Rejoins l'équipe qui fait vivre le serveur : Staff Guide ou Staff Narration.",
    etapes: [
      { id: 'toi', titre: 'Toi', description: 'Faisons connaissance.', champs: [pseudo, anc,
        { id: 'presentation', label: 'Présente-toi', type: 'textarea', min: 150, required: true, hint: 'Qui es-tu, hors et en RP ? Ce qui te définit en quelques lignes.' }] },
      { id: 'role', titre: 'Ton rôle', description: 'Choisis ton équipe, puis les options qui t’intéressent.', kind: 'poste', max: 2 },
      { id: 'dispos', titre: 'Disponibilités', description: "Pour bien t'intégrer à l'équipe.", champs: [
        { id: 'heures', label: "Combien d'heures par semaine peux-tu consacrer au staff ?", type: 'choice', required: true, options: ['Moins de 3h', '3 à 5h', '5 à 8h', 'Plus de 8h'] },
        { id: 'dispos', label: 'Tes disponibilités habituelles', type: 'textarea', min: 20, required: true, hint: 'Jours, créneaux, périodes plus chargées (examens, vacances…).' },
        { id: 'experience', label: 'Expérience associative ou communautaire', type: 'textarea', required: false, hint: 'Staff sur un autre serveur, association, modération… (facultatif)' }] },
      { id: 'motivation', titre: 'Motivation', description: '', champs: [
        { id: 'plaisir', label: "Qu'est-ce qui te plaît dans le serveur ?", type: 'textarea', min: 100, required: true },
        { id: 'apport', label: "Qu'aimerais-tu apporter à l'équipe ?", type: 'textarea', min: 50, required: false }] },
      { id: 'situations', titre: 'Mises en situation', description: 'Réponds comme tu le ferais vraiment.', kind: 'questions_poste' },
    ] },
  { type: 'hr', titre: 'Candidature Haut Rang', ouvert: true,
    description: 'Mène, seconde ou soigne : candidate à un rang de ton clan.',
    etapes: [
      { id: 'perso', titre: 'Ton personnage', description: 'Le personnage qui porterait le rang.', champs: [pseudo,
        { id: 'oc_nom', label: "Nom de l'OC candidat·e", type: 'text', required: true },
        { id: 'oc_rang', label: 'Son rang actuel dans le clan', type: 'text', required: true, placeholder: 'ex : Guerrier·ère, Apprenti·e…' },
        anc,
        { id: 'oc_anciennete', label: "Ancienneté de l'OC", type: 'text', required: true, placeholder: 'ex : 3 mois' },
        { id: 'frequence', label: 'Fréquence de jeu avec cet OC', type: 'choice', required: true, options: freqOpts },
        { id: 'scenes', label: 'Liens vers 2-3 scènes RP représentatives', type: 'url_list', required: true, hint: 'Un lien par ligne (liens Discord de messages ou de fils).' }] },
      { id: 'rang', titre: 'Le rang visé', description: 'Seuls les rangs ouverts sont proposés.', kind: 'poste', max: 1 },
      { id: 'situations', titre: 'Mises en situation', description: 'Place-toi dans la peau du rang.', kind: 'questions_poste' },
      { id: 'rp', titre: 'Section RP', description: 'Montre-nous ta plume.', champs: [
        { id: 'motivation', label: 'Motivation IC : pourquoi cet OC veut ce rang ?', type: 'textarea', min: 150, required: true },
        { id: 'extrait', label: 'Extrait roleplay libre', type: 'textarea', min: 200, required: true, hint: 'Une scène courte qui illustre ton OC dans ce rôle.' }] },
    ] },
  ...['oc3', 'oc4'].map((t) => ({
    type: t, titre: t === 'oc3' ? '3ème OC' : '4ème OC', ouvert: true,
    description: t === 'oc3' ? 'Un troisième personnage pour enrichir ton aventure.' : 'Un quatrième personnage : pour les joueurs les plus actifs.',
    etapes: [
      { id: 'toi', titre: 'Toi', description: '', champs: [pseudo, anc,
        { id: 'ocs_actuels', label: 'Tes OCs actuels et ta fréquence de jeu avec chacun', type: 'textarea', min: 20, required: true },
        { id: 'activite', label: 'Ton activité RP globale', type: 'choice', required: true, options: freqOpts }] },
      { id: 'nouveau', titre: 'Le nouvel OC', description: 'Présente-nous ton futur personnage.', champs: [
        { id: 'clan', label: 'Clan visé', type: 'choice', required: true, options: ['Clan du Tonnerre', 'Clan du Vent', "Clan de l'Ombre"] },
        { id: 'nom_oc', label: 'Nom envisagé', type: 'text', required: true },
        { id: 'concept', label: 'Concept et personnalité', type: 'textarea', min: 120, required: true }] },
      { id: 'motivation', titre: 'Motivation', description: '', champs: [
        { id: 'pourquoi', label: 'Pourquoi souhaites-tu un OC supplémentaire ?', type: 'textarea', min: 100, required: true },
        ...(t === 'oc4' ? [{ id: 'extrait', label: 'Extrait roleplay avec cet OC ou dans le style prévu', type: 'textarea', min: 200, required: true }] : [])] },
    ],
  })),
]

export const faq = [
  ['Processus général', 'Quel est le délai de réponse ?', "Le staff étudie les candidatures dès que possible, généralement sous une à deux semaines. Tu peux suivre l'avancement à tout moment avec ton code de suivi ou en te connectant avec Discord."],
  ['Processus général', 'Puis-je postuler à plusieurs postes en même temps ?', "Oui. Tu peux déposer une candidature Staff (jusqu'à deux rôles), une candidature Haut Rang et une demande d'OC supplémentaire en parallèle. Une seule candidature en cours par type est acceptée."],
  ['Processus général', "Puis-je modifier ma candidature après l'envoi ?", "Non, mais tu peux la retirer depuis la page « Mon suivi » (tant qu'elle n'est pas tranchée) et en déposer une nouvelle."],
  ['Processus général', "J'ai perdu mon code de suivi, que faire ?", "Connecte-toi avec Discord sur la page « Mon suivi » : toutes tes candidatures y apparaissent. Sinon, la recherche par pseudo retrouve ton code, sans jamais afficher le contenu de tes réponses."],
  ['Processus général', 'Où lire la réponse du staff ?', "Sur la page « Mon suivi » : la décision (acceptée ou refusée) est accompagnée d'un message du staff que tu peux relire à tout moment. Tu es aussi mentionné·e sur Discord."],
  ['Candidatures Staff', 'Quelle ancienneté faut-il avoir ?', "En général 1 à 2 mois sur le serveur. Le détail est indiqué dans la fiche de chaque rôle."],
  ['Candidatures Staff', "Y a-t-il une période d'essai ?", "Oui. Les nouveaux staffs sont accompagnés pendant une période d'essai avant d'être confirmés dans leur rôle."],
  ['Candidatures Staff', 'Les recrutements Staff sont-ils ouverts en permanence ?', "Non : seuls les postes marqués « Ouvert » acceptent des candidatures. Si un poste est complet, inscris-toi sur sa liste d'attente."],
  ['Candidatures Staff', 'Que sont les options ?', "Dans chaque équipe, des options facultatives existent (Régisseur·se de fiche et Généticien·ne chez les Guides, Gestion PNJ chez les Narrateurs). Elles ajoutent quelques questions, et tu es libre de ne pas en choisir."],
  ['Hauts Rangs', 'Quand les postes de Haut Rang ouvrent-ils ?', "Quand un poste se libère. Il apparaît alors comme « Ouvert » sur la page Postes et sur la page Hauts Rangs."],
  ['Hauts Rangs', 'Dois-je appartenir au clan du poste visé ?', "Ton OC candidat doit être membre du clan concerné et avoir une activité RP régulière."],
  ['Hauts Rangs', "Comment fonctionne la liste d'attente ?", "Inscris ton pseudo Discord sur la liste d'un poste indisponible : tu seras mentionné·e sur Discord à son ouverture."],
  ['OC supplémentaire', 'Quelle différence entre le 3ème et le 4ème OC ?', "Le 4ème OC demande en plus un extrait roleplay, car il suppose une activité encore plus soutenue."],
  ['OC supplémentaire', 'Ma demande peut-elle être refusée malgré mon activité ?', "Oui : le staff regarde aussi la cohérence du concept et l'équilibre entre tes OCs et celui des clans. Un refus est toujours accompagné d'une explication."],
]

export const modeles = [
  ['acceptee', 'Bienvenue', "Bienvenue dans l'équipe ! Ta candidature nous a convaincus. Nous te contactons sur Discord très bientôt pour la suite."],
  ['acceptee', "Période d'essai", "Ta candidature est acceptée : tu commences par une période d'essai accompagnée. Un·e membre du staff te contactera très vite pour t'expliquer le fonctionnement."],
  ['acceptee', 'OC validé', 'Ton nouvel OC est validé ! Tu peux créer sa fiche et le présenter à la régie. Bon jeu !'],
  ['refusee', 'Pas cette fois', "Merci pour ta candidature et le temps passé dessus. Nous ne pouvons pas la retenir cette fois-ci, mais n'hésite pas à retenter dans quelques semaines."],
  ['refusee', "Manque d'ancienneté", "Ta candidature est intéressante, mais nous aimerions que tu aies un peu plus d'ancienneté sur le serveur. Reviens vers nous bientôt !"],
  ['refusee', 'Poste pourvu', "Merci de ta candidature. Le poste a finalement été pourvu ; nous gardons ton dossier en mémoire pour une prochaine ouverture."],
  ['refusee', 'Activité insuffisante', "Ta candidature n'a pas été retenue car ton activité RP actuelle ne nous permet pas de valider cette demande. Reviens quand ton rythme aura évolué !"],
  ['examen', 'Dossier en lecture', "Ton dossier est en cours de lecture par l'équipe. Nous revenons vers toi dès qu'une décision est prise."],
]

export const parametres = {
  recrutement_ouvert: true,
  site_url: 'https://araxiaa.github.io/formulaires/',
  discord_invite: 'https://discord.gg/nvy3FBkB85',
  annonce: '',
  delai_reponse: 'une à deux semaines',
}
