import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadSubject = { kind: "staff" | "client"; id: number };

type UploadDependencies = {
  authenticate: (req: Request) => Promise<UploadSubject>;
  put: (
    key: string,
    data: Buffer | Uint8Array | string,
    contentType?: string,
  ) => Promise<{ key: string; url: string }>;
};

type DetectedFile = {
  extension: string;
  contentType: string;
  acceptedMimeTypes: readonly string[];
};

function hasPrefix(data: Buffer, bytes: readonly number[]): boolean {
  return bytes.every((byte, index) => data[index] === byte);
}

function detectFile(data: Buffer): DetectedFile | null {
  if (hasPrefix(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: "png", contentType: "image/png", acceptedMimeTypes: ["image/png"] };
  }
  if (hasPrefix(data, [0xff, 0xd8, 0xff])) {
    return { extension: "jpg", contentType: "image/jpeg", acceptedMimeTypes: ["image/jpeg", "image/jpg"] };
  }
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp", acceptedMimeTypes: ["image/webp"] };
  }
  if (data.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { extension: "pdf", contentType: "application/pdf", acceptedMimeTypes: ["application/pdf"] };
  }
  if (hasPrefix(data, [0x50, 0x4b, 0x03, 0x04])) {
    return {
      extension: "xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      acceptedMimeTypes: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };
  }
  if (hasPrefix(data, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return {
      extension: "xls",
      contentType: "application/vnd.ms-excel",
      acceptedMimeTypes: ["application/vnd.ms-excel", "application/msword"],
    };
  }
  return null;
}

function decodeBase64(value: unknown): Buffer | null {
  if (
    typeof value !== "string" ||
    !value ||
    value.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value)
  ) {
    return null;
  }

  const decoded = Buffer.from(value, "base64");
  return decoded.toString("base64") === value ? decoded : null;
}

function normalizePrefix(value: unknown): string | null {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(value)) {
    return null;
  }
  return value;
}

const STAFF_UPLOAD_PREFIXES = new Set(["upload", "receipt", "bankbook", "bizcert", "avatar"]);

function resolveUploadNamespace(subject: UploadSubject, prefix: string): string | null {
  if (subject.kind === "client") {
    return prefix === "avatar" ? `avatar/client-${subject.id}` : null;
  }
  if (!STAFF_UPLOAD_PREFIXES.has(prefix)) return null;
  return prefix === "avatar" ? `avatar/staff-${subject.id}` : prefix;
}

export function createUploadHandler(dependencies: UploadDependencies) {
  return async (req: Request, res: Response): Promise<void> => {
    let subject: UploadSubject;
    try {
      subject = await dependencies.authenticate(req);
    } catch {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const body = req.body as Record<string, unknown> | undefined;
    const data = decodeBase64(body?.data);
    const filename = body?.filename;
    const requestedMimeType = body?.mimeType;
    const prefix = normalizePrefix(body?.prefix ?? "upload");

    if (!data || typeof filename !== "string" || typeof requestedMimeType !== "string" || !prefix) {
      res.status(400).json({ error: "Invalid upload request" });
      return;
    }
    const namespace = resolveUploadNamespace(subject, prefix);
    if (!namespace) {
      res.status(403).json({ error: "Upload purpose is not allowed" });
      return;
    }
    if (data.length > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: "Upload exceeds the 10 MB limit" });
      return;
    }

    const detected = detectFile(data);
    if (!detected || !detected.acceptedMimeTypes.includes(requestedMimeType)) {
      res.status(415).json({ error: "Unsupported or mismatched file type" });
      return;
    }

    try {
      const key = `${namespace}/${randomUUID()}.${detected.extension}`;
      const result = await dependencies.put(key, data, detected.contentType);
      res.status(200).json({ url: result.url, key: result.key });
    } catch (error) {
      console.error("[Upload] Storage failure", error);
      res.status(500).json({ error: "Upload failed" });
    }
  };
}
