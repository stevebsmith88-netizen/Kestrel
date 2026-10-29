import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

// A single place to send people after they sign in: each role goes to its own home.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  redirect(homeFor(session.role));
}
