import "server-only";
import { isDemoAccountEmail } from "@/lib/admin-candidates";
import { supabaseAdmin } from "@/lib/supabase-server";

type Db = NonNullable<ReturnType<typeof supabaseAdmin>>;

// Every account's sign in email, read a page of 1,000 at a time. Fine at Kestrel's size.
export async function loadAccountEmails(db: Db): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  for (let page = 1; page <= 30; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    users.forEach((u) => emails.set(u.id, u.email ?? ""));
    if (users.length < 1000) break;
  }
  return emails;
}

// The ids of the demo and test accounts, left out of the admin counts, the candidate list and Insights.
export const demoAccountIds = (emails: Map<string, string>): Set<string> =>
  new Set([...emails].filter(([, email]) => isDemoAccountEmail(email)).map(([id]) => id));
