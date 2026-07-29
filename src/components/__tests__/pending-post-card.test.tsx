import { fireEvent, render, screen } from "@testing-library/react";
import PendingPostCard from "@/components/pending-post-card";
import type { PendingPost } from "@/store/pending-posts";

const created: PendingPost = {
  id: "server-id", type: "GENERAL", caption: "Created", mediaUrl: null,
  visibility: "PUBLIC", tags: [], createdAt: "2026-07-29T12:00:00.000Z",
  author: { id: "user-1", name: "Royal User", username: "royal", avatarUrl: null },
  workoutDetail: null, mealDetail: null, wellnessDetail: null, affiliateDetail: null,
  catalogShareDetail: null, externalContent: [], gym: null, likedByMe: false,
  _count: { likes: 0, comments: 0 }, reconciliationStatus: "reconciling",
  pendingCreatedAt: 100, retryCount: 0,
};

describe("PendingPostCard", () => {
  it("uses an indeterminate, reduced-motion-safe waiting treatment", () => {
    render(<PendingPostCard post={created} onDismiss={jest.fn()} onRefresh={jest.fn()} />);
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
    expect(screen.getByRole("progressbar").firstElementChild?.className).toContain("motion-reduce:animate-none");
  });

  it("offers accessible recovery and dismissal controls after a failure or timeout", () => {
    const refresh = jest.fn();
    const dismiss = jest.fn();
    render(<PendingPostCard post={{ ...created, reconciliationStatus: "needs_refresh" }} onDismiss={dismiss} onRefresh={refresh} />);
    expect(screen.getByText("Your post was saved, but the feed hasn’t refreshed yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View your saved post" }).getAttribute("href")).toBe("/posts/server-id");
    fireEvent.click(screen.getByRole("button", { name: "Refresh feed and try to find your saved post" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss saved post notice" }));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
