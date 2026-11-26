-- Trinity Mark 360 · registered faces stored one row per person.
-- Staff now register their own face on their own device ("My check-in"). Faces used to be one shared row
-- (collection 'faces', id '*'); two people registering at once could overwrite each other. This splits that
-- row into one row per person (id = the person's key). The app does the same on its first save, so this
-- is optional, and safe to run again.
begin;
insert into public.app_records (collection, id, position, data)
select 'faces', f.e->>'k', (f.ord - 1)::int, f.e
from public.app_records r
cross join lateral jsonb_array_elements(case when jsonb_typeof(r.data) = 'array' then r.data else '[]'::jsonb end) with ordinality as f(e, ord)
where r.collection = 'faces' and r.id = '*' and coalesce(f.e->>'k', '') <> ''
on conflict (collection, id) do nothing;
delete from public.app_records where collection = 'faces' and id = '*';
commit;
