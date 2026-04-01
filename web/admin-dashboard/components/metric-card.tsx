export function MetricCard({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <h3 className="text-3xl font-semibold text-slate-900">{value}</h3>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
          {delta}
        </span>
      </div>
    </article>
  );
}
