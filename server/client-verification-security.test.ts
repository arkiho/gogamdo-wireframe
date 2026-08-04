import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("client verification security contract", () => {
  it("uses one conditional UPDATE for pending verification activation", async () => {
    const db = await readFile(new URL("./db.ts", import.meta.url), "utf8");
    const start = db.indexOf("export async function activatePendingClientByVerifyToken");
    const end = db.indexOf("export async function getClientByResetToken", start);
    const activation = db.slice(start, end);
    expect(activation).toContain("db.update(clients)");
    expect(activation).toContain("eq(clients.emailVerifyToken, token)");
    expect(activation).toContain('eq(clients.status, "pending")');
    expect(activation).toContain('eq(clients.emailVerified, "no")');
    expect(activation).toContain("gt(clients.emailVerifyExpires, new Date())");
    expect(activation).toContain("affectedRows === 1");
    expect(activation).not.toContain("db.select");
  });

  it("never returns verification bearer tokens from public registration or resend", async () => {
    const routers = await readFile(new URL("./routers.ts", import.meta.url), "utf8");
    const clientAuth = routers.slice(routers.indexOf("clientAuth: router"), routers.indexOf("clientManagement: router"));
    const publicReturns = [...clientAuth.matchAll(/return \{ success: true,[^\n]+\};/g)].map(match => match[0]);
    expect(publicReturns.length).toBeGreaterThan(0);
    expect(publicReturns.join("\n")).not.toContain("emailVerifyToken");
  });

  it("routes clients_auth login to the clients_auth-backed dashboard", async () => {
    const login = await readFile(new URL("../client/src/pages/ClientLogin.tsx", import.meta.url), "utf8");
    expect(login).toContain('navigate("/client/dashboard")');
    expect(login).not.toContain('navigate("/portal")');
  });
});
