export function AuthLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Stack Dev portal session"
      className="min-h-screen bg-background flex"
    >
      <aside className="hidden md:flex md:w-[76px] lg:w-[264px] md:flex-col border-r border-border bg-surface p-5 space-y-6">
        <div className="h-8 w-8 lg:w-32 rounded-xl skeleton-shimmer" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-10 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between">
          <div className="h-5 w-36 rounded-lg skeleton-shimmer" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
            <div className="w-9 h-9 rounded-full skeleton-shimmer" />
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-80 max-w-full rounded-lg skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="h-32 rounded-2xl border border-border bg-surface card-inset p-6 space-y-3"
              >
                <div className="h-4 w-24 rounded-lg skeleton-shimmer" />
                <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
              </div>
            ))}
          </div>

          <div className="h-64 rounded-2xl border border-border bg-surface card-inset p-6 space-y-4">
            <div className="h-5 w-44 rounded-lg skeleton-shimmer" />
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-12 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
