// The public address and publishable key of the Supabase project. Both are safe
// to expose to the browser. Returns null until they are set, so the site can
// show a friendly message instead of failing.
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}
