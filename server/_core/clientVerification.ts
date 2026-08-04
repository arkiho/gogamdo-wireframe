import { activatePendingClientByVerifyToken } from "../db";

/** Atomically permits only the expected pending -> active verification transition. */
export async function activatePendingClientByVerificationToken(token: string): Promise<boolean> {
  return activatePendingClientByVerifyToken(token);
}
