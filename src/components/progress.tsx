export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
