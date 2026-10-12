const CONFIG = {
  supabase: {
    url:     'URL_DU_PROJET_PARTAGE',      // ← à remplir après migration
    anonKey: 'ANON_KEY_DU_PROJET_PARTAGE', // ← à remplir après migration
  },
  discord: {
    webhookStaff:          'URL_WEBHOOK',  // #candidatures-staff
    webhookOC:             'URL_WEBHOOK',  // #candidatures-oc
    webhookHR:             'URL_WEBHOOK',  // #candidatures-hr
    webhookNotifCandidats: 'URL_WEBHOOK',  // notif aux candidats (décision)
    webhookAdmin:          'URL_WEBHOOK',  // #notifications-admin (notes, listes d'attente)
    webhookOuvertures:     'URL_WEBHOOK',  // #bénévoles (ouverture publique d'un poste)
  },
  site: {
    nom:           'Le Prix de la Trêve',
    url:           'https://araxiaa.github.io/formulaires/',
    discordInvite: 'https://discord.gg/nvy3FBkB85',
    description:   'Serveur de roleplay francophone basé sur l\'univers de La Guerre des Clans. Trois clans, une communauté passionnée.',
  }
};

// Noms des tables (préfixe cand_ : projet Supabase partagé avec l'arbre généalogique et les bots)
const T = {
  postesStaff: 'cand_postes_staff',
  postesHr:    'cand_postes_hr',
  candid:      'cand_candidatures',
  attente:     'cand_liste_attente',
  membres:     'cand_membres_discord',
  notes:       'cand_notes',
};

const DB_READY = !/^URL_|^ANON_KEY_/.test(CONFIG.supabase.url + CONFIG.supabase.anonKey) && !!window.supabase;
const sb = DB_READY ? window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey) : null;
