export default function DeepAnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-64 bg-gray-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-800/60 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg h-64 animate-pulse mb-8" />
        <div className="bg-gray-900 border border-gray-800 rounded-lg h-48 animate-pulse" />
      </div>
    </div>
  );
}
