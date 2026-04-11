
type Manifest = { sets: { id: string; path: string }[] } | null;

export default function RegionPicker({ manifest, selected, onChange }: {
  manifest: Manifest;
  selected: string;
  onChange: (v: string) => void;
}) {
  if (!manifest) return <div>Loading sets…</div>;
  if (!manifest.sets.length) return <div>No sets found</div>;
  return (
    <div className='region-picker'>
      <label>
        Set:
        <select value={selected} onChange={e => onChange(e.target.value)}>
          <option value=''>Select…</option>
          {manifest.sets.map(s => (
            <option key={s.id} value={s.path}>{s.id}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
