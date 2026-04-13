export default function CopilotLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-slate-700 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="h-48 bg-slate-800 rounded-xl border border-slate-700" />
          <div className="h-12 bg-slate-700 rounded-lg" />
        </div>
        <div className="lg:col-span-8">
          <div className="h-96 bg-slate-800 rounded-xl border border-slate-700" />
        </div>
      </div>
    </div>
  );
}
