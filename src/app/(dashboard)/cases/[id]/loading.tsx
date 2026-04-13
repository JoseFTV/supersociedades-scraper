export default function Loading() {
  return (
    <div className="space-y-6 pb-20 max-w-[100rem] mx-auto xl:px-8 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
      <div className="bg-white border border-slate-200 rounded-xl p-8 h-48" />
      <div className="flex flex-col xl:flex-row gap-6 mt-6">
        <div className="w-full xl:w-1/2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl h-64" />
          <div className="bg-white border border-slate-200 rounded-xl h-48" />
        </div>
        <div className="w-full xl:w-1/2 bg-white border border-slate-200 rounded-xl h-[600px]" />
      </div>
    </div>
  );
}
