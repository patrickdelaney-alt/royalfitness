import { create } from "zustand";

export interface PendingPost {
  id: string;
  type: string;
  caption: string | null;
  mediaUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  workoutDetail: { workoutName: string } | null;
  mealDetail: { mealName: string } | null;
  wellnessDetail: { activityType: string } | null;
  gym: { id: string; name: string } | null;
}

interface PendingPostsState {
  pendingPosts: PendingPost[];
  addPendingPost: (post: PendingPost) => void;
  removePendingPost: (id: string) => void;
}

export const usePendingPostsStore = create<PendingPostsState>()((set) => ({
  pendingPosts: [],
  addPendingPost: (post) =>
    set((state) => ({ pendingPosts: [post, ...state.pendingPosts] })),
  removePendingPost: (id) =>
    set((state) => ({
      pendingPosts: state.pendingPosts.filter((p) => p.id !== id),
    })),
}));
