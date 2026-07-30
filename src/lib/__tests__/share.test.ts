import { shareCardImage, shareLink, copyLink } from "@/lib/share";
import { isCapacitorNative } from "@/lib/link-handler";

jest.mock("@/lib/link-handler", () => ({
  isCapacitorNative: jest.fn(() => false),
}));

const nativeShare = jest.fn();
const writeFile = jest.fn();
jest.mock("@capacitor/share", () => ({ Share: { share: (o: unknown) => nativeShare(o) } }));
jest.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Filesystem: { writeFile: (o: unknown) => writeFile(o) },
}));

const mockNative = isCapacitorNative as jest.MockedFunction<typeof isCapacitorNative>;

type NavigatorPatch = {
  share?: unknown;
  canShare?: unknown;
  clipboard?: unknown;
};

function patchNavigator(patch: NavigatorPatch) {
  for (const [key, value] of Object.entries(patch)) {
    Object.defineProperty(navigator, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
}

/** jsdom has no execCommand at all, so it has to be installed rather than spied on. */
function setExecCommand(impl: () => boolean) {
  Object.defineProperty(document, "execCommand", { value: impl, configurable: true });
}

const blob = () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
const URL_UNDER_TEST = "https://royalwellness.app/r/abc";

describe("share pipeline", () => {
  let writeText: jest.Mock;
  let clickedAnchors: HTMLAnchorElement[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNative.mockReturnValue(false);
    writeText = jest.fn().mockResolvedValue(undefined);
    patchNavigator({ clipboard: { writeText }, share: undefined, canShare: undefined });
    nativeShare.mockResolvedValue(undefined);
    writeFile.mockResolvedValue({ uri: "file:///Caches/royal-1.png" });

    clickedAnchors = [];
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clickedAnchors.push(this);
      });
    Object.defineProperty(URL, "createObjectURL", {
      value: jest.fn(() => "blob:mock"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", { value: jest.fn(), configurable: true });
  });

  afterEach(() => jest.restoreAllMocks());

  describe("in the native app", () => {
    beforeEach(() => mockNative.mockReturnValue(true));

    it("writes the card to disk and hands the file URI to the native sheet", async () => {
      await expect(
        shareCardImage({ blob: blob(), url: URL_UNDER_TEST }),
      ).resolves.toBe("shared");

      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(writeFile.mock.calls[0][0]).toMatchObject({ directory: "CACHE" });
      expect(nativeShare.mock.calls[0][0]).toMatchObject({
        files: ["file:///Caches/royal-1.png"],
        url: URL_UNDER_TEST,
      });
    });

    it("reports a dismissed native sheet as cancelled, not a failure", async () => {
      nativeShare.mockRejectedValue(new Error("Share canceled"));
      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "cancelled",
      );
    });

    it("falls back to the clipboard when the plugin is missing from the binary", async () => {
      nativeShare.mockRejectedValue(new Error('"Share" plugin is not implemented on ios'));
      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "copied",
      );
      expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
      // No silent download attempt inside the webview — it can never work there.
      expect(clickedAnchors).toHaveLength(0);
    });

    it("shares a bare link with no file write", async () => {
      await expect(shareLink({ url: URL_UNDER_TEST })).resolves.toBe("shared");
      expect(writeFile).not.toHaveBeenCalled();
      expect(nativeShare.mock.calls[0][0]).toMatchObject({ url: URL_UNDER_TEST });
    });
  });

  describe("in a browser with Web Share", () => {
    it("attaches the file and the url when the browser accepts both", async () => {
      const share = jest.fn().mockResolvedValue(undefined);
      patchNavigator({ share, canShare: () => true, clipboard: { writeText } });

      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "shared",
      );
      expect(share.mock.calls[0][0]).toMatchObject({ url: URL_UNDER_TEST });
      expect(share.mock.calls[0][0].files).toHaveLength(1);
    });

    it("keeps the image and drops the url when the browser refuses the pair", async () => {
      const share = jest.fn().mockResolvedValue(undefined);
      // WebKit behaviour: files alone are shareable, files + url are not.
      patchNavigator({
        share,
        canShare: (d: ShareData) => !d.url,
        clipboard: { writeText },
      });

      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "shared",
      );
      expect(share.mock.calls[0][0].url).toBeUndefined();
      expect(share.mock.calls[0][0].files).toHaveLength(1);
    });

    it("treats an AbortError as cancelled", async () => {
      const err = new Error("dismissed");
      err.name = "AbortError";
      patchNavigator({
        share: jest.fn().mockRejectedValue(err),
        canShare: () => true,
        clipboard: { writeText },
      });
      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "cancelled",
      );
    });

    it("downloads the card when the share call fails outright", async () => {
      patchNavigator({
        share: jest.fn().mockRejectedValue(new Error("NotAllowedError")),
        canShare: () => true,
        clipboard: { writeText },
      });
      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "downloaded",
      );
      expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
      expect(clickedAnchors).toHaveLength(1);
    });
  });

  describe("in a browser without Web Share", () => {
    it("downloads the card and copies the link", async () => {
      await expect(shareCardImage({ blob: blob(), url: URL_UNDER_TEST })).resolves.toBe(
        "downloaded",
      );
      expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
      // Appended to the document — Firefox ignores a detached anchor.
      expect(clickedAnchors).toHaveLength(1);
    });

    it("copies the link when there is nothing else left", async () => {
      await expect(shareLink({ url: URL_UNDER_TEST })).resolves.toBe("copied");
      expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
    });

    it("reports failure when even the clipboard is unavailable", async () => {
      patchNavigator({ clipboard: { writeText: jest.fn().mockRejectedValue(new Error()) } });
      setExecCommand(jest.fn(() => false));
      await expect(shareLink({ url: URL_UNDER_TEST })).resolves.toBe("failed");
    });
  });

  it("falls back to execCommand when the async clipboard is blocked", async () => {
    patchNavigator({ clipboard: { writeText: jest.fn().mockRejectedValue(new Error()) } });
    const exec = jest.fn(() => true);
    setExecCommand(exec);
    await expect(copyLink(URL_UNDER_TEST)).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });
});
