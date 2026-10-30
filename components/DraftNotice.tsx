// Shown at the top of legal pages until a lawyer has reviewed them. Set DRAFT to false in the page to remove it.
export default function DraftNotice() {
  return (
    <p className="notice" role="note">
      <strong>Draft for review.</strong> This page is a working draft and has not yet been reviewed by a lawyer. It may change before Kestrel launches.
    </p>
  );
}
