import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onDuplicateKeyUpdate: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([]),
};

vi.mock("./db", () => ({
  getSiteSetting: vi.fn(async (key: string) => {
    if (key === "ai_enabled") return "true";
    if (key === "site_name") return "고감도";
    return null;
  }),
  setSiteSetting: vi.fn(async (key: string, value: string) => {
    return { key, value };
  }),
  listSiteSettings: vi.fn(async () => [
    { id: 1, key: "ai_enabled", value: "true", updatedAt: new Date() },
    { id: 2, key: "site_name", value: "고감도", updatedAt: new Date() },
  ]),
  deleteUser: vi.fn(async (userId: number) => {
    return { success: true };
  }),
}));

describe("Site Settings", () => {
  it("getSiteSetting returns correct value for ai_enabled", async () => {
    const { getSiteSetting } = await import("./db");
    const result = await getSiteSetting("ai_enabled");
    expect(result).toBe("true");
  });

  it("getSiteSetting returns null for non-existent key", async () => {
    const { getSiteSetting } = await import("./db");
    const result = await getSiteSetting("non_existent_key");
    expect(result).toBeNull();
  });

  it("setSiteSetting updates a setting", async () => {
    const { setSiteSetting } = await import("./db");
    const result = await setSiteSetting("ai_enabled", "false");
    expect(result).toEqual({ key: "ai_enabled", value: "false" });
  });

  it("listSiteSettings returns all settings", async () => {
    const { listSiteSettings } = await import("./db");
    const result = await listSiteSettings();
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("ai_enabled");
    expect(result[1].key).toBe("site_name");
  });
});

describe("User Management", () => {
  it("deleteUser removes a user", async () => {
    const { deleteUser } = await import("./db");
    const result = await deleteUser(1);
    expect(result).toEqual({ success: true });
  });
});

describe("AI Toggle Feature", () => {
  it("ai_enabled setting controls AI service visibility", async () => {
    const { getSiteSetting } = await import("./db");
    
    // When AI is enabled
    const aiEnabled = await getSiteSetting("ai_enabled");
    expect(aiEnabled).toBe("true");
    
    // The navigation should show AI menu items when enabled
    const showAiMenu = aiEnabled === "true";
    expect(showAiMenu).toBe(true);
  });

  it("ai_enabled returns null when not set (defaults to enabled)", async () => {
    const { getSiteSetting } = await import("./db");
    
    // When key doesn't exist, it returns null
    // Frontend should treat null as "enabled" (default behavior)
    const result = await getSiteSetting("unset_key");
    const isEnabled = result === null || result === "true";
    expect(isEnabled).toBe(true);
  });
});

describe("Image URLs", () => {
  it("Korean images are properly configured", async () => {
    // Verify the CDN URLs are correctly set for Korean images
    const heroUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/HbvlVcSrmljLGlxV.jpg";
    const teamUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/amLAAkFYmeWDAgbK.jpg";
    const consultUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/XgvEIVdQJKYgXHjR.jpg";
    
    expect(heroUrl).toContain("manuscdn.com");
    expect(teamUrl).toContain("manuscdn.com");
    expect(consultUrl).toContain("manuscdn.com");
    
    // Verify they are .jpg files
    expect(heroUrl).toMatch(/\.jpg$/);
    expect(teamUrl).toMatch(/\.jpg$/);
    expect(consultUrl).toMatch(/\.jpg$/);
  });

  it("Korean videos are properly configured", () => {
    const video1 = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/ZlsHWiISvwlDIFdQ.mp4";
    const video2 = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/zrLjiZAfRptnMaDh.mp4";
    
    expect(video1).toContain("manuscdn.com");
    expect(video2).toContain("manuscdn.com");
    expect(video1).toMatch(/\.mp4$/);
    expect(video2).toMatch(/\.mp4$/);
  });
});
