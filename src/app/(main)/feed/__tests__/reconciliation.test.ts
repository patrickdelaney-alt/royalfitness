import type { Post } from "@/components/post-card";
import { insertCreatedPost, reconcileFeedItems } from "@/lib/feed-reconciliation";

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

  it("inserts a backdated private create in server order and preserves cursors", () => {
    const newest = { ...post("newest"), createdAt: "2026-07-29T13:00:00.000Z" };
    const created = { ...post("created"), visibility: "PRIVATE", createdAt: "2026-07-29T12:30:00.000Z" };
    const oldest = { ...post("oldest"), createdAt: "2026-07-29T11:00:00.000Z" };
    const pages = [
      { posts: [newest, oldest], nextCursor: "cursor-one" },
      { posts: [created, oldest], nextCursor: "cursor-two" },
    ];

    const result = insertCreatedPost(pages, created, "ALL")!;
    expect(result[0].posts.map(({ id }) => id)).toEqual(["newest", "created", "oldest"]);
    expect(result[1].posts).toEqual([]);
    expect(result.map(({ nextCursor }) => nextCursor)).toEqual(["cursor-one", "cursor-two"]);
  });

  it("does not insert a create that does not match the active filter", () => {
    const duplicate = post("duplicate");
    const pages = [{ posts: [duplicate] }, { posts: [duplicate] }];
    const result = insertCreatedPost(pages, post("meal"), "WORKOUT")!;

    expect(result.flatMap(({ posts }) => posts).map(({ id }) => id)).toEqual(["duplicate"]);
  });
});
