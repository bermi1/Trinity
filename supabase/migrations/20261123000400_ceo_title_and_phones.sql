-- Thadeo is the CEO. Management and the General Manager keep everyone's phone number up to date; anyone may set their own.
update public.profiles set title = 'CEO' where person_key = 'TH';

create or replace function public.set_phone(p_person_key text, p_phone text)
returns void language plpgsql security definer set search_path = '' as $$
declare me public.profiles%rowtype; ph text := regexp_replace(coalesce(p_phone, ''), '[^0-9+ ]', '', 'g');
begin
  select * into me from public.profiles where user_id = auth.uid();
  if not found then raise exception 'Sign in first'; end if;
  if not (me.role in ('ceo', 'gm') or me.is_admin or upper(me.person_key) = upper(p_person_key)) then
    raise exception 'Only Management or the General Manager can change someone else''s number';
  end if;
  if length(regexp_replace(ph, '\D', '', 'g')) not between 9 and 13 then raise exception 'Enter a valid phone number'; end if;
  update public.profiles set phone = trim(ph) where upper(person_key) = upper(trim(p_person_key));
  if not found then raise exception 'No account for %', p_person_key; end if;
end $$;
revoke all on function public.set_phone(text, text) from public, anon;
grant execute on function public.set_phone(text, text) to authenticated;
