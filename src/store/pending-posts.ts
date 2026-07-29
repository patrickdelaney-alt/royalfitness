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
  setPendingPostStatus: (id, reconciliationStatus) =>
    set((state) => ({
      pendingPosts: state.pendingPosts.map((post) =>
        post.id === id && post.reconciliationStatus !== reconciliationStatus
          ? { ...post, reconciliationStatus }
          : post
      ),
    })),
  retryPendingPost: (id) =>
    set((state) => ({
      pendingPosts: state.pendingPosts.map((post) => post.id === id ? {
        ...post,
        reconciliationStatus: "reconciling",
        pendingCreatedAt: Date.now(),
        retryCount: post.retryCount + 1,
      } : post),
    })),
  removePendingPost: (id) =>
    set((state) => ({ pendingPosts: state.pendingPosts.filter((post) => post.id !== id) })),
  removeExpiredPendingPosts: (now = Date.now()) =>
    set((state) => ({
      pendingPosts: state.pendingPosts.filter(
        (post) => now - post.pendingCreatedAt < PENDING_POST_EXPIRY_MS
      ),
    })),
}));
