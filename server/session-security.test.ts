import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  getSessionSecretBytes,
  signClientSession,
  signStaffSession,
  verifyClientSession,
  verifyStaffSession,
} from "./_core/sessionSecurity";

const VALID_SECRET = "0123456789abcdef0123456789abcdef";

describe("session security", () => {
  it.each([undefined, "", "short", "fallback-secret", "kokamdo-fallback-secret-key-change-me"])(
    "rejects missing, weak, or historical secret %s",
    (secret) => {
      expect(() => getSessionSecretBytes(secret)).toThrow(/JWT_SECRET/);
    },
  );

  it("accepts a high-entropy-sized configured secret", () => {
    expect(getSessionSecretBytes(VALID_SECRET)).toHaveLength(32);
  });

  it("signs and verifies staff sessions with constrained claims", async () => {
    const token = await signStaffSession(
      { userId: 7, name: "관리자", email: "admin@example.com" },
      VALID_SECRET,
      "1h",
    );

    await expect(verifyStaffSession(token, VALID_SECRET)).resolves.toMatchObject({
      userId: 7,
      type: "staff",
    });
    await expect(verifyClientSession(token, VALID_SECRET)).rejects.toThrow();
  });

  it("signs and verifies client sessions with constrained claims", async () => {
    const token = await signClientSession(
      { clientId: 11, name: "고객", email: "client@example.com" },
      VALID_SECRET,
      "1h",
    );

    await expect(verifyClientSession(token, VALID_SECRET)).resolves.toMatchObject({
      clientId: 11,
      type: "client",
    });
    await expect(verifyStaffSession(token, VALID_SECRET)).rejects.toThrow();
  });

  it("rejects a forged client token signed with the historical fallback", async () => {
    const forged = await new SignJWT({ clientId: 1, type: "client" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("fallback-secret"));

    await expect(verifyClientSession(forged, VALID_SECRET)).rejects.toThrow();
  });

  it("rejects a token with missing issuer and audience even when signed by the configured secret", async () => {
    const unconstrained = await new SignJWT({ clientId: 1, type: "client" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(getSessionSecretBytes(VALID_SECRET));

    await expect(verifyClientSession(unconstrained, VALID_SECRET)).rejects.toThrow();
  });
});
