-- Un membre peut appartenir à plusieurs équipes (déjà appliqué sur le projet).
alter table recrutement.equipe add column if not exists categories text[] not null default '{}';
update recrutement.equipe set categories = array[categorie] where cardinality(categories) = 0;
alter table recrutement.equipe drop column categorie;
alter table recrutement.equipe add constraint equipe_categories_check
  check (cardinality(categories) >= 1 and categories <@ array['fondateur','moderateur','guide','narration','apprenti_guide','apprenti_narration']);
