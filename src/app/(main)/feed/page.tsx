import { Suspense } from "react";
import FeedContent from "./FeedContent";

/**
 * FeedPage is a SERVER component. Wrapping the client component FeedContent
 * in <Suspense> here (in a server component) is what correctly handles the
 * useSearchParams() suspension during SSR in Next.js 16.
 *
 * If this Suspense boundary were inside a "use client" component (as it was
 * before), Next.js cannot properly suspend on the server, causing a
 * server-side exception and blank page after login.
 */

function FeedSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-2 mb-4">

        <h1 className="text-xl font-bold text-foreground tracking-tight">Royal</h1>
      </div>
      <div className="flex gap-2 pb-3 mb-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-20 rounded-full animate-pulse"
            style={{ background: "rgba(36,63,22,0.04)" }}
          />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border h-48 animate-pulse"
            style={{ background: "rgba(36,63,22,0.04)", borderColor: "rgba(36,63,22,0.10)" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
