// The cookie Supabase keeps a sign in in (sb-<project>-auth-token, sometimes split into .0, .1 and so on). Only its name is checked, in the
// browser, to decide whether to ask /api/me who is signed in (audit P1-10). Having the cookie proves nothing: /api/me checks it properly.
export const SIGNED_IN_COOKIE = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/;
