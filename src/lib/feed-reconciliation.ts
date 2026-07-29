import type { Post } from "@/components/post-card";

export type ReconciliationPage = { posts: Post[]; nextCursor?: string };

/**
 * Inserts a confirmed create response into page one without changing any
 * cursor metadata. A post can already exist in a stale/overlapping page, so
 * every page is de-duplicated before the new post is placed in server order.
 */
export function insertCreatedPost(
  pages: ReconciliationPage[] | undefined,
  created: Post,
  activeType: string
): ReconciliationPage[] | undefined {
  if (!pages) return pages;

  const matchesFilter = activeType === "ALL" || created.type === activeType;
  const seen = new Set<string>();
  const deduplicated = pages.map((page) => ({
    ...page,
    posts: page.posts.filter((post) => {
      if (post.id === created.id || seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    }),
  }));

  if (!matchesFilter || deduplicated.length === 0) return deduplicated;

  deduplicated[0] = {
    ...deduplicated[0],
    posts: [...deduplicated[0].posts, created].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ),
  };
  return deduplicated;
}

/** Produces one renderable item per real server ID across SWR and pending data. */
export function reconcileFeedItems<T extends Post>(pages: ReconciliationPage[] | undefined, pendingPosts: T[]) {
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
