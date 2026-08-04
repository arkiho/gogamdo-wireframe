import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isStaffAvatarUrlOwnedByStaff } from "./_core/storageAuthorization";

const source = (file: string) => readFileSync(path.join(import.meta.dirname, file), "utf8");

describe("client and staff mutation authorization boundaries", () => {
  it("accepts only an avatar URL scoped to the authenticated staff member", () => {
    expect(isStaffAvatarUrlOwnedByStaff("/uploads/avatar/staff-7/avatar.png", 7)).toBe(true);
    expect(isStaffAvatarUrlOwnedByStaff("avatar/staff-7/avatar.png", 7)).toBe(true);
    expect(isStaffAvatarUrlOwnedByStaff("/uploads/avatar/staff-8/avatar.png", 7)).toBe(false);
    expect(isStaffAvatarUrlOwnedByStaff("/uploads/avatar/client-7/avatar.png", 7)).toBe(false);
    expect(isStaffAvatarUrlOwnedByStaff("https://evil.example/uploads/avatar/staff-7/avatar.png", 7)).toBe(false);
  });

  it("requires an active client for every authenticated profile mutation", () => {
    const routers = source("routers.ts");
    for (const next of ["updateNotifPrefs:", "changePassword:", "verifyEmail:"]) {
      const start = routers.indexOf(next === "updateNotifPrefs:" ? "updateProfile:" : next === "changePassword:" ? "updateNotifPrefs:" : "changePassword:");
      const end = routers.indexOf(next, start + 1);
      expect(routers.slice(start, end)).toContain("requireActiveClient(ctx)");
    }
  });

  it("requires an active client before assigned-project sensor reads", () => {
    const routers = source("routers.ts");
    const sensorTimeSeries = routers.slice(routers.indexOf("sensorTimeSeries:"), routers.indexOf("zoneStats:"));
    const zoneStats = routers.slice(routers.indexOf("zoneStats:"), routers.indexOf("// ===== 고객 알림"));
    expect(sensorTimeSeries).toContain("const client = await requireActiveClient(ctx)");
    expect(zoneStats).toContain("const client = await requireActiveClient(ctx)");
  });

  it("binds notification mutation IDs to the authenticated active client", () => {
    const routers = source("routers.ts");
    const db = source("db.ts");
    const notificationRouter = routers.slice(routers.indexOf("clientNotification: router"), routers.indexOf("// ===== 사이트 설정"));
    expect(notificationRouter).toContain("const client = await requireActiveClient(ctx)");
    expect(notificationRouter).toContain("markClientNotificationRead(input.id, client.id)");
    expect(notificationRouter).toContain("deleteClientNotification(input.id, client.id)");
    expect(db).toContain("markClientNotificationRead(id: number, clientId: number)");
    expect(db).toContain("and(eq(clientNotifications.id, id), eq(clientNotifications.clientId, clientId))");
    expect(db).toContain("deleteClientNotification(id: number, clientId: number)");
  });

  it("validates staff avatar ownership and persists null when clearing", () => {
    const routers = source("routers.ts");
    const update = routers.slice(routers.indexOf("updateMyProfile:"), routers.indexOf("changeMyPassword:"));
    expect(update).toContain("isStaffAvatarUrlOwnedByStaff(input.avatarUrl, ctx.user.id)");
    expect(update).toContain('avatarUrl: input.avatarUrl === "" ? null : input.avatarUrl');
  });
});
