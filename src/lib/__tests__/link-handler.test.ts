import { normalizeExternalUrl } from "@/lib/link-handler";

describe("normalizeExternalUrl", () => {
  it("leaves a fully-qualified https URL unchanged", () => {
    expect(normalizeExternalUrl("https://example.com/path")).toBe(
      "https://example.com/path"
    );
  });

  it("leaves a fully-qualified http URL unchanged", () => {
    expect(normalizeExternalUrl("http://example.com")).toBe(
      "http://example.com"
    );
  });

  it("prepends https:// to a scheme-less www. URL", () => {
    expect(normalizeExternalUrl("www.example.com/product")).toBe(
      "https://www.example.com/product"
    );
  });

  it("rejects unsafe schemes", () => {
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("mailto:hi@example.com")).toBeNull();
  });

  it("rejects non-URL text", () => {
    expect(normalizeExternalUrl("not a url")).toBeNull();
    expect(normalizeExternalUrl("")).toBeNull();
    // bare domain without www. or scheme is not treated as a link
    expect(normalizeExternalUrl("example.com")).toBeNull();
  });
});
