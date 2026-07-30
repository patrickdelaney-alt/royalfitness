import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SharePostSheet from "@/components/share-post-sheet";
import type { ShareCardData } from "@/lib/generate-share-card";

// jsdom has no canvas, so generation always rejects — the sheet must still render
// and stay interactive, showing an empty preview frame rather than breaking.
jest.mock("@/lib/haptics", () => ({
  lightImpact: jest.fn(),
  successNotification: jest.fn(),
}));

const shareCardMock = jest.fn();
jest.mock("@/lib/generate-share-card", () => ({
  generateShareCard: jest.fn(() => Promise.reject(new Error("no canvas"))),
  shareCard: (...args: unknown[]) => shareCardMock(...args),
}));

const data: ShareCardData = {
  type: "post",
  caption: "Long run before the heat came in",
  mediaUrl: null,
  authorHandle: "royal",
  eyebrow: "Threshold Run · 52 min",
  metrics: [{ value: "52", unit: "min", label: "Duration" }],
};

describe("SharePostSheet", () => {
  beforeEach(() => shareCardMock.mockReset());

  it("offers all three sizes and shares the selected one", async () => {
    shareCardMock.mockResolvedValue("shared");
    const onClose = jest.fn();
    render(<SharePostSheet data={data} url="https://royalwellness.app/r/abc" onClose={onClose} />);

    expect(screen.getByText("Story")).toBeTruthy();
    expect(screen.getByText("Cover")).toBeTruthy();
    fireEvent.click(screen.getByText("Feed"));
    fireEvent.click(screen.getByRole("button", { name: /Share/ }));

    await waitFor(() => expect(shareCardMock).toHaveBeenCalledTimes(1));
    expect(shareCardMock.mock.calls[0][1]).toEqual({
      ratio: "feed",
      url: "https://royalwellness.app/r/abc",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("tells the user when the referral link travels with the card", () => {
    const { rerender } = render(<SharePostSheet data={data} onClose={jest.fn()} />);
    expect(screen.queryByText(/referral link travels with it/)).toBeNull();
    rerender(
      <SharePostSheet data={data} url="https://royalwellness.app/r/abc" onClose={jest.fn()} />,
    );
    expect(screen.getByText(/referral link travels with it/)).toBeTruthy();
  });

  it("closes on Escape", () => {
    const onClose = jest.fn();
    render(<SharePostSheet data={data} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
