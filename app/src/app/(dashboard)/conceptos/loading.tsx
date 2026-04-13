export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg w-64 mb-4" />
      <div className="h-4 bg-slate-100 rounded w-96 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl h-96" />
    </div>
  );
}
