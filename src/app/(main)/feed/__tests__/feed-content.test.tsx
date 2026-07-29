import { render, screen } from "@testing-library/react";
import FeedContent from "@/app/(main)/feed/FeedContent";
import { usePendingPostsStore } from "@/store/pending-posts";
import type { Post } from "@/components/post-card";

// FeedContent drives the whole authenticated home screen. This suite mounts it
// to guard against render loops: an effect that writes to the pending-posts
// store while depending on that same store crashes the (main) error boundary
// with "Maximum update depth exceeded", which reads to users as
// "Something went wrong. We couldn't load this page."

const setSize = jest.fn();
const mutate = jest.fn(() => Promise.resolve(undefined));

jest.mock("swr/infinite", () => ({
  __esModule: true,
  default: () => ({
    data: [{ posts: [], nextCursor: undefined }],
    error: undefined,
    isLoading: false,
    isValidating: false,
    size: 1,
    setSize,
    mutate,
  }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

// Children own their own data fetching; they are covered by their own suites.
jest.mock("@/components/recommendation-card", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/referral-attribution-banner", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/post-card", () => ({
  __esModule: true,
  default: () => null,
}));

const post = (id: string): Post => ({
  id,
  type: "GENERAL",
  caption: "Just posted",
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

describe("FeedContent", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    usePendingPostsStore.setState({ pendingPosts: [] });
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const expectNoRenderLoop = () => {
    const loop = consoleError.mock.calls
      .flat()
      .some((arg) => String(arg).includes("Maximum update depth exceeded"));
    expect(loop).toBe(false);
  };

  it("renders an empty feed without looping renders", () => {
    expect(() => render(<FeedContent />)).not.toThrow();

    expect(screen.getByRole("heading", { name: "Royal" })).toBeTruthy();
    expectNoRenderLoop();
  });

  it("renders a reconciling pending post without looping renders", () => {
    usePendingPostsStore.getState().addPendingPost(post("pending-1"));

    expect(() => render(<FeedContent />)).not.toThrow();

    expect(screen.getByLabelText("Pending post by royal")).toBeTruthy();
    expectNoRenderLoop();
  });
});
