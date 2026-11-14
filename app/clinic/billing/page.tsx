import { redirect } from "next/navigation";

// Billing is now part of Plans and billing (Steve, 14th November 2026), so an old link or bookmark goes there.
export default function ClinicBilling() {
  redirect("/clinic/plans#payments");
}
