export default function EntityProfileLoading() {
  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Back link */}
      <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-8 w-80 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#FAFBFC] border border-slate-200 rounded-lg p-3 h-20 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-48 animate-pulse" />
        ))}
      </div>

      {/* Case list */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#FAFBFC] border border-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
