import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("posts feed cache contract", () => {
  it("requires personalized feed responses to be revalidated", () => {
    const source = readFileSync(join(process.cwd(), "src/app/api/posts/route.ts"), "utf8");
    expect(source).toContain('export const POSTS_CACHE_CONTROL = "private, no-cache"');
    expect(source).toContain('{ headers: { "Cache-Control": POSTS_CACHE_CONTROL } }');
  });

  it("bypasses the HTTP cache when SWR reconciles mutable feed data", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(main)/feed/FeedContent.tsx"),
      "utf8"
    );
    expect(source).toContain('fetch(url, { cache: "no-store" })');
  });
});
