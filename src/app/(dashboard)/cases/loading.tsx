export default function Loading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg w-64" />
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-16" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl h-20" />
        ))}
      </div>
    </div>
  );
}
