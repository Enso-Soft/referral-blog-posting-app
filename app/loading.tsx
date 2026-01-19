/**
 * 전역 로딩 UI
 * Next.js App Router의 Suspense fallback으로 사용됩니다.
 */
export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div>
        <div className="h-9 w-48 bg-secondary rounded-lg animate-pulse" />
        <div className="h-6 w-72 bg-secondary/60 rounded mt-2 animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-16 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-20 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Post cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[380px] rounded-2xl bg-card border border-border shadow-sm p-4 space-y-4 animate-pulse"
          >
            <div className="w-full h-48 bg-secondary rounded-xl" />
            <div className="space-y-2">
              <div className="h-6 w-3/4 bg-secondary rounded" />
              <div className="h-4 w-full bg-secondary/60 rounded" />
              <div className="h-4 w-2/3 bg-secondary/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
