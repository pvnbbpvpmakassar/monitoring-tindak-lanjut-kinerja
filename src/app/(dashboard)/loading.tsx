export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-7">
      {/* Header halaman */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-36 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Konten utama */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-9 w-32 rounded-lg bg-slate-100" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-slate-100 pb-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
              <div className="h-7 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}