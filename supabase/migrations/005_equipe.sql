-- Annuaire de l'équipe (fondateurs, modérateurs, staffs, apprentis) — déjà appliqué sur le projet.
create table if not exists recrutement.equipe (
  id serial primary key,
  categorie text not null check (categorie in ('fondateur','moderateur','guide','narration','apprenti_guide','apprenti_narration')),
  pseudo text not null,
  titre text,
  specialites text[] not null default '{}',
  ordre int not null default 0,
  created_at timestamptz not null default now()
);
alter table recrutement.equipe enable row level security;
create policy lire_equipe on recrutement.equipe for select to anon, authenticated using (true);
create policy staff_equipe on recrutement.equipe for all to authenticated using (recrutement.est_staff()) with check (recrutement.est_staff());
grant select on recrutement.equipe to anon;
grant select, insert, update, delete on recrutement.equipe to authenticated;
grant usage, select on sequence recrutement.equipe_id_seq to authenticated;
insert into recrutement.equipe (categorie, pseudo, titre, ordre) values
  ('fondateur', '.araxia.', 'Développeuse principale', 1),
  ('fondateur', 'lavnd.13', null, 2);
