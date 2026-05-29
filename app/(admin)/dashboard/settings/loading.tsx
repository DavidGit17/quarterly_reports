export default function SettingsLoading() {
  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-72 bg-slate-200 rounded" />
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    </main>
  );
}
