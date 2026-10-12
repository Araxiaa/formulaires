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
  { id: 'batisseur', categorie: 'pole', nom: 'Pôle Bâtisseur', couleur: '#A07038', icone: 'rocher', ordre: 3,
    description: 'Maîtres du terrain de jeu : salons RP, géographie du serveur et dangers locaux.',
    description_longue: "Ils façonnent les salons RP, adaptent la géographie (incendies, inondations), gèrent l'apparition de nouveaux lieux et signalent les dangers locaux (prédateurs, météo). Maîtres du terrain de jeu directement sur le serveur Role-Play." },
  { id: 'tonnerre', categorie: 'clan', nom: 'Clan du Tonnerre', couleur: '#6aa07a', icone: 'eclair', ordre: 1, description: '', description_longue: '' },
  { id: 'vent', categorie: 'clan', nom: 'Clan du Vent', couleur: '#cdbf8c', icone: 'brume', ordre: 2, description: '', description_longue: '' },
  { id: 'ombre', categorie: 'clan', nom: "Clan de l'Ombre", couleur: '#5aa19c', icone: 'pin', ordre: 3, description: '', description_longue: '' },
]

const ANC = '1 à 2 mois sur le serveur'
export const postesStaff = [
  { groupe: 'guide', nom: 'Parrain/Marraine', places: 2, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'Accueillir et accompagner les nouveaux membres.',
    missions: ['Accueil des nouveaux membres et réponse à leurs premières questions', 'Prise en charge et suivi des tickets ouverts par les membres', 'Accompagnement lors de la création et validation des premiers personnages'],
    questions: [q('q1', 'Comment accueillerais-tu un nouveau membre perdu ?'), q('q2', 'Comment gères-tu un ticket urgent quand tu es occupé·e ?'), q('q3', 'Comment maintiens-tu une attitude bienveillante face à des demandes répétitives ?')] },
  { groupe: 'guide', nom: 'Régisseur·se de fiche', places: 2, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'Relire, corriger et valider les fiches de personnage.',
    missions: ['Lecture et correction des fiches de personnage soumises', 'Vérification de la cohérence avec les règles du serveur (génétique, noms, rangs)', 'Retours bienveillants et guidage des membres lors des corrections'],
    questions: [q('q1', "Comment vérifies-tu la cohérence génétique d'une fiche ?"), q('q2', 'Comment formules-tu un retour de correction sans décourager le membre ?'), q('q3', 'Un membre conteste ta correction — comment réagis-tu ?')] },
  { groupe: 'guide', nom: 'Généticien·ne', places: 1, anciennete: ANC, disponibilite: '4h / semaine minimum',
    description: 'Gardien·ne de la génétique féline du serveur.',
    note_candidat: 'Une solide maîtrise de la génétique féline et du Codex du serveur est indispensable.',
    missions: ['Traitement des demandes de génétique (pelages, yeux, traits hérités)', 'Gestion et mise à jour du registre génétique du serveur', 'Accompagnement des membres sur les questions génétiques complexes'],
    questions: [q('q1', "Explique le fonctionnement de l'hérédité de la couleur des yeux dans le Codex."), q('q2', 'Un membre demande un pelage rare pour son OC — comment évalues-tu la demande ?'), q('q3', 'Comment tiens-tu un registre génétique à jour sur un serveur actif ?')] },
  { groupe: 'guide', nom: 'Animateur/Animatrice', places: 2, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'Faire vivre la communauté hors du roleplay.',
    missions: ["Conception et animation d'événements Hors-RP (jeux, concours, activités)", 'Organisation des activités récurrentes (Membre du Mois, OC du Mois…)', 'Animation de la vie communautaire en dehors du roleplay'],
    questions: [q('q1', 'Propose une idée d’événement Hors-RP pour le serveur.'), q('q2', "Comment relances-tu la participation quand un événement génère peu d'engouement ?"), q('q3', "Comment adaptes-tu une animation pour qu'elle convienne à différentes tranches d'horaires ?")] },
  { groupe: 'narration', nom: 'Gestion RP', places: 1, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'Accompagner les membres dans le développement de leurs intrigues.',
    missions: ["Réponse aux tickets RP pour aider les membres à développer l'histoire de leur OC", "Co-construction d'intrigues personnalisées avec les membres en demande", 'Suivi et cohérence des arcs narratifs en cours'],
    questions: [q('q1', "Un membre vient en ticket avec une intrigue complexe — comment l'accompagnes-tu ?"), q('q2', "Comment t'assures-tu de la cohérence d'une intrigue avec le lore existant ?"), q('q3', "Comment équilibres-tu l'accompagnement de plusieurs membres simultanément ?")] },
  { groupe: 'narration', nom: 'Plume', places: 2, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: 'La voix écrite du serveur : lore, résumés et récits.',
    note_candidat: 'Un extrait de rédaction narrative est requis lors de la candidature.',
    missions: ["Rédaction des résumés d'événements et des actualités du serveur", 'Écriture du lore officiel, des descriptions de lieux et des PNJ notables', 'Production des textes narratifs pour les grands événements collectifs'],
    questions: [q('q1', 'Rédige un court texte narratif décrivant une aube dans la forêt du Clan du Tonnerre.', { min: 200 }), q('q2', 'Comment résumes-tu un événement collectif important pour une newsletter ?'), q('q3', 'Comment maintiens-tu un style cohérent entre plusieurs auteurs pour le lore officiel ?')] },
  { groupe: 'narration', nom: 'Gestion PNJ', places: 2, anciennete: ANC, disponibilite: '5h / semaine minimum',
    description: "Donner vie aux personnages non-joueurs de l'univers.",
    missions: ['Gestion et incarnation des PNJ lors des interactions avec les membres', "Création de nouveaux PNJ cohérents avec le lore et l'univers", 'Suivi des PNJ impliqués dans plusieurs fils narratifs simultanément'],
    questions: [q('q1', 'Comment gères-tu un PNJ impliqué dans plusieurs fils narratifs actifs ?'), q('q2', "Crée un concept de PNJ secondaire pour le Clan de l'Ombre."), q('q3', 'Un PNJ que tu joues doit prendre une décision qui déplaira à certains membres — comment procèdes-tu ?')] },
  { groupe: 'batisseur', nom: 'Bâtisseur/Bâtisseuse', places: 1, anciennete: ANC, disponibilite: '4h / semaine minimum',
    description: 'Façonner les salons et la géographie du serveur.',
    note_candidat: 'Une bonne maîtrise de la gestion des salons Discord est nécessaire.',
    missions: ['Création et organisation des salons RP selon la géographie des territoires', 'Modélisation des événements géographiques (incendies, inondations, nouveaux lieux)', 'Signalement et gestion des dangers locaux (prédateurs, météo)'],
    questions: [q('q1', 'Comment organiserais-tu les salons pour un nouveau lieu RP (ex : une grotte découverte) ?'), q('q2', 'Un incendie narratif ravage une partie du territoire — comment adaptes-tu les salons ?'), q('q3', 'Quelle est la différence entre un salon « privé clan » et un salon « frontière » dans ton organisation ?')] },
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
    description: "Rejoins l'équipe qui fait vivre le serveur : guides, narrateurs et bâtisseurs.",
    etapes: [
      { id: 'toi', titre: 'Toi', description: 'Faisons connaissance.', champs: [pseudo, anc,
        { id: 'presentation', label: 'Présente-toi', type: 'textarea', min: 150, required: true, hint: 'Qui es-tu, hors et en RP ? Ce qui te définit en quelques lignes.' }] },
      { id: 'role', titre: 'Ton rôle', description: 'Choisis un ou deux rôles.', kind: 'poste', max: 2 },
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
