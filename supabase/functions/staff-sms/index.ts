// staff-sms: sends a short SMS to a member of staff (money requests: needs approval, approved, paid, declined).
// Only signed-in Trinity Mark accounts may call it, and it only texts phone numbers saved on staff accounts.
// The Textify Africa API key lives in the TEXTIFY_API_KEY secret, never in the app.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const TEXTIFY = "https://portal.textify.africa/api/v1/messages";
const SENDER = Deno.env.get("TEXTIFY_SENDER") || "Textify";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const local = (p: string) => { const d = String(p || "").replace(/\D/g, ""); return d.startsWith("255") && d.length === 12 ? "0" + d.slice(3) : d.length === 9 ? "0" + d : d; };
const gsm = (s: string) => String(s || "").replace(/[·•–—]/g, "-").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\n]/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const key = Deno.env.get("TEXTIFY_API_KEY");
  if (!key) return json({ ok: false, error: "SMS is not set up (TEXTIFY_API_KEY missing)" }, 503);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = token ? await db.auth.getUser(token) : { data: { user: null } };
  if (!who || !who.user) return json({ ok: false, error: "Sign in first" }, 401);
  const { data: me } = await db.from("profiles").select("person_key").eq("user_id", who.user.id).maybeSingle();
  if (!me) return json({ ok: false, error: "No staff account" }, 403);

  let input: { to?: string; text?: string } = {};
  try { input = await req.json(); } catch (_) { return json({ ok: false, error: "Send JSON" }, 400); }
  const text = gsm(String(input.text || "").trim()).slice(0, 320);
  if (!input.to || !text) return json({ ok: false, error: "Missing person or text" }, 400);
  const { data: p } = await db.from("profiles").select("full_name, phone").ilike("person_key", String(input.to)).maybeSingle();
  if (!p || !p.phone) return json({ ok: false, skipped: "No phone number saved for " + input.to });

  const r = await fetch(TEXTIFY, { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender_name: SENDER, is_scheduled: false, messages: [{ receiver: local(p.phone), content: text }] }) });
  const raw = await r.text(); let body: unknown = raw; try { body = JSON.parse(raw); } catch (_) { /* not JSON */ }
  const ok = r.status >= 200 && r.status < 300 && !(body && typeof body === "object" && (body as Record<string, unknown>).success === false);
  return json({ ok, status: r.status, textify: body }, ok ? 200 : 502);
});
