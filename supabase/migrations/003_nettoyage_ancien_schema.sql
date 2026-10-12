-- À exécuter UNIQUEMENT après validation du nouveau site :
-- supprime les tables de la v1 (public.cand_*), remplacées par le schéma `recrutement`.
drop function if exists public.cand_suivi_code(text), public.cand_suivi_pseudo(text), public.cand_retirer(text),
                        public.cand_doublon(text, text), public.cand_discord_connu(text);
drop table if exists public.cand_notes, public.cand_membres_discord, public.cand_liste_attente,
                     public.cand_candidatures, public.cand_postes_hr, public.cand_postes_staff cascade;
