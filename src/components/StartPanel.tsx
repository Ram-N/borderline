
export default function StartPanel({ count, onCount }: { count: number; onCount: (n: number) => void; }) {
  return (
    <div className='start-panel'>
      <label>
        Questions:
        <input type='number' value={count} min={1} max={10} onChange={e => onCount(Number(e.target.value))} />
      </label>
      <small>Tip: keep sets small (5–10 images) for quick sessions.</small>
    </div>
  );
}
