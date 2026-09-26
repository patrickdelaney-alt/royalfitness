import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProfilePage from "@/app/(main)/profile/[username]/page";
import toast from "react-hot-toast";

// "Invite friends" must hand the share sheet / clipboard a URL a message
// recipient can open — never the bare "/r/<code>" path.

jest.mock("next/navigation", () => ({
  useParams: () => ({ username: "royal" }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
  signOut: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("@/components/follow-list-modal", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/user-catalog-section", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/founding-member-badge", () => ({ FoundingMemberBadge: () => null }));
jest.mock("@/lib/haptics", () => ({ lightImpact: jest.fn() }));
jest.mock("qrcode", () => ({ __esModule: true, default: { toString: jest.fn(() => Promise.resolve("")) } }));

const CODE = "cmuijywp0000004l3ufy9mosd";

function mockFetch() {
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/users/")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            user: {
              id: "user-1",
              name: "Royal",
              username: "royal",
              bio: null,
              avatarUrl: null,
              isPrivate: false,
              instagramUrl: null,
              tiktokUrl: null,
              followerCount: 0,
              followingCount: 0,
              foundingMember: false,
            },
            recentPosts: [],
            isOwnProfile: true,
            isFollowing: false,
            hasRequestedFollow: false,
          }),
      });
    }
    if (url === "/api/referral-links") {
      // The old API shape: a relative url. The client must not pass it through.
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: CODE, url: `/r/${CODE}` }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ requests: [] }) });
  }) as jest.Mock;
}

describe("Profile — Invite friends", () => {
  const originalShare = navigator.share;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "share", { value: originalShare, configurable: true });
  });

  it("copies an absolute https://royalwellness.app/r/<code> URL when there is no share sheet", async () => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    render(<ProfilePage />);
    fireEvent.click(await screen.findByText("Invite friends"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(`https://royalwellness.app/r/${CODE}`);
    expect(toast.success).toHaveBeenCalledWith("Link copied");
  });

  it("passes the absolute URL to the native share sheet (iOS WKWebView / mobile Safari)", async () => {
    const share = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "share", { value: share, configurable: true });

    render(<ProfilePage />);
    fireEvent.click(await screen.findByText("Invite friends"));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledWith({
      url: `https://royalwellness.app/r/${CODE}`,
      title: "Royal",
      text: "Join me on Royal",
    });
  });
});
