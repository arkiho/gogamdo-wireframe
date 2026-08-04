import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_ISSUER = "kokamdo.co.kr";
const STAFF_AUDIENCE = "kokamdo-staff";
const CLIENT_AUDIENCE = "kokamdo-client";
const MIN_SECRET_BYTES = 32;
const HISTORICAL_FALLBACKS = new Set([
  "fallback-secret",
  "kokamdo-fallback-secret-key-change-me",
]);

export type StaffSessionClaims = {
  userId: number;
  name: string;
  email: string;
  type?: "staff";
};

export type ClientSessionClaims = {
  clientId: number;
  name: string;
  email: string;
  type?: "client";
};

export function getSessionSecretBytes(secret: string | undefined): Uint8Array {
  if (
    !secret ||
    secret.trim() !== secret ||
    HISTORICAL_FALLBACKS.has(secret) ||
    Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES
  ) {
    throw new Error(
      `JWT_SECRET must be configured with at least ${MIN_SECRET_BYTES} bytes and must not use a historical fallback`,
    );
  }

  return new TextEncoder().encode(secret);
}

function assertTextClaim(payload: JWTPayload, key: "name" | "email"): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

export async function signStaffSession(
  claims: StaffSessionClaims,
  secret = process.env.JWT_SECRET,
  expiresIn: string | number | Date = "7d",
): Promise<string> {
  return new SignJWT({
    userId: claims.userId,
    name: claims.name,
    email: claims.email,
    type: "staff",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(STAFF_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSessionSecretBytes(secret));
}

export async function verifyStaffSession(
  token: string,
  secret = process.env.JWT_SECRET,
): Promise<StaffSessionClaims & { type: "staff" }> {
  const { payload } = await jwtVerify(token, getSessionSecretBytes(secret), {
    algorithms: ["HS256"],
    issuer: SESSION_ISSUER,
    audience: STAFF_AUDIENCE,
  });

  if (payload.type !== "staff" || typeof payload.userId !== "number" || !payload.userId) {
    throw new Error("Invalid staff session claims");
  }

  return {
    userId: payload.userId,
    name: assertTextClaim(payload, "name"),
    email: assertTextClaim(payload, "email"),
    type: "staff",
  };
}

export async function signClientSession(
  claims: ClientSessionClaims,
  secret = process.env.JWT_SECRET,
  expiresIn: string | number | Date = "7d",
): Promise<string> {
  return new SignJWT({
    clientId: claims.clientId,
    name: claims.name,
    email: claims.email,
    type: "client",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(CLIENT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSessionSecretBytes(secret));
}

export async function verifyClientSession(
  token: string,
  secret = process.env.JWT_SECRET,
): Promise<ClientSessionClaims & { type: "client" }> {
  const { payload } = await jwtVerify(token, getSessionSecretBytes(secret), {
    algorithms: ["HS256"],
    issuer: SESSION_ISSUER,
    audience: CLIENT_AUDIENCE,
  });

  if (payload.type !== "client" || typeof payload.clientId !== "number" || !payload.clientId) {
    throw new Error("Invalid client session claims");
  }

  return {
    clientId: payload.clientId,
    name: assertTextClaim(payload, "name"),
    email: assertTextClaim(payload, "email"),
    type: "client",
  };
}
