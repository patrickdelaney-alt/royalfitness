import { act, fireEvent, render, screen } from "@testing-library/react";
import PendingPostCard from "@/components/pending-post-card";
import type { Post } from "@/components/post-card";

const created: Post = {
  id: "server-id", type: "GENERAL", caption: "Created", mediaUrl: null,
  visibility: "PUBLIC", tags: [], createdAt: "2026-07-29T12:00:00.000Z",
  author: { id: "user-1", name: "Royal User", username: "royal", avatarUrl: null },
  workoutDetail: null, mealDetail: null, wellnessDetail: null, affiliateDetail: null,
  catalogShareDetail: null, externalContent: [], gym: null, likedByMe: false,
  _count: { likes: 0, comments: 0 },
};

describe("PendingPostCard", () => {
  it("describes feed reconciliation and offers a refresh if it is slow", () => {
    jest.useFakeTimers();
    const refresh = jest.fn();
    render(<PendingPostCard post={created} isFading={false} onFaded={jest.fn()} onRefresh={refresh} />);
    expect(screen.getByText("Adding to your feed…")).toBeTruthy();

    act(() => jest.advanceTimersByTime(15000));
    fireEvent.click(screen.getByRole("button", { name: "Refresh feed" }));
    expect(refresh).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
