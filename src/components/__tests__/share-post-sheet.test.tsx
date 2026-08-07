import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SharePostSheet from "@/components/share-post-sheet";
import type { ShareCardData } from "@/lib/generate-share-card";

// jsdom has no canvas. Most cases mock generation to reject — the sheet must
// still render and stay interactive, showing an empty preview frame rather
// than breaking. The activation-preserving test below mocks it to resolve.
jest.mock("@/lib/haptics", () => ({
  lightImpact: jest.fn(),
  successNotification: jest.fn(),
}));

const generateShareCardMock = jest.fn<Promise<Blob>, unknown[]>(() =>
  Promise.reject(new Error("no canvas")),
);
const shareBlobMock = jest.fn<
  Promise<"shared" | "downloaded" | "cancelled">,
  unknown[]
>();
jest.mock("@/lib/generate-share-card", () => ({
  generateShareCard: (...args: unknown[]) => generateShareCardMock(...args),
  shareBlob: (...args: unknown[]) => shareBlobMock(...args),
}));

// jsdom doesn't implement these — the preview effect needs them to turn a
// generated blob into an <img> src.
beforeAll(() => {
  URL.createObjectURL = jest.fn(() => "blob:mock-url");
  URL.revokeObjectURL = jest.fn();
});

const data: ShareCardData = {
  type: "post",
  caption: "Long run before the heat came in",
  mediaUrl: null,
  authorHandle: "royal",
  eyebrow: "Threshold Run · 52 min",
  metrics: [{ value: "52", unit: "min", label: "Duration" }],
};

describe("SharePostSheet", () => {
  beforeEach(() => {
    shareBlobMock.mockReset();
    generateShareCardMock.mockReset();
    generateShareCardMock.mockImplementation(() => Promise.reject(new Error("no canvas")));
  });

  it("shares the pre-generated blob with no regeneration in the click handler", async () => {
    const blob = new Blob(["card"], { type: "image/png" });
    generateShareCardMock.mockImplementation(() => Promise.resolve(blob));
    shareBlobMock.mockResolvedValue("shared");
    const onClose = jest.fn();
    render(<SharePostSheet data={data} url="https://royalwellness.app/r/abc" onClose={onClose} />);

    // Share stays disabled until the preview blob lands.
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: /Share/ }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );

    fireEvent.click(screen.getByRole("button", { name: /Share/ }));

    await waitFor(() => expect(shareBlobMock).toHaveBeenCalledTimes(1));
    expect(shareBlobMock).toHaveBeenCalledWith(blob, {
      url: "https://royalwellness.app/r/abc",
    });
    // Only the preview effect generates a card — the click handler reuses it.
    expect(generateShareCardMock.mock.calls.length).toBeLessThanOrEqual(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("keeps Share disabled while no preview blob is available", () => {
    render(<SharePostSheet data={data} onClose={jest.fn()} />);
    expect(
      (screen.getByRole("button", { name: /Share/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
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
