import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function validateSchedulerSecret(secret: string | undefined): string {
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SCHEDULER_SECRET must be at least 32 bytes");
  }
  return secret;
}

export function createSchedulerAuthMiddleware(getSecret: () => string | undefined) {
  return (request: Request, response: Response, next: NextFunction): void => {
    let expected: string;
    try {
      expected = validateSchedulerSecret(getSecret());
    } catch {
      response.status(503).json({ error: "Scheduler is not configured" });
      return;
    }

    const authorization = request.headers.authorization ?? "";
    const provided = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";
    const expectedBytes = Buffer.from(expected, "utf8");
    const providedBytes = Buffer.from(provided, "utf8");
    const valid =
      expectedBytes.length === providedBytes.length &&
      timingSafeEqual(expectedBytes, providedBytes);

    if (!valid) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}
