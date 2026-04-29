import { create } from "zustand";

interface LikeEntry {
  liked: boolean;
  count: number;
}

interface LikesState {
  likes: Record<string, LikeEntry>;
  setLike: (postId: string, liked: boolean, count: number) => void;
}

export const useLikesStore = create<LikesState>()((set) => ({
  likes: {},
  setLike: (postId, liked, count) =>
    set((s) => ({ likes: { ...s.likes, [postId]: { liked, count } } })),
}));
