// The small badge beside a saved resume's name: PDF for a PDF, DOC for a Word file (review item D-09).
export function fileBadge(filename: string): string {
  return /\.pdf$/i.test(filename.trim()) ? "PDF" : "DOC";
}
