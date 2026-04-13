export default function Loading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg w-80" />
      <div className="h-4 bg-slate-100 rounded w-96" />
      <div className="space-y-4 mt-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl h-24" />
        ))}
      </div>
    </div>
  );
}
