// =========================================================
// config.js — À remplir avec vos identifiants
// =========================================================
// Récupérer URL + anon key dans : Supabase > Project Settings > API
// Créer les webhooks dans : Discord > Paramètres du canal > Intégrations > Webhooks

const CONFIG = {
  supabase: {
    url:     'https://vrityzfmbichfxyvazeg.supabase.co',
    anonKey: 'sb_publishable_zNinJsnK1YCj7zoBzkSbhg_EaMsSI0n',  // clé publique (anon)
  },
  discord: {
    webhookStaff: 'https://discord.com/api/webhooks/1520781184274141294/bCrvaSMDhBYUX9qe25hr-lWrBinq1GEFBtAjkfh5MvrMLX0JKOgX-0FR72QTLRX9xUUw',  // salon #candidatures-staff
    webhookOC:    'https://discord.com/api/webhooks/1520818853662298315/HVERqs7lie003T0CduPosikKbV4OPlcswhyn2E28Lc6O833eZ-cJb84sUaTLyleKPhK2',
    webhookHR:    'https://discord.com/api/webhooks/1509242254567673989/waPgtJzIlHqB48ZFa3xA3Tz0RC2HRbJknIGY-Akf-L9LU4cGVm5jloBF-BM7AEshSFdl',     // salon #candidatures-hr
    webhookAdmin: 'https://discord.com/api/webhooks/1520781590135832687/eiUxFz0I3Ov5t-K4Hple9c7Wp1n95nntXz5zfJYtOq9Ks2XpybheSauoXXfXF3xbcMz0',  // salon #notifications-admin (listes d'attente)
  },
  site: {
    nom: 'Le Prix de la Trêve',
    url: 'https://araxiaa.github.io/formulaires/',
  }
};

// Client Supabase (disponible globalement via window.supabase du CDN)
const sb = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);