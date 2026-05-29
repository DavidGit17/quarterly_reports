export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-72 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-9 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="h-5 w-48 bg-slate-200 rounded mb-3" />
            <div className="h-4 w-full bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
