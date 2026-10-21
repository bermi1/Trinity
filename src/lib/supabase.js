import { createClient } from '@supabase/supabase-js';

// Only the project URL and the publishable key belong in the browser.
// Never put the secret key in a VITE_ variable: it would ship to every visitor.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Without these the app runs on demo data saved in the browser.
export const supabase = url && key && import.meta.env.MODE !== 'test'
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
