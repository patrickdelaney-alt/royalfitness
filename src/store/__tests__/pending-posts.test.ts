import type { Post } from "@/components/post-card";
import { usePendingPostsStore } from "@/store/pending-posts";

const post = (id: string, caption = "first"): Post => ({
  id,
  type: "GENERAL",
  caption,
  mediaUrl: null,
  visibility: "PUBLIC",
  tags: [],
  createdAt: "2026-07-29T12:00:00.000Z",
  author: { id: "user-1", name: "Royal User", username: "royal", avatarUrl: null },
  workoutDetail: null,
  mealDetail: null,
  wellnessDetail: null,
  affiliateDetail: null,
  catalogShareDetail: null,
  externalContent: [],
  gym: null,
  likedByMe: false,
  _count: { likes: 0, comments: 0 },
});

describe("pending posts store", () => {
  beforeEach(() => usePendingPostsStore.setState({ pendingPosts: [] }));

  it("keeps the complete create response and replaces duplicate server IDs", () => {
    const { addPendingPost } = usePendingPostsStore.getState();
    addPendingPost(post("post-1"));
    addPendingPost(post("post-1", "replacement"));

    expect(usePendingPostsStore.getState().pendingPosts).toEqual([
      expect.objectContaining({ id: "post-1", caption: "replacement", _count: { likes: 0, comments: 0 } }),
    ]);
    expect(usePendingPostsStore.getState().pendingPosts[0]).toEqual(expect.objectContaining({
      reconciliationStatus: "reconciling", retryCount: 0, pendingCreatedAt: expect.any(Number),
    }));
  });

  it("supports timeout, retry, confirmation, dismissal, and expiry", () => {
    jest.spyOn(Date, "now").mockReturnValue(100);
    const store = usePendingPostsStore.getState();
    store.addPendingPost(post("post-1"));
    store.setPendingPostStatus("post-1", "needs_refresh");
    expect(usePendingPostsStore.getState().pendingPosts[0].reconciliationStatus).toBe("needs_refresh");

    usePendingPostsStore.getState().retryPendingPost("post-1");
    expect(usePendingPostsStore.getState().pendingPosts[0]).toEqual(expect.objectContaining({
      reconciliationStatus: "reconciling", retryCount: 1,
    }));
    usePendingPostsStore.getState().setPendingPostStatus("post-1", "confirmed");
    expect(usePendingPostsStore.getState().pendingPosts[0].reconciliationStatus).toBe("confirmed");
    usePendingPostsStore.getState().removePendingPost("post-1");
    expect(usePendingPostsStore.getState().pendingPosts).toHaveLength(0);

    usePendingPostsStore.getState().addPendingPost(post("expired"));
    usePendingPostsStore.getState().removeExpiredPendingPosts(24 * 60 * 60 * 1_000 + 100);
    expect(usePendingPostsStore.getState().pendingPosts).toHaveLength(0);
    jest.restoreAllMocks();
  });
});
