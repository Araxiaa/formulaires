// =========================================================
// data.js — Données statiques des pôles et clans
// (Les statuts des postes viennent de Supabase)
// =========================================================

const POLES = [
  {
    id: 'guide',
    nom: 'Pôle Guide',
    description: 'Vos compagnons de route, de votre première minute sur le serveur à la validation de votre premier personnage. Tickets, questions, corrections de fiches et animations Hors-RP.',
    description_long: 'Les Staffs Guides sont vos compagnons de route, de votre toute première minute sur le serveur jusqu\'à la création et la validation de votre premier personnage. Toujours à votre écoute, ils répondent à vos questions, étudient vos suggestions, gèrent vos tickets et corrigent vos fiches avec bienveillance. Ce sont également eux qui insufflent de la vie et de la joie dans la communauté en organisant toutes les animations Hors-RP du serveur.',
  },
  {
    id: 'narration',
    nom: 'Pôle Narration',
    description: 'Maîtres d\'œuvre de votre expérience de jeu : grands événements narratifs, gestion des PNJ et accompagnement de vos intrigues personnelles.',
    description_long: 'Ces staffs sont les maîtres d\'œuvre de votre expérience de jeu ! De la création des grands événements narratifs à la gestion rigoureuse des PNJs, en passant par l\'aide personnalisée en ticket pour développer vos propres intrigues, ils sont les gardiens de la cohérence et de l\'évolution de tout l\'univers des Clans.',
  },
  {
    id: 'batisseur',
    nom: 'Pôle Bâtisseur',
    description: 'Maîtres du terrain de jeu : façonnent les salons RP, adaptent la géographie du serveur et signalent les dangers locaux.',
    description_long: 'Ils façonnent les salons RP, adaptent la géographie (incendies, inondations), gèrent l\'apparition de nouveaux lieux et signalent les dangers locaux (prédateurs, météo). Maîtres du terrain de jeu directement sur le serveur Role-Play.',
  },
];

const CLANS = [
  { id: 'tonnerre', nom: 'Clan du Tonnerre' },
  { id: 'vent',     nom: 'Clan du Vent'     },
  { id: 'ombre',    nom: "Clan de l'Ombre"  },
];

const STATUT_LABELS = {
  ouvert:  'Ouvert',
  complet: 'Complet',
  indispo: 'Non disponible',
  recue:       'Reçue',
  examen:      'En cours d\'examen',
  acceptee:    'Acceptée',
  refusee:     'Refusée',
  retiree:     'Retirée',
};

const POLE_LABELS = {
  guide:     'Pôle Guide',
  narration: 'Pôle Narration',
  batisseur: 'Pôle Bâtisseur',
};

const CLAN_LABELS = {
  tonnerre: 'Clan du Tonnerre',
  vent:     'Clan du Vent',
  ombre:    "Clan de l'Ombre",
};