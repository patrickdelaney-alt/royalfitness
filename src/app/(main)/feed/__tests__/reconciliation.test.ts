import type { Post } from "@/components/post-card";
import { reconcileFeedItems } from "@/lib/feed-reconciliation";

const post = (id: string): Post => ({
  id, type: "GENERAL", caption: "Created", mediaUrl: null, visibility: "PUBLIC", tags: [],
  createdAt: "2026-07-29T12:00:00.000Z",
  author: { id: "user-1", name: "Royal User", username: "royal", avatarUrl: null },
  workoutDetail: null, mealDetail: null, wellnessDetail: null, affiliateDetail: null,
  catalogShareDetail: null, externalContent: [], gym: null, likedByMe: false,
  _count: { likes: 0, comments: 0 },
});

describe("feed post reconciliation", () => {
  it("shows immediate feedback until the matching live post arrives", () => {
    const created = post("server-id");
    expect(reconcileFeedItems([], [created]).visiblePendingPosts).toEqual([created]);
    expect(reconcileFeedItems([{ posts: [created] }], [created])).toMatchObject({
      posts: [created],
      visiblePendingPosts: [],
    });
  });

  it("renders a server ID only once even if feed pages overlap", () => {
    const created = post("server-id");
    const result = reconcileFeedItems([{ posts: [created] }, { posts: [created] }], [created]);
    expect(result.posts).toHaveLength(1);
    expect(result.visiblePendingPosts).toHaveLength(0);

    const pendingOnly = reconcileFeedItems([], [created, created]);
    expect(pendingOnly.visiblePendingPosts).toHaveLength(1);
  });
});
