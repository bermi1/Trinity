// Quick unlock with a PIN, like a banking app. After signing in with a password once,
// a person can set a 4–6 digit PIN on this device; reopening the app then asks for the PIN
// instead of the password. Only a salted hash is kept, in this browser. Five wrong tries
// sign the person out, so the password is needed again.
const KEY = 'tm360-pin';
const UNLOCKED = 'tm360-unlocked';
export const MAX_TRIES = 5;
export const LOCK_AFTER_MS = 5 * 60 * 1000;

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
const write = v => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} };

async function digest(salt, pin) {
  const bytes = new TextEncoder().encode(salt + ':' + pin);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const pinFor = user => { const p = read(); return p && p.user === user ? p : null; };
export const isValidPin = pin => /^\d{4,6}$/.test(pin) && !/^(\d)\1+$/.test(pin) && !'0123456789'.includes(pin) && !'9876543210'.includes(pin);

export async function savePin(user, pin) {
  const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  write({ user, salt, hash: await digest(salt, pin), tries: 0 });
  markUnlocked();
}

// Returns 'ok', 'wrong' (with tries left) or 'locked-out'.
export async function checkPin(user, pin) {
  const p = pinFor(user);
  if (!p) return { result: 'locked-out' };
  if (await digest(p.salt, pin) === p.hash) { write({ ...p, tries: 0 }); markUnlocked(); return { result: 'ok' }; }
  const tries = (p.tries || 0) + 1;
  if (tries >= MAX_TRIES) { write(null); return { result: 'locked-out' }; }
  write({ ...p, tries });
  return { result: 'wrong', left: MAX_TRIES - tries };
}

export const clearPin = () => { write(null); clearUnlocked(); };
export const markUnlocked = () => { try { sessionStorage.setItem(UNLOCKED, '1'); } catch (e) {} };
export const clearUnlocked = () => { try { sessionStorage.removeItem(UNLOCKED); } catch (e) {} };
export const isUnlocked = () => { try { return sessionStorage.getItem(UNLOCKED) === '1'; } catch (e) { return false; } };
