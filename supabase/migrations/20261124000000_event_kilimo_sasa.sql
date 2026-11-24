-- iMbeju Kilimo Sasa Joint Programme Launch (25 Nov 2026) becomes the open event; Mpango wa Nishati stays as history, closed.
insert into public.events (id, title, subtitle, tagline, event_date, event_time, venue, message, open)
values ('kilimo-sasa-2026', 'iMbeju Kilimo Sasa', 'Joint Programme Launch · Uzinduzi wa Programu ya Pamoja', 'Kilimo Sasa',
        '25 Novemba 2026', '', 'Hyatt Regency (The Kilimanjaro), Dar es Salaam',
        'Asante kwa kujisajili. Karibu kwenye uzinduzi wa iMbeju Kilimo Sasa. Tafadhali fika mapema na uonyeshe namba yako ya usajili mezani.', true)
on conflict (id) do nothing;
update public.events set open = false where id = 'nishati-2026';
