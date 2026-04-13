export default function SearchLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-700 rounded" />
      <div className="flex gap-4">
        <div className="flex-1 h-12 bg-slate-700 rounded-lg" />
        <div className="h-12 w-32 bg-slate-700 rounded-lg" />
      </div>
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl border border-slate-700" />
        ))}
      </div>
    </div>
  );
}
