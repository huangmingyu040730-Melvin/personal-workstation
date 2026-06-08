export function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "earth" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={tone === "earth" ? "h-full rounded-full bg-gradient-to-r from-earth-700 to-sage-600" : "h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
