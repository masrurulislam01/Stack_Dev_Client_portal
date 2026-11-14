export function AuthLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Stack Dev portal session"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex"
    >
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-6">
        <div className="h-7 w-28 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 animate-pulse"
            />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-8 flex items-center justify-between">
          <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-80 max-w-full rounded-lg bg-slate-100 dark:bg-slate-800/70 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
              >
                <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/70 animate-pulse"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
