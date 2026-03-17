import { parseEmbedUrl } from "@/lib/embed-parser";

describe("parseEmbedUrl", () => {
  it("parses instagram post URL", () => {
    const parsed = parseEmbedUrl("https://www.instagram.com/p/ABC123/?utm_source=ig_web_copy_link");
    expect(parsed).toEqual(
      expect.objectContaining({ provider: "instagram", contentId: "ABC123" })
    );
  });

  it("parses tiktok video URL", () => {
    const parsed = parseEmbedUrl("https://www.tiktok.com/@royal/video/7493999900112233445");
    expect(parsed).toEqual(
      expect.objectContaining({ provider: "tiktok", contentId: "7493999900112233445" })
    );
  });

  it("parses youtube watch and short URLs", () => {
    const watch = parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const short = parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ");

    expect(watch).toEqual(
      expect.objectContaining({ provider: "youtube", contentId: "dQw4w9WgXcQ" })
    );
    expect(short).toEqual(
      expect.objectContaining({ provider: "youtube", contentId: "dQw4w9WgXcQ" })
    );
  });

  it("returns null for unsupported URL", () => {
    expect(parseEmbedUrl("https://example.com/foo")).toBeNull();
  });
});
