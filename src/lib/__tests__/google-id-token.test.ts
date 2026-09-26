/**
 * @jest-environment node
 */
const jwtVerify = jest.fn();

jest.mock("jose", () => ({
  createRemoteJWKSet: jest.fn(() => "google-jwks"),
  jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}));

import { verifyGoogleIdToken } from "../google-id-token";

const ENV = { ...process.env };

beforeEach(() => {
  jwtVerify.mockReset();
  process.env = { ...ENV, GOOGLE_IOS_CLIENT_ID: "ios-client", GOOGLE_CLIENT_ID: "web-client" };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  process.env = ENV;
});

describe("verifyGoogleIdToken", () => {
  it("returns the identity for a valid, verified token", async () => {
    jwtVerify.mockResolvedValue({
      payload: {
        sub: "123",
        email: "Someone@Gmail.com",
        email_verified: true,
        name: "Some One",
        picture: "https://img",
      },
    });

    await expect(verifyGoogleIdToken("tok")).resolves.toEqual({
      sub: "123",
      email: "someone@gmail.com",
      name: "Some One",
      picture: "https://img",
    });

    const [token, keys, opts] = jwtVerify.mock.calls[0];
    expect(token).toBe("tok");
    expect(keys).toBe("google-jwks");
    expect(opts.audience).toEqual(["ios-client", "web-client"]);
    expect(opts.issuer).toContain("https://accounts.google.com");
  });

  it("rejects tokens whose email Google hasn't verified", async () => {
    jwtVerify.mockResolvedValue({
      payload: { sub: "1", email: "a@b.com", email_verified: false },
    });
    await expect(verifyGoogleIdToken("tok")).resolves.toBeNull();
  });

  it("rejects tokens that fail signature, audience or expiry checks", async () => {
    jwtVerify.mockRejectedValue(new Error("unexpected \"aud\" claim value"));
    await expect(verifyGoogleIdToken("tok")).resolves.toBeNull();
  });

  it("refuses everything when no Google client IDs are configured", async () => {
    delete process.env.GOOGLE_IOS_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    await expect(verifyGoogleIdToken("tok")).resolves.toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("refuses an empty token", async () => {
    await expect(verifyGoogleIdToken("")).resolves.toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });
});
