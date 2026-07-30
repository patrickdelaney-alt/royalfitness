import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SharePostSheet from "@/components/share-post-sheet";
import type { ShareCardData } from "@/lib/generate-share-card";
import toast from "react-hot-toast";

jest.mock("@/lib/haptics", () => ({
  lightImpact: jest.fn(),
  successNotification: jest.fn(),
}));

jest.mock("@/lib/link-handler", () => ({ isCapacitorNative: jest.fn(() => false) }));

// jsdom has no canvas, so generation resolves through a stub — the sheet has to
// hold on to the blob so the Share tap never awaits generation.
const generateShareCard = jest.fn();
jest.mock("@/lib/generate-share-card", () => ({
  generateShareCard: (...args: unknown[]) => generateShareCard(...args),
}));

const shareCardImage = jest.fn();
const copyLink = jest.fn();
jest.mock("@/lib/share", () => ({
  shareCardImage: (...args: unknown[]) => shareCardImage(...args),
  copyLink: (...args: unknown[]) => copyLink(...args),
}));

const data: ShareCardData = {
  type: "post",
  caption: "Long run before the heat came in",
  mediaUrl: null,
  authorHandle: "royal",
  eyebrow: "Threshold Run · 52 min",
  metrics: [{ value: "52", unit: "min", label: "Duration" }],
};

const REF_URL = "https://royalwellness.app/r/abc";
const card = () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });

function shareButton() {
  return screen.getByRole("button", { name: /^Share$/ });
}

describe("SharePostSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateShareCard.mockResolvedValue(card());
    shareCardImage.mockResolvedValue("shared");
    copyLink.mockResolvedValue(true);
    Object.defineProperty(URL, "createObjectURL", {
      value: jest.fn(() => "blob:mock"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", { value: jest.fn(), configurable: true });
    jest.spyOn(toast, "success").mockImplementation(((m: string) => m) as never);
    jest.spyOn(toast, "error").mockImplementation(((m: string) => m) as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it("shares the already-generated card for the selected size", async () => {
    const onClose = jest.fn();
    render(<SharePostSheet data={data} url={REF_URL} onClose={onClose} />);
    // Wait for the preview blob to land before tapping.
    await waitFor(() => expect(generateShareCard).toHaveBeenCalled());

    fireEvent.click(screen.getByText("Feed"));
    await waitFor(() => expect(generateShareCard).toHaveBeenLastCalledWith(data, "feed"));

    fireEvent.click(shareButton());
    await waitFor(() => expect(shareCardImage).toHaveBeenCalledTimes(1));
    // The cached blob is handed over — no regeneration on the tap path.
    expect(shareCardImage.mock.calls[0][0]).toMatchObject({ url: REF_URL });
    expect(shareCardImage.mock.calls[0][0].blob).toBeInstanceOf(Blob);
    expect(generateShareCard).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("copies the referral link as part of sharing, since Stories strip it", async () => {
    render(<SharePostSheet data={data} url={REF_URL} onClose={jest.fn()} />);
    await waitFor(() => expect(generateShareCard).toHaveBeenCalled());

    fireEvent.click(shareButton());
    await waitFor(() => expect(copyLink).toHaveBeenCalledWith(REF_URL));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Shared — link copied for your caption"),
    );
  });

  it("still generates and shares when the tap beats the preview", async () => {
    let resolvePreview: (blob: Blob) => void = () => {};
    generateShareCard.mockImplementation(
      () => new Promise<Blob>((res) => (resolvePreview = res)),
    );
    render(<SharePostSheet data={data} url={REF_URL} onClose={jest.fn()} />);

    fireEvent.click(shareButton());
    expect(shareCardImage).not.toHaveBeenCalled();
    resolvePreview(card());
    await waitFor(() => expect(shareCardImage).toHaveBeenCalledTimes(1));
  });

  it("reports every outcome instead of failing silently", async () => {
    const onClose = jest.fn();
    shareCardImage.mockResolvedValue("copied");
    const { unmount } = render(
      <SharePostSheet data={data} url={REF_URL} onClose={onClose} />,
    );
    await waitFor(() => expect(generateShareCard).toHaveBeenCalled());
    fireEvent.click(shareButton());
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Link copied — paste it wherever you're sharing",
      ),
    );
    unmount();

    // A failed share still leaves the link on the clipboard from the tap.
    shareCardImage.mockResolvedValue("failed");
    const second = render(<SharePostSheet data={data} url={REF_URL} onClose={jest.fn()} />);
    await waitFor(() => expect(generateShareCard).toHaveBeenCalledTimes(2));
    fireEvent.click(shareButton());
    await waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith(
        "Link copied — paste it wherever you're sharing",
      ),
    );
    expect(toast.error).not.toHaveBeenCalled();
    second.unmount();

    // Nothing worked at all — say so.
    copyLink.mockResolvedValue(false);
    render(<SharePostSheet data={data} url={REF_URL} onClose={jest.fn()} />);
    await waitFor(() => expect(generateShareCard).toHaveBeenCalledTimes(3));
    fireEvent.click(shareButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("leaves the sheet open when the user dismisses the OS sheet", async () => {
    const onClose = jest.fn();
    shareCardImage.mockResolvedValue("cancelled");
    render(<SharePostSheet data={data} url={REF_URL} onClose={onClose} />);
    await waitFor(() => expect(generateShareCard).toHaveBeenCalled());

    fireEvent.click(shareButton());
    await waitFor(() => expect(shareCardImage).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("offers Copy link as a standalone action whenever there's a link", async () => {
    render(<SharePostSheet data={data} url={REF_URL} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy link/ }));
    await waitFor(() => expect(copyLink).toHaveBeenCalledWith(REF_URL));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Link copied"));
  });

  it("offers all three sizes", async () => {
    render(<SharePostSheet data={data} onClose={jest.fn()} />);
    expect(screen.getByText("Story")).toBeTruthy();
    expect(screen.getByText("Feed")).toBeTruthy();
    expect(screen.getByText("Cover")).toBeTruthy();
    // No link, no clipboard affordance.
    expect(screen.queryByRole("button", { name: /Copy link/ })).toBeNull();
    await waitFor(() => expect(screen.getByAltText("Your share card")).toBeTruthy());
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    render(<SharePostSheet data={data} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByAltText("Your share card")).toBeTruthy());
  });
});
