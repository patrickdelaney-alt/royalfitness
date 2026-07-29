import { create } from "zustand";
import type { Post } from "@/components/post-card";

// Creation returns the same complete shape consumed by PostCard. Keeping that
// response intact avoids a second, subtly different post model while the feed
// catches up with the write.
export type PendingPost = Post;

interface PendingPostsState {
  pendingPosts: PendingPost[];
  addPendingPost: (post: PendingPost) => void;
  removePendingPost: (id: string) => void;
}

export const usePendingPostsStore = create<PendingPostsState>()((set) => ({
  pendingPosts: [],
  addPendingPost: (post) =>
    set((state) => ({
      pendingPosts: [post, ...state.pendingPosts.filter((item) => item.id !== post.id)],
    })),
  removePendingPost: (id) =>
    set((state) => ({
      pendingPosts: state.pendingPosts.filter((p) => p.id !== id),
    })),
}));
