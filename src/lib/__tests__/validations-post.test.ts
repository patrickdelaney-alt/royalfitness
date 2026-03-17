import { createPostSchema } from "@/lib/validations";

describe("createPostSchema compatibility", () => {
  it("accepts legacy text/photo post payload without embed", () => {
    const result = createPostSchema.safeParse({
      type: "GENERAL",
      caption: "hello",
      mediaUrl: "https://cdn.example.com/photo.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("accepts supported embed payload", () => {
    const result = createPostSchema.safeParse({
      type: "GENERAL",
      embed: {
        provider: "youtube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        contentId: "dQw4w9WgXcQ",
      },
    });

    expect(result.success).toBe(true);
  });
});
