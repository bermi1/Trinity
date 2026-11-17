// Sends queued alerts from the outbox to WhatsApp (Cloud API) or an SMS gateway.
// Not deployed yet. To switch it on:
//   1. Set the secrets in Supabase (never in the app):  WHATSAPP_TOKEN, WHATSAPP_PHONE_ID,
//      WHATSAPP_TEMPLATE (an approved template with one body parameter), SMS_URL, SMS_KEY, SMS_SENDER
//   2. Deploy:  supabase functions deploy notify
//   3. Schedule it every minute (Supabase cron) or call it after each alert.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function whatsapp(phone: string, text: string) {
  const id = Deno.env.get('WHATSAPP_PHONE_ID'), token = Deno.env.get('WHATSAPP_TOKEN'), tpl = Deno.env.get('WHATSAPP_TEMPLATE') || 'trinity_alert';
  if (!id || !token) throw new Error('WhatsApp is not set up');
  const res = await fetch(`https://graph.facebook.com/v21.0/${id}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    // Business-initiated messages must use an approved template; the alert text is its parameter.
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'template',
      template: { name: tpl, language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: text.slice(0, 1000) }] }] } })
  });
  if (!res.ok) throw new Error('WhatsApp ' + res.status + ' ' + await res.text());
}

async function sms(phone: string, text: string) {
  const url = Deno.env.get('SMS_URL'), key = Deno.env.get('SMS_KEY'), from = Deno.env.get('SMS_SENDER') || 'TRINITY';
  if (!url || !key) throw new Error('SMS is not set up');
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ to: phone, from, message: text.slice(0, 459) }) });
  if (!res.ok) throw new Error('SMS ' + res.status);
}

Deno.serve(async () => {
  // The app keeps the outbox in app_records (collection "outbox"), one row per alert.
  const { data, error } = await db.from('app_records').select('id, data').eq('collection', 'outbox').limit(50);
  if (error) return new Response(error.message, { status: 500 });
  let sent = 0;
  for (const row of data || []) {
    const m = row.data;
    if (!m || m.st !== 'queued') continue;
    try { await (m.ch === 'sms' ? sms(m.phone, m.text) : whatsapp(m.phone, m.text)); m.st = 'sent'; sent++; }
    catch (e) { m.st = 'failed'; m.err = String(e).slice(0, 200); }
    await db.from('app_records').update({ data: m }).eq('collection', 'outbox').eq('id', row.id);
  }
  return Response.json({ sent });
});
