import type { NextFunction, Request, Response } from "express";
import { normalizeStorageKey } from "../storage";
import type { StorageAuthorization, StorageSubject } from "./storageAuthorization";

export type StorageVisibility = "public" | "private";

type StorageAccessDependencies = {
  authenticate: (request: Request) => Promise<StorageSubject>;
  authorize: (key: string, subject: StorageSubject | null) => Promise<StorageAuthorization>;
};

export function classifyStorageKey(key: string): StorageVisibility {
  try {
    normalizeStorageKey(key);
  } catch {
    return "private";
  }
  return "private";
}

export function createStorageAccessMiddleware(dependencies: StorageAccessDependencies) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    response.setHeader("Cache-Control", "private, no-store");

    let key: string;
    try {
      key = normalizeStorageKey(decodeURIComponent(request.path.replace(/^\/+/, "")));
    } catch {
      response.status(404).json({ error: "File not found" });
      return;
    }

    let subject: StorageSubject | null = null;
    try {
      subject = await dependencies.authenticate(request);
    } catch {
      subject = null;
    }

    try {
      const authorization = await dependencies.authorize(key, subject);
      if (!authorization) {
        response.status(404).json({ error: "File not found" });
        return;
      }
      if (authorization === "public") {
        response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
      next();
    } catch {
      response.status(404).json({ error: "File not found" });
    }
  };
}
