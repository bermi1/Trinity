// event-sms: texts an attendee their registration number right after they register.
// Called by the registration page with { id } (the new registration). It only sends to the phone stored
// on that registration, once, within 15 minutes of registering, so it cannot be used to text other numbers.
// The Textify Africa API key lives in the TEXTIFY_API_KEY secret, never in the app.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const TEXTIFY = "https://portal.textify.africa/api/v1/messages";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Tanzanian numbers in the 07xx / 06xx form Textify accepts.
function local(phone: string) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("255") && d.length === 12) return "0" + d.slice(3);
  if (d.length === 9) return "0" + d;
  return d;
}
const pad = (n: number) => String(n).padStart(3, "0");
// Plain GSM characters only (no emoji or special dots), so the SMS stays cheap.
const gsm = (s: string) => String(s || "").replace(/[·•–—]/g, "-").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\n]/g, "");

async function textify(key: string, SENDER: string, receiver: string, content: string) {
  const r = await fetch(TEXTIFY, { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender_name: SENDER, is_scheduled: false, messages: receiver ? [{ receiver, content }] : [] }) });
  const text = await r.text(); let body: unknown = text; try { body = JSON.parse(text); } catch (_) { /* not JSON */ }
  return { status: r.status, body };
}

// The Textify key and sender name: an Edge Function secret if set, else the locked server_secrets table.
async function setting(db: ReturnType<typeof createClient>, name: string, fallback = "") {
  const v = Deno.env.get(name); if (v) return v;
  const { data } = await db.from("server_secrets").select("value").eq("name", name).maybeSingle();
  return (data && data.value) || fallback;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const key = await setting(db, "TEXTIFY_API_KEY"), SENDER = await setting(db, "TEXTIFY_SENDER", "Textify");
  if (!key) return json({ ok: false, error: "SMS is not set up (TEXTIFY_API_KEY missing)" }, 503);
  let input: { id?: string; probe?: boolean } = {};
  try { input = await req.json(); } catch (_) { return json({ ok: false, error: "Send JSON" }, 400); }

  // Probe: checks the key with Textify without sending anything (an empty message list).
  if (input.probe) { const r = await textify(key, SENDER, "", ""); return json({ ok: r.status !== 401 && r.status !== 403, textify: r }); }

  if (!input.id) return json({ ok: false, error: "Missing registration id" }, 400);
  const { data: reg } = await db.from("event_registrations").select("id, event_id, badge_no, full_name, phone, created_at, sms_status").eq("id", input.id).maybeSingle();
  if (!reg) return json({ ok: false, error: "Registration not found" }, 404);
  if (reg.sms_status === "sent") return json({ ok: true, already: true });
  if (Date.now() - new Date(reg.created_at).getTime() > 15 * 60 * 1000) return json({ ok: false, error: "Too late to send the confirmation" }, 409);
  const { data: ev } = await db.from("events").select("title, event_date, event_time, venue").eq("id", reg.event_id).maybeSingle();

  const first = String(reg.full_name || "").trim().split(/\s+/)[0];
  const when = [ev?.event_date, ev?.event_time].filter(Boolean).join(" ");
  const content = gsm(`Karibu ${first}! Umesajiliwa: ${ev?.title || "tukio"}. Namba yako ya usajili: ${pad(reg.badge_no)}.` + (when || ev?.venue ? ` ${[when, ev?.venue].filter(Boolean).join(", ")}.` : "") + " Onyesha namba hii mezani. - Trinity Mark Solutions");
  const r = await textify(key, SENDER, local(reg.phone), content);
  const ok = r.status >= 200 && r.status < 300 && !(r.body && typeof r.body === "object" && (r.body as Record<string, unknown>).success === false);
  await db.from("event_registrations").update({ sms_status: ok ? "sent" : "failed", sms_at: new Date().toISOString(), sms_error: ok ? "" : String(JSON.stringify(r.body)).slice(0, 300) }).eq("id", reg.id);
  return json({ ok, status: r.status, textify: r.body }, ok ? 200 : 502);
});
