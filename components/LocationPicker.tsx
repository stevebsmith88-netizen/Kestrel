import { switchLocation } from "@/lib/location-actions";
import type { MyClinic } from "@/lib/clinic";

// Which location the person is working in, for anyone with more than 1 (phase B, migration 0047). Every clinic page and action follows it.
export default function LocationPicker({ clinics, current, back }: { clinics: MyClinic[]; current: string; back: string }) {
  if (clinics.length < 2) return null;
  return (
    <form action={switchLocation} className="locationpicker">
      <input type="hidden" name="back" value={back} />
      <label className="lab" htmlFor="lp-location">Location</label>
      <select id="lp-location" name="location" defaultValue={current}>
        {clinics.map((c) => (
          <option key={c.id} value={c.id}>{c.clinic_name}, {c.city}</option>
        ))}
      </select>
      <button type="submit" className="btn sm ghost">Switch</button>
    </form>
  );
}
