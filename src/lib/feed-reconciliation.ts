import type { Post } from "@/components/post-card";

export type ReconciliationPage = { posts: Post[]; nextCursor?: string };

/** Produces one renderable item per real server ID across SWR and pending data. */
export function reconcileFeedItems(pages: ReconciliationPage[] | undefined, pendingPosts: Post[]) {
  const seen = new Set<string>();
  const posts = (pages ?? []).flatMap((page) => page.posts).filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
  return {
    posts,
    visiblePendingPosts: pendingPosts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    }),
  };
}
