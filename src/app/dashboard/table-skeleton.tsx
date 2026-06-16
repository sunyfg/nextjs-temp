export function TitleSkeleton() {
  return <div className="h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />;
}

export function DescSkeleton() {
  return <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />;
}

export function ToolbarSkeleton() {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-9 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex gap-4 bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
        {[140, 200, 100, 48, 100].map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-zinc-300 dark:bg-zinc-600"
            style={{ width: w }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 border-t border-zinc-100 px-4 py-3.5 dark:border-zinc-800"
        >
          {[120, 160, 80, 40, 72].map((w, c) => (
            <div
              key={c}
              className="h-3.5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"
              style={{ width: w + (c === 4 ? (r % 3) * 20 : 0) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FullPageSkeleton({ rows = 5, withToolbar = true }: { rows?: number; withToolbar?: boolean }) {
  return (
    <div>
      <TitleSkeleton />
      <DescSkeleton />
      {withToolbar && <ToolbarSkeleton />}
      <TableSkeleton rows={rows} />
    </div>
  );
}
