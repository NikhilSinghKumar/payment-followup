export default function DataToolbar({ left, right }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3">{left}</div>

      <div className="flex flex-wrap items-center gap-3">{right}</div>
    </div>
  );
}
