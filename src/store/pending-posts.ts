import { create } from "zustand";
import type { Post } from "@/components/post-card";

export type PendingPostStatus = "reconciling" | "confirmed" | "needs_refresh";
export type PendingPost = Post & {
  reconciliationStatus: PendingPostStatus;
  pendingCreatedAt: number;
  retryCount: number;
};

export const PENDING_POST_RECONCILIATION_MS = 15_000;
export const PENDING_POST_EXPIRY_MS = 24 * 60 * 60 * 1_000;

interface PendingPostsState {
  pendingPosts: PendingPost[];
  addPendingPost: (post: Post) => void;
  setPendingPostStatus: (id: string, status: PendingPostStatus) => void;
  retryPendingPost: (id: string) => void;
  removePendingPost: (id: string) => void;
  removeExpiredPendingPosts: (now?: number) => void;
}

export const usePendingPostsStore = create<PendingPostsState>()((set) => ({
  pendingPosts: [],
  addPendingPost: (post) =>
    set((state) => ({
      pendingPosts: [{
        ...post,
        reconciliationStatus: "reconciling",
        pendingCreatedAt: Date.now(),
        retryCount: 0,
      }, ...state.pendingPosts.filter((item) => item.id !== post.id)],
    })),
  // Every mutator below returns the untouched `state` when it changes nothing.
  // `filter`/`map` allocate a new array even on a no-op, and zustand only skips
  // notifying subscribers when the next state is identical to the current one.
  // Without these guards a caller that reads `pendingPosts` and invokes a
  // mutator from the same effect re-renders forever.
  setPendingPostStatus: (id, reconciliationStatus) =>
    set((state) => {
      let changed = false;
      const pendingPosts = state.pendingPosts.map((post) => {
        if (post.id !== id || post.reconciliationStatus === reconciliationStatus) return post;
        changed = true;
        return { ...post, reconciliationStatus };
      });
      return changed ? { pendingPosts } : state;
    }),
  retryPendingPost: (id) =>
    set((state) => {
      if (!state.pendingPosts.some((post) => post.id === id)) return state;
      return {
        pendingPosts: state.pendingPosts.map((post) => post.id === id ? {
          ...post,
          reconciliationStatus: "reconciling",
          pendingCreatedAt: Date.now(),
          retryCount: post.retryCount + 1,
        } : post),
      };
    }),
  removePendingPost: (id) =>
    set((state) => {
      const pendingPosts = state.pendingPosts.filter((post) => post.id !== id);
      return pendingPosts.length === state.pendingPosts.length ? state : { pendingPosts };
    }),
  removeExpiredPendingPosts: (now = Date.now()) =>
    set((state) => {
      const pendingPosts = state.pendingPosts.filter(
        (post) => now - post.pendingCreatedAt < PENDING_POST_EXPIRY_MS
      );
      return pendingPosts.length === state.pendingPosts.length ? state : { pendingPosts };
    }),
}));
