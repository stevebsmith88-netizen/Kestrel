// The ids of the inbox messages ticked in a form. Anything that is not a valid id is ignored, repeats are dropped and at most 100 are taken.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idsFrom(formData: FormData): string[] {
  return [...new Set(formData.getAll("ids").map(String).filter((id) => UUID.test(id)))].slice(0, 100);
}
