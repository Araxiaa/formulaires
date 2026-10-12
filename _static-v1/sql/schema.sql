-- Le Prix de la Trêve — candidatures
-- À exécuter dans le SQL Editor du projet Supabase PARTAGÉ.
-- Toutes les tables sont préfixées cand_ pour ne pas entrer en conflit avec l'arbre généalogique / les bots.

create extension if not exists pgcrypto;

-- ───────────── Tables ─────────────
create table if not exists cand_postes_staff (
  id           serial primary key,
  pole         text not null check (pole in ('guide','narration','batisseur')),
  nom          text not null,
  description  text,
  statut       text not null default 'ouvert' check (statut in ('ouvert','complet','indispo')),
  places_total int  not null default 1,
  places_dispo int  not null default 1,
  ouvert_le    timestamptz,
  updated_at   timestamptz not null default now()
);

create table if not exists cand_postes_hr (
  id         serial primary key,
  clan       text not null check (clan in ('tonnerre','vent','ombre')),
  rang       text not null,
  statut     text not null default 'indispo' check (statut in ('ouvert','indispo')),
  titulaire  text,
  note       text,
  ouvert_le  timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists cand_candidatures (
  id             uuid primary key default gen_random_uuid(),
  code_suivi     text unique not null,
  type           text not null check (type in ('staff','hr','oc3','oc4')),
  poste_id       int references cand_postes_staff(id) on delete set null,
  pseudo_discord text not null,
  statut         text not null default 'recue' check (statut in ('recue','examen','acceptee','refusee','retiree')),
  donnees        jsonb,
  assigne_a      text,
  rappel_envoye  boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists cand_candidatures_pseudo_idx on cand_candidatures (lower(pseudo_discord));

create table if not exists cand_liste_attente (
  id             serial primary key,
  poste_id       int  not null,
  poste_type     text not null check (poste_type in ('staff','hr')),
  pseudo_discord text not null,
  discord_id     text,
  notifie        boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists cand_membres_discord (
  id             serial primary key,
  pseudo_discord text unique not null,
  discord_id     text not null,
  updated_at     timestamptz not null default now()
);

create table if not exists cand_notes (
  id             serial primary key,
  candidature_id uuid references cand_candidatures(id) on delete cascade,
  auteur         text not null,
  contenu        text not null,
  created_at     timestamptz not null default now()
);

-- ───────────── RLS ─────────────
alter table cand_postes_staff   enable row level security;
alter table cand_postes_hr      enable row level security;
alter table cand_candidatures   enable row level security;
alter table cand_liste_attente  enable row level security;
alter table cand_membres_discord enable row level security;
alter table cand_notes          enable row level security;

-- Postes : lecture publique, écriture staff authentifié
create policy "postes_staff_read"  on cand_postes_staff for select using (true);
create policy "postes_staff_write" on cand_postes_staff for all to authenticated using (true) with check (true);
create policy "postes_hr_read"     on cand_postes_hr for select using (true);
create policy "postes_hr_write"    on cand_postes_hr for all to authenticated using (true) with check (true);

-- Candidatures : insertion publique ; lecture/maj réservées au staff.
-- Le suivi public passe par les fonctions RPC ci-dessous (jamais de SELECT public sur la table,
-- sinon n'importe qui pourrait lire toutes les réponses).
create policy "cand_insert_public" on cand_candidatures for insert to anon, authenticated
  with check (statut = 'recue' and assigne_a is null);
create policy "cand_staff_select"  on cand_candidatures for select to authenticated using (true);
create policy "cand_staff_update"  on cand_candidatures for update to authenticated using (true) with check (true);

-- Listes d'attente : insertion publique, reste staff
create policy "attente_insert_public" on cand_liste_attente for insert to anon, authenticated
  with check (discord_id is null and notifie = false);
create policy "attente_staff" on cand_liste_attente for all to authenticated using (true) with check (true);

-- Mémoire pseudo → ID : staff uniquement (les IDs ne sont pas exposés publiquement)
create policy "membres_staff" on cand_membres_discord for all to authenticated using (true) with check (true);

-- Notes internes : staff uniquement
create policy "notes_staff" on cand_notes for all to authenticated using (true) with check (true);

-- ───────────── Fonctions publiques (RPC) ─────────────
create or replace function cand_suivi_code(p_code text)
returns table (code_suivi text, type text, statut text, pseudo_discord text, poste_nom text,
               created_at timestamptz, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select c.code_suivi, c.type, c.statut, c.pseudo_discord,
         coalesce(p.nom, c.donnees->'meta'->>'poste') , c.created_at, c.updated_at
  from cand_candidatures c left join cand_postes_staff p on p.id = c.poste_id
  where c.code_suivi = upper(trim(p_code));
$$;

create or replace function cand_suivi_pseudo(p_pseudo text)
returns table (code_suivi text, type text, statut text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select code_suivi, type, statut, created_at
  from cand_candidatures
  where lower(pseudo_discord) = lower(trim(p_pseudo))
  order by created_at desc limit 30;
$$;

create or replace function cand_retirer(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update cand_candidatures set statut = 'retiree', updated_at = now()
   where code_suivi = upper(trim(p_code)) and statut in ('recue','examen');
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function cand_doublon(p_pseudo text, p_type text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from cand_candidatures
                 where lower(pseudo_discord) = lower(trim(p_pseudo))
                   and type = p_type and statut in ('recue','examen'));
$$;

create or replace function cand_discord_connu(p_pseudo text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from cand_membres_discord where lower(pseudo_discord) = lower(trim(p_pseudo)));
$$;

revoke all on function cand_suivi_code(text), cand_suivi_pseudo(text), cand_retirer(text),
                       cand_doublon(text,text), cand_discord_connu(text) from public;
grant execute on function cand_suivi_code(text), cand_suivi_pseudo(text), cand_retirer(text),
                          cand_doublon(text,text), cand_discord_connu(text) to anon, authenticated;

-- ───────────── Seed ─────────────
insert into cand_postes_staff (id, pole, nom, places_total, places_dispo, statut, ouvert_le) values
  (1,'guide','Parrain/Marraine',2,2,'ouvert',now()),
  (2,'guide','Régisseur·se de fiche',2,2,'ouvert',now()),
  (3,'guide','Généticien·ne',1,1,'ouvert',now()),
  (4,'guide','Animateur/Animatrice',2,2,'ouvert',now()),
  (5,'narration','Gestion RP',1,1,'ouvert',now()),
  (6,'narration','Plume',2,2,'ouvert',now()),
  (7,'narration','Gestion PNJ',2,2,'ouvert',now()),
  (8,'batisseur','Bâtisseur/Bâtisseuse',1,1,'ouvert',now())
on conflict (id) do nothing;
select setval(pg_get_serial_sequence('cand_postes_staff','id'), 8);

insert into cand_postes_hr (clan, rang, statut, titulaire, note, ouvert_le) values
  ('tonnerre','Meneur·se Étoile','indispo','Étoile de Framboisier',null,null),
  ('tonnerre','Lieutenant·e','indispo','Clapotis d''Étang',null,null),
  ('tonnerre','Guérisseur·se','indispo','Aube du Myosotis',null,null),
  ('tonnerre','Apprenti·e','indispo',null,null,null),
  ('vent','Meneur·se Étoile','indispo','Étoile d''Ocre',null,null),
  ('vent','Lieutenant·e','indispo','Rafale des Joncs',null,null),
  ('vent','Guérisseur·se','indispo','Chant de Cigale',null,null),
  ('vent','Apprenti·e','indispo',null,null,null),
  ('ombre','Meneur·se Étoile','indispo','Truffe Champêtre',null,null),
  ('ombre','Lieutenant·e','ouvert',null,null,now()),
  ('ombre','Guérisseur·se','indispo','Illusion du Puceron',null,null),
  ('ombre','Apprenti·e','indispo',null,'Prochainement Petit Lys',null);
