export default function Loading() {
  return (
    <div className="space-y-8 pb-20 animate-pulse">
      <div className="bg-slate-200 rounded-2xl h-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl h-80" />
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl h-80" />
      </div>
    </div>
  );
}
