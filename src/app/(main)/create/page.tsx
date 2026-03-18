import { Suspense } from "react";
import CreateContent from "./CreateContent";

/**
 * CreatePostPage is a SERVER component so that the <Suspense> boundary it
 * contains is server-side. This is required in Next.js 16 for
 * useSearchParams() (used inside CreateContent) to suspend correctly during
 * SSR instead of throwing a server-side exception.
 */

function CreateSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl animate-pulse"
          style={{ background: "rgba(36,63,22,0.04)" }}
        />
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          New Post
        </h1>
      </div>
      <div
        className="flex gap-2 mb-5 p-1 rounded-xl"
        style={{ background: "rgba(36,63,22,0.04)" }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 py-2 rounded-lg h-9 animate-pulse"
            style={{ background: "rgba(36,63,22,0.04)" }}
          />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg animate-pulse"
            style={{ background: "rgba(36,63,22,0.04)" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<CreateSkeleton />}>
      <CreateContent />
    </Suspense>
  );
}
