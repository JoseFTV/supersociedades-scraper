export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-slate-200 rounded" />
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-96 bg-slate-100 rounded-xl border border-slate-200" />
    </div>
  );
}
