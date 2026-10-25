-- ════════════════════════════════════════════════════════════════════
--  Le Prix de la Trêve — Recrutement v2
--  Schéma dédié `recrutement` dans le projet Supabase partagé.
--  Additif : ne touche à aucune table existante (genealogy, public).
--  Les droits staff réutilisent genealogy.staff_members (connexion Discord).
-- ════════════════════════════════════════════════════════════════════

create schema if not exists recrutement;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net;

-- ───────────── Droits staff (même table que le site Généalogie) ─────────────
create or replace function recrutement.est_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from genealogy.staff_members where auth_user_id = auth.uid());
$$;
create or replace function recrutement.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from genealogy.staff_members where auth_user_id = auth.uid() and role = 'admin');
$$;
create or replace function recrutement.staff_nom() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select discord_username from genealogy.staff_members where auth_user_id = auth.uid()), 'staff');
$$;
create or replace function recrutement.discord_id_connecte() returns text
language sql stable set search_path = '' as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'provider_id', '');
$$;

-- ───────────── Tables ─────────────
create table if not exists recrutement.groupes (          -- pôles staff et clans
  id text primary key,
  categorie text not null check (categorie in ('pole','clan')),
  nom text not null,
  description text not null default '',
  description_longue text not null default '',
  couleur text not null default '#b8813a',
  icone text,
  ordre int not null default 0
);

create table if not exists recrutement.postes (           -- rôles staff + rangs de clan
  id serial primary key,
  categorie text not null check (categorie in ('staff','hr')),
  groupe text not null references recrutement.groupes(id) on update cascade,
  nom text not null,
  description text,
  missions text[] not null default '{}',
  anciennete text,
  disponibilite text,
  note_candidat text,
  type_rang text check (type_rang in ('meneur','lieutenant','guerisseur','apprenti')),
  titulaire text,
  note text,
  statut text not null default 'ouvert' check (statut in ('ouvert','complet','indispo')),
  places_total int not null default 1 check (places_total >= 0),
  places_dispo int not null default 1 check (places_dispo >= 0),
  questions jsonb not null default '[]',
  options jsonb not null default '[]',
  ouvert_le timestamptz,
  ordre int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists recrutement.formulaires (      -- structure des formulaires, éditable
  type text primary key check (type in ('staff','hr','oc3','oc4')),
  titre text not null,
  description text not null default '',
  ouvert boolean not null default true,
  etapes jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists recrutement.candidatures (
  id uuid primary key default gen_random_uuid(),
  code_suivi text unique not null,
  type text not null check (type in ('staff','hr','oc3','oc4')),
  poste_id int references recrutement.postes(id) on delete set null,
  postes_secondaires int[] not null default '{}',
  resume text,
  pseudo_discord text not null,
  discord_id text,
  user_id uuid,
  statut text not null default 'recue' check (statut in ('recue','examen','acceptee','refusee','retiree')),
  reponses jsonb not null default '{}',
  assigne_a text,
  message_public text,
  decide_le timestamptz,
  rappel_envoye boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cand_statut_idx on recrutement.candidatures (statut);
create index if not exists cand_pseudo_idx on recrutement.candidatures (lower(pseudo_discord));
create index if not exists cand_user_idx on recrutement.candidatures (user_id);
create index if not exists cand_discord_idx on recrutement.candidatures (discord_id);

create table if not exists recrutement.evenements (       -- frise visible par le candidat
  id bigserial primary key,
  candidature_id uuid not null references recrutement.candidatures(id) on delete cascade,
  type text not null check (type in ('recue','examen','acceptee','refusee','retiree','message')),
  message text,
  public boolean not null default true,
  auteur text,
  created_at timestamptz not null default now()
);
create index if not exists evt_cand_idx on recrutement.evenements (candidature_id);

create table if not exists recrutement.notes (            -- notes internes
  id bigserial primary key,
  candidature_id uuid not null references recrutement.candidatures(id) on delete cascade,
  auteur text not null,
  contenu text not null,
  created_at timestamptz not null default now()
);

create table if not exists recrutement.votes (            -- avis internes des staffs
  candidature_id uuid not null references recrutement.candidatures(id) on delete cascade,
  staff_id uuid not null,
  staff_nom text not null,
  vote text not null check (vote in ('pour','contre','neutre')),
  commentaire text,
  updated_at timestamptz not null default now(),
  primary key (candidature_id, staff_id)
);

create table if not exists recrutement.liste_attente (
  id serial primary key,
  poste_id int not null references recrutement.postes(id) on delete cascade,
  pseudo_discord text not null,
  discord_id text,
  notifie boolean not null default false,
  created_at timestamptz not null default now(),
  unique (poste_id, pseudo_discord)
);

create table if not exists recrutement.membres_discord (
  pseudo_discord text primary key,
  discord_id text not null,
  updated_at timestamptz not null default now()
);

create table if not exists recrutement.modeles (          -- réponses types
  id serial primary key,
  kind text not null check (kind in ('acceptee','refusee','examen')),
  titre text not null,
  contenu text not null,
  ordre int not null default 0
);

create table if not exists recrutement.faq (
  id serial primary key,
  section text not null,
  question text not null,
  reponse text not null,
  ordre int not null default 0,
  publie boolean not null default true
);

create table if not exists recrutement.parametres (       -- réglages publics
  cle text primary key,
  valeur jsonb not null
);

create table if not exists recrutement.secrets (          -- webhooks Discord : jamais exposés au public
  cle text primary key,
  valeur text not null
);

-- ───────────── updated_at / ouverture de poste ─────────────
create or replace function recrutement.tg_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger touch_candidatures before update on recrutement.candidatures
  for each row execute function recrutement.tg_touch();
create trigger touch_formulaires before update on recrutement.formulaires
  for each row execute function recrutement.tg_touch();

create or replace function recrutement.tg_postes_avant() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if new.statut = 'ouvert' and new.ouvert_le is null then new.ouvert_le := now(); end if;
  elsif new.statut = 'ouvert' and old.statut is distinct from 'ouvert' then
    new.ouvert_le := now();
  end if;
  return new;
end $$;
create trigger postes_avant before insert or update on recrutement.postes
  for each row execute function recrutement.tg_postes_avant();

-- ───────────── Discord (côté serveur : les webhooks ne sortent jamais) ─────────────
create or replace function recrutement.discord(p_canal text, p_payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_url text;
begin
  select valeur into v_url from recrutement.secrets where cle = 'webhook_' || p_canal;
  if v_url is null or v_url = '' then return; end if;
  perform net.http_post(url := v_url,
    body := p_payload || jsonb_build_object('allowed_mentions', jsonb_build_object('parse', jsonb_build_array('users'))),
    headers := '{"Content-Type":"application/json"}'::jsonb);
exception when others then
  null; -- Discord ne doit jamais empêcher une candidature
end $$;

create or replace function recrutement.site_url() returns text
language sql stable set search_path = '' as $$
  select coalesce((select valeur #>> '{}' from recrutement.parametres where cle = 'site_url'), '');
$$;

create or replace function recrutement.libelle_type(t text) returns text
language sql immutable set search_path = '' as $$
  select case t when 'staff' then 'Staff' when 'hr' then 'Haut Rang' when 'oc3' then '3ème OC' when 'oc4' then '4ème OC' else t end;
$$;

-- Nouvelle candidature → salon staff / hr / oc
create or replace function recrutement.tg_cand_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_fields jsonb;
begin
  select coalesce(jsonb_agg(f), '[]'::jsonb) into v_fields from (
    select jsonb_build_object('name', left(i ->> 'q', 250), 'value', left(coalesce(nullif(i ->> 'r', ''), '—'), 300)) as f
    from jsonb_array_elements(coalesce(new.reponses -> 'sections', '[]'::jsonb)) s,
         jsonb_array_elements(coalesce(s -> 'items', '[]'::jsonb)) i
    limit 8) t;
  perform recrutement.discord(case new.type when 'staff' then 'staff' when 'hr' then 'hr' else 'oc' end,
    jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
      'title', 'Nouvelle candidature — ' || recrutement.libelle_type(new.type),
      'description', '**' || new.pseudo_discord || '**' || coalesce(' · ' || new.resume, '') ||
        E'\nCode : `' || new.code_suivi || E'`\n[Ouvrir dans le dashboard](' || recrutement.site_url() || '#/staff/candidatures/' || new.id || ')',
      'color', 12091706,
      'fields', v_fields,
      'timestamp', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))));
  return new;
end $$;
create trigger cand_insert after insert on recrutement.candidatures
  for each row execute function recrutement.tg_cand_insert();

-- Changement de statut → décision au candidat + journal admin
create or replace function recrutement.tg_cand_statut() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_mention text;
begin
  if new.statut is not distinct from old.statut then return new; end if;
  perform recrutement.discord('admin', jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
    'title', 'Statut modifié', 'color', 5933744,
    'description', '`' || new.code_suivi || '` · **' || new.pseudo_discord || E'**\n' || old.statut || ' → **' || new.statut || '**'))));
  if new.statut in ('acceptee', 'refusee') then
    v_mention := case when new.discord_id ~ '^\d{17,20}$' then '<@' || new.discord_id || '>' else '' end;
    perform recrutement.discord('candidats', jsonb_build_object('content', v_mention,
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', case new.statut when 'acceptee' then '🎉 Candidature acceptée' else 'Candidature refusée' end,
        'color', case new.statut when 'acceptee' then 5135996 else 11686538 end,
        'description', '**' || new.pseudo_discord || E'**, ta candidature `' || new.code_suivi || E'` a reçu une réponse.\n\n' ||
          left(coalesce(new.message_public, ''), 1500),
        'fields', jsonb_build_array(jsonb_build_object('name', 'Lire la réponse complète',
          'value', recrutement.site_url() || '#/suivi/' || new.code_suivi))))));
  end if;
  return new;
end $$;
create trigger cand_statut after update of statut on recrutement.candidatures
  for each row execute function recrutement.tg_cand_statut();

-- Note interne → salon admin
create or replace function recrutement.tg_note_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare c recrutement.candidatures;
begin
  select * into c from recrutement.candidatures where id = new.candidature_id;
  perform recrutement.discord('admin', jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
    'title', 'Note ajoutée', 'color', 5933744,
    'description', '`' || c.code_suivi || '` · **' || c.pseudo_discord || '**',
    'fields', jsonb_build_array(
      jsonb_build_object('name', 'Auteur', 'value', new.auteur, 'inline', true),
      jsonb_build_object('name', 'Note', 'value', left(new.contenu, 1000)))))));
  return new;
end $$;
create trigger note_insert after insert on recrutement.notes
  for each row execute function recrutement.tg_note_insert();

-- Poste qui ouvre → annonce publique + ping de la liste d'attente
create or replace function recrutement.tg_poste_ouvre() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_mentions text; v_ids int[]; v_nom text;
begin
  if not (new.statut = 'ouvert' and old.statut is distinct from 'ouvert') then return new; end if;
  v_nom := case when new.categorie = 'hr'
    then new.nom || ' — ' || (select nom from recrutement.groupes where id = new.groupe) else new.nom end;
  perform recrutement.discord('ouvertures', jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
    'title', '🌿 Recrutement ouvert', 'color', 5135996,
    'description', '**' || v_nom || '**',
    'fields', jsonb_build_array(jsonb_build_object('name', 'Candidater', 'value', recrutement.site_url() || '#/candidater'))))));
  select string_agg(case when coalesce(a.discord_id, m.discord_id) ~ '^\d{17,20}$'
                         then '<@' || coalesce(a.discord_id, m.discord_id) || '>' else '@' || a.pseudo_discord end, ' '),
         array_agg(a.id)
    into v_mentions, v_ids
    from recrutement.liste_attente a
    left join recrutement.membres_discord m on lower(m.pseudo_discord) = lower(a.pseudo_discord)
   where a.poste_id = new.id and not a.notifie;
  if v_ids is not null then
    perform recrutement.discord('candidats', jsonb_build_object('content', v_mentions,
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', '📣 Un poste vient d''ouvrir', 'color', 6094764,
        'description', 'Le poste **' || v_nom || E'** est de nouveau disponible. Tu étais sur la liste d''attente : c''est le moment de candidater !'))));
    update recrutement.liste_attente set notifie = true where id = any(v_ids);
  end if;
  return new;
end $$;
create trigger poste_ouvre after update of statut on recrutement.postes
  for each row execute function recrutement.tg_poste_ouvre();

-- Rappel : candidatures « reçues » depuis plus de 48 h
create or replace function recrutement.rappel_48h() returns void
language plpgsql security definer set search_path = '' as $$
declare v_txt text; v_ids uuid[];
begin
  select string_agg('• `' || code_suivi || '` ' || pseudo_discord || ' (' || recrutement.libelle_type(type) || ') — ' ||
           extract(day from now() - created_at)::int || ' j', E'\n' order by created_at),
         array_agg(id)
    into v_txt, v_ids
    from (select * from recrutement.candidatures
           where statut = 'recue' and not rappel_envoye and created_at < now() - interval '48 hours'
           order by created_at limit 20) t;
  if v_ids is not null then
    perform recrutement.discord('admin', jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
      'title', '⏰ Candidatures en attente depuis plus de 48 h', 'color', 11686538, 'description', v_txt))));
    update recrutement.candidatures set rappel_envoye = true where id = any(v_ids);
  end if;
end $$;

do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('recrutement-rappel-48h', '0 * * * *', 'select recrutement.rappel_48h()');
exception when others then
  raise notice 'pg_cron indisponible (%) : activez-le dans Database > Extensions puis relancez ce bloc.', sqlerrm;
end $$;

-- ───────────── RPC publiques ─────────────
create or replace function recrutement._suivi_json(c recrutement.candidatures) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', c.code_suivi, 'type', c.type, 'statut', c.statut, 'pseudo', c.pseudo_discord, 'resume', c.resume,
    'cree_le', c.created_at, 'maj_le', c.updated_at, 'decide_le', c.decide_le, 'message', c.message_public,
    'frise', coalesce((select jsonb_agg(jsonb_build_object('type', e.type, 'message', e.message, 'date', e.created_at) order by e.created_at)
                         from recrutement.evenements e where e.candidature_id = c.id and e.public), '[]'::jsonb));
$$;

create or replace function recrutement.suivi_code(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c recrutement.candidatures;
begin
  select * into c from recrutement.candidatures where code_suivi = upper(btrim(p_code));
  if not found then return null; end if;
  return recrutement._suivi_json(c);
end $$;

create or replace function recrutement.suivi_pseudo(p_pseudo text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', code_suivi, 'type', type, 'statut', statut, 'cree_le', created_at)
                            order by created_at desc), '[]'::jsonb)
  from (select * from recrutement.candidatures where lower(pseudo_discord) = lower(btrim(p_pseudo))
        order by created_at desc limit 20) t;
$$;

create or replace function recrutement.mes_candidatures() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(recrutement._suivi_json(c) order by c.created_at desc), '[]'::jsonb)
  from recrutement.candidatures c
  where auth.uid() is not null
    and (c.user_id = auth.uid() or (c.discord_id is not null and c.discord_id = recrutement.discord_id_connecte()));
$$;

create or replace function recrutement.retirer(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  update recrutement.candidatures set statut = 'retiree', decide_le = null
   where code_suivi = upper(btrim(p_code)) and statut in ('recue', 'examen') returning id into v_id;
  if v_id is null then return false; end if;
  insert into recrutement.evenements (candidature_id, type, message, auteur) values (v_id, 'retiree', 'Candidature retirée par son auteur.', 'candidat');
  return true;
end $$;

create or replace function recrutement.soumettre(p_type text, p_poste_id int, p_secondaires int[], p_pseudo text,
                                                  p_discord_id text, p_reponses jsonb, p_resume text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_form recrutement.formulaires; v_poste recrutement.postes; v_code text; v_id uuid; v_try int := 0;
  v_discord text := coalesce(recrutement.discord_id_connecte(), p_discord_id);
begin
  if (select valeur from recrutement.parametres where cle = 'recrutement_ouvert') = 'false'::jsonb then
    raise exception 'recrutement_ferme'; end if;
  select * into v_form from recrutement.formulaires where type = p_type;
  if not found or not v_form.ouvert then raise exception 'formulaire_ferme'; end if;
  p_pseudo := btrim(coalesce(p_pseudo, ''));
  if length(p_pseudo) < 2 or length(p_pseudo) > 60 then raise exception 'pseudo_invalide'; end if;
  if v_discord is not null and v_discord !~ '^\d{17,20}$' then v_discord := null; end if;
  if length(p_reponses::text) > 80000 then raise exception 'reponses_trop_longues'; end if;
  if p_type in ('staff', 'hr') then
    select * into v_poste from recrutement.postes where id = p_poste_id and categorie = p_type;
    if not found or v_poste.statut <> 'ouvert' then raise exception 'poste_indisponible'; end if;
  else
    p_poste_id := null; p_secondaires := '{}';
  end if;
  if exists (select 1 from recrutement.candidatures where lower(pseudo_discord) = lower(p_pseudo) and type = p_type
              and statut in ('recue', 'examen')) then raise exception 'doublon'; end if;
  if (select count(*) from recrutement.candidatures where lower(pseudo_discord) = lower(p_pseudo)
       and created_at > now() - interval '24 hours') >= 5 then raise exception 'trop_de_candidatures'; end if;
  loop
    v_code := 'TRV-' || upper(substr(translate(encode(extensions.gen_random_bytes(6), 'base64'), '+/=', 'XYZ'), 1, 6));
    exit when not exists (select 1 from recrutement.candidatures where code_suivi = v_code);
    v_try := v_try + 1; if v_try > 8 then raise exception 'code_indisponible'; end if;
  end loop;
  insert into recrutement.candidatures (code_suivi, type, poste_id, postes_secondaires, resume, pseudo_discord, discord_id, user_id, reponses)
  values (v_code, p_type, p_poste_id, coalesce(p_secondaires, '{}'), left(p_resume, 200), p_pseudo, v_discord, auth.uid(), p_reponses)
  returning id into v_id;
  insert into recrutement.evenements (candidature_id, type, message, auteur)
  values (v_id, 'recue', 'Ta candidature est bien arrivée chez nous.', 'système');
  return v_code;
end $$;

create or replace function recrutement.rejoindre_attente(p_poste_id int, p_pseudo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  p_pseudo := btrim(coalesce(p_pseudo, ''));
  if length(p_pseudo) < 2 or length(p_pseudo) > 60 then raise exception 'pseudo_invalide'; end if;
  if not exists (select 1 from recrutement.postes where id = p_poste_id and statut <> 'ouvert') then
    raise exception 'poste_ouvert'; end if;
  insert into recrutement.liste_attente (poste_id, pseudo_discord, discord_id)
  values (p_poste_id, p_pseudo, recrutement.discord_id_connecte())
  on conflict (poste_id, pseudo_discord) do nothing;
end $$;

create or replace function recrutement.stats_publiques() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'postes_ouverts', (select count(*) from recrutement.postes where statut = 'ouvert'),
    'places', (select coalesce(sum(places_dispo), 0) from recrutement.postes where statut = 'ouvert' and categorie = 'staff')
            + (select count(*) from recrutement.postes where statut = 'ouvert' and categorie = 'hr'),
    'candidatures', (select count(*) from recrutement.candidatures),
    'acceptees', (select count(*) from recrutement.candidatures where statut = 'acceptee'),
    'delai_jours', (select round((percentile_cont(0.5) within group (order by extract(epoch from decide_le - created_at) / 86400))::numeric, 1)
                      from recrutement.candidatures where decide_le is not null));
$$;

-- ───────────── RPC staff ─────────────
create or replace function recrutement.changer_statut(p_id uuid, p_statut text, p_message text default null,
                                                       p_cloturer boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare c recrutement.candidatures; v_msg text := nullif(btrim(coalesce(p_message, '')), '');
begin
  if not recrutement.est_staff() then raise exception 'non_autorise'; end if;
  select * into c from recrutement.candidatures where id = p_id;
  if not found then raise exception 'introuvable'; end if;
  if p_statut in ('acceptee', 'refusee') and (v_msg is null or length(v_msg) < 20) then
    raise exception 'message_requis'; end if;
  update recrutement.candidatures set statut = p_statut,
         message_public = coalesce(v_msg, message_public),
         decide_le = case when p_statut in ('acceptee', 'refusee') then now() else null end
   where id = p_id;
  insert into recrutement.evenements (candidature_id, type, message, auteur, public)
  values (p_id, p_statut, v_msg, recrutement.staff_nom(), p_statut <> 'retiree');
  -- Clôture automatique : une place en moins (staff) ou rang pourvu (hr)
  if p_cloturer and p_statut = 'acceptee' and c.poste_id is not null then
    update recrutement.postes set
      places_dispo = case when categorie = 'staff' then greatest(places_dispo - 1, 0) else 0 end,
      statut = case when categorie = 'hr' or places_dispo <= 1 then (case when categorie = 'hr' then 'indispo' else 'complet' end) else statut end
     where id = c.poste_id;
  end if;
end $$;

-- ───────────── RLS ─────────────
alter table recrutement.groupes        enable row level security;
alter table recrutement.postes         enable row level security;
alter table recrutement.formulaires    enable row level security;
alter table recrutement.candidatures   enable row level security;
alter table recrutement.evenements     enable row level security;
alter table recrutement.notes          enable row level security;
alter table recrutement.votes          enable row level security;
alter table recrutement.liste_attente  enable row level security;
alter table recrutement.membres_discord enable row level security;
alter table recrutement.modeles        enable row level security;
alter table recrutement.faq            enable row level security;
alter table recrutement.parametres     enable row level security;
alter table recrutement.secrets        enable row level security;

-- Lecture publique : contenu éditorial uniquement
create policy lire_groupes     on recrutement.groupes     for select to anon, authenticated using (true);
create policy lire_postes      on recrutement.postes      for select to anon, authenticated using (true);
create policy lire_formulaires on recrutement.formulaires for select to anon, authenticated using (true);
create policy lire_parametres  on recrutement.parametres  for select to anon, authenticated using (true);
create policy lire_faq         on recrutement.faq         for select to anon, authenticated using (publie or recrutement.est_staff());

-- Écriture : staff (contenu courant) / admin (structure, réglages, secrets)
create policy staff_groupes   on recrutement.groupes   for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_postes    on recrutement.postes    for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_faq       on recrutement.faq       for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_modeles   on recrutement.modeles   for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy admin_formulaires on recrutement.formulaires for all to authenticated using (recrutement.est_admin()) with check (recrutement.est_admin());
create policy admin_parametres  on recrutement.parametres  for all to authenticated using (recrutement.est_admin()) with check (recrutement.est_admin());
create policy admin_secrets     on recrutement.secrets     for all to authenticated using (recrutement.est_admin()) with check (recrutement.est_admin());

-- Données des candidats : staff uniquement (les candidats passent par les RPC)
create policy staff_candidatures on recrutement.candidatures  for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_evenements   on recrutement.evenements   for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_notes        on recrutement.notes        for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_attente      on recrutement.liste_attente for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy staff_membres      on recrutement.membres_discord for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
create policy voir_votes         on recrutement.votes for select to authenticated using (recrutement.est_staff());
create policy ecrire_vote        on recrutement.votes for insert to authenticated with check (recrutement.est_staff() and staff_id = auth.uid());
create policy modifier_vote      on recrutement.votes for update to authenticated using (staff_id = auth.uid()) with check (staff_id = auth.uid());
create policy supprimer_vote     on recrutement.votes for delete to authenticated using (staff_id = auth.uid());

-- ───────────── Droits ─────────────
grant usage on schema recrutement to anon, authenticated;
grant select on recrutement.groupes, recrutement.postes, recrutement.formulaires, recrutement.parametres, recrutement.faq to anon;
grant select, insert, update, delete on all tables in schema recrutement to authenticated;
grant usage, select on all sequences in schema recrutement to authenticated;

revoke all on function recrutement.soumettre(text, int, int[], text, text, jsonb, text),
                       recrutement.suivi_code(text), recrutement.suivi_pseudo(text), recrutement.mes_candidatures(),
                       recrutement.retirer(text), recrutement.rejoindre_attente(int, text), recrutement.stats_publiques(),
                       recrutement.changer_statut(uuid, text, text, boolean) from public;
grant execute on function recrutement.soumettre(text, int, int[], text, text, jsonb, text),
                          recrutement.suivi_code(text), recrutement.suivi_pseudo(text), recrutement.mes_candidatures(),
                          recrutement.retirer(text), recrutement.rejoindre_attente(int, text), recrutement.stats_publiques()
  to anon, authenticated;
grant execute on function recrutement.changer_statut(uuid, text, text, boolean) to authenticated;
-- Fonctions internes : jamais appelables depuis le navigateur (sinon n'importe qui pourrait poster sur Discord)
revoke all on function recrutement.discord(text, jsonb), recrutement.rappel_48h(),
                       recrutement._suivi_json(recrutement.candidatures), recrutement.site_url(),
                       recrutement.libelle_type(text) from public, anon, authenticated;
-- (les fonctions est_staff / est_admin / staff_nom sont appelées par les policies)
grant execute on function recrutement.est_staff(), recrutement.est_admin(), recrutement.staff_nom(), recrutement.discord_id_connecte()
  to anon, authenticated;

-- ───────────── Rôle de l'utilisateur connecté ─────────────
-- Rattache aussi automatiquement un staff déclaré par son ID Discord (comme le site Généalogie).
create or replace function recrutement.mon_role() returns text
language plpgsql security definer set search_path = '' as $$
declare v_role text; v_did text := recrutement.discord_id_connecte();
begin
  if auth.uid() is null then return null; end if;
  select role into v_role from genealogy.staff_members where auth_user_id = auth.uid();
  if v_role is null and v_did ~ '^\d{17,20}$' then
    update genealogy.staff_members set auth_user_id = auth.uid()
     where auth_user_id is null and discord_user_id = v_did::bigint returning role into v_role;
  end if;
  return v_role;
end $$;

-- Envoie un message de test sur un salon (admin uniquement)
create or replace function recrutement.tester_webhook(p_canal text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not recrutement.est_admin() then raise exception 'non_autorise'; end if;
  perform recrutement.discord(p_canal, jsonb_build_object('embeds', jsonb_build_array(jsonb_build_object(
    'title', '✅ Webhook opérationnel', 'color', 5135996,
    'description', 'Message de test envoyé depuis le dashboard recrutement.'))));
end $$;
revoke all on function recrutement.mon_role(), recrutement.tester_webhook(text) from public, anon;
grant execute on function recrutement.mon_role(), recrutement.tester_webhook(text) to authenticated;

-- Temps réel : le dashboard affiche les nouvelles candidatures sans recharger
do $$ begin
  alter publication supabase_realtime add table recrutement.candidatures;
exception when others then
  raise notice 'Realtime non activé : %', sqlerrm;
end $$;

-- ⚠ À faire à la main dans le dashboard Supabase :
--   Settings > API > « Exposed schemas » : ajouter `recrutement`.
