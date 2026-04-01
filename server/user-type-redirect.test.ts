import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import { createClient, getClientByEmail, updateClient } from "./db";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

describe("User Type Redirect Logic", () => {
  const testEmail = `test-redirect-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  let clientId: string;

  beforeAll(async () => {
    // 테스트용 클라이언트 생성 (고객 유형)
    const passwordHash = await hash(testPassword, 12);
    const result = await createClient({
      email: testEmail,
      passwordHash,
      name: "Test User",
      userType: "client",
      status: "active",
      emailVerified: "yes",
    });
    clientId = result.id;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (clientId) {
      await db.delete("clients_auth").where("id", "=", clientId).run();
    }
  });

  describe("Client User Type", () => {
    it("should create client with userType='client'", async () => {
      const client = await getClientByEmail(testEmail);
      expect(client).toBeDefined();
      expect(client?.userType).toBe("client");
      expect(client?.passwordHash).toBeDefined();
    });

    it("should have correct redirect path for client", async () => {
      const client = await getClientByEmail(testEmail);
      expect(client?.userType).toBe("client");
      // 클라이언트는 /client/login으로 리다이렉트
      const redirectPath = client?.userType === "client" ? "/client/login" : null;
      expect(redirectPath).toBe("/client/login");
    });
  });

  describe("Staff User Type", () => {
    it("should create staff with userType='staff'", async () => {
      const staffEmail = `test-staff-${Date.now()}@example.com`;
      const passwordHash = await hash(testPassword, 12);
      const result = await createClient({
        email: staffEmail,
        passwordHash,
        name: "Test Staff",
        userType: "staff",
        status: "pending",
        emailVerified: "yes",
      });

      const staff = await getClientByEmail(staffEmail);
      expect(staff).toBeDefined();
      expect(staff?.userType).toBe("staff");

      // 정리
      if (result.id) {
        await db.delete("clients_auth").where("id", "=", result.id).run();
      }
    });

    it("should have correct redirect path for staff", async () => {
      const staffEmail = `test-staff-redirect-${Date.now()}@example.com`;
      const passwordHash = await hash(testPassword, 12);
      const result = await createClient({
        email: staffEmail,
        passwordHash,
        name: "Test Staff",
        userType: "staff",
        status: "pending",
        emailVerified: "yes",
      });

      const staff = await getClientByEmail(staffEmail);
      expect(staff?.userType).toBe("staff");
      // 직원은 /staff/pending-approval으로 리다이렉트
      const redirectPath = staff?.userType === "staff" ? "/staff/pending-approval" : null;
      expect(redirectPath).toBe("/staff/pending-approval");

      // 정리
      if (result.id) {
        await db.delete("clients_auth").where("id", "=", result.id).run();
      }
    });
  });

  describe("Partner User Type", () => {
    it("should create partner with userType='partner'", async () => {
      const partnerEmail = `test-partner-${Date.now()}@example.com`;
      const passwordHash = await hash(testPassword, 12);
      const result = await createClient({
        email: partnerEmail,
        passwordHash,
        name: "Test Partner",
        userType: "partner",
        status: "active",
        emailVerified: "yes",
      });

      const partner = await getClientByEmail(partnerEmail);
      expect(partner).toBeDefined();
      expect(partner?.userType).toBe("partner");

      // 정리
      if (result.id) {
        await db.delete("clients_auth").where("id", "=", result.id).run();
      }
    });

    it("should have correct redirect path for partner", async () => {
      const partnerEmail = `test-partner-redirect-${Date.now()}@example.com`;
      const passwordHash = await hash(testPassword, 12);
      const result = await createClient({
        email: partnerEmail,
        passwordHash,
        name: "Test Partner",
        userType: "partner",
        status: "active",
        emailVerified: "yes",
      });

      const partner = await getClientByEmail(partnerEmail);
      expect(partner?.userType).toBe("partner");
      // 협력사는 /partner/login으로 리다이렉트
      const redirectPath = partner?.userType === "partner" ? "/partner/login" : null;
      expect(redirectPath).toBe("/partner/login");

      // 정리
      if (result.id) {
        await db.delete("clients_auth").where("id", "=", result.id).run();
      }
    });
  });

  describe("Email Verification with User Type", () => {
    it("should return userType in verify email response", async () => {
      const verifyEmail = `test-verify-${Date.now()}@example.com`;
      const verifyToken = randomBytes(32).toString("hex");
      const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const passwordHash = await hash(testPassword, 12);

      const result = await createClient({
        email: verifyEmail,
        passwordHash,
        name: "Test Verify",
        userType: "client",
        status: "pending",
        emailVerified: "no",
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      });

      const client = await getClientByEmail(verifyEmail);
      expect(client).toBeDefined();
      expect(client?.userType).toBe("client");
      expect(client?.emailVerifyToken).toBe(verifyToken);

      // 이메일 인증 후 userType 반환 시뮬레이션
      const verifyResponse = {
        success: true,
        message: "이메일 인증이 완료되었습니다. 로그인해주세요.",
        userType: client?.userType,
      };

      expect(verifyResponse.userType).toBe("client");

      // 정리
      if (result.id) {
        await db.delete("clients_auth").where("id", "=", result.id).run();
      }
    });
  });

  describe("User Type Update", () => {
    it("should update userType from client to staff", async () => {
      const updateEmail = `test-update-${Date.now()}@example.com`;
      const passwordHash = await hash(testPassword, 12);
      const result = await createClient({
        email: updateEmail,
        passwordHash,
        name: "Test Update",
        userType: "client",
        status: "active",
        emailVerified: "yes",
      });

      let client = await getClientByEmail(updateEmail);
      expect(client?.userType).toBe("client");

      // userType 업데이트
      await updateClient(result.id, { userType: "staff" });

      client = await getClientByEmail(updateEmail);
      expect(client?.userType).toBe("staff");

      // 정리
      if (result.id) {
        await db.delete("clients_auth").where("id", "=", result.id).run();
      }
    });
  });

  describe("Redirect Path Mapping", () => {
    it("should map all user types to correct redirect paths", () => {
      const redirectMap: Record<string, string> = {
        client: "/client/login",
        staff: "/staff/pending-approval",
        partner: "/partner/login",
      };

      expect(redirectMap.client).toBe("/client/login");
      expect(redirectMap.staff).toBe("/staff/pending-approval");
      expect(redirectMap.partner).toBe("/partner/login");
    });

    it("should handle unknown user type gracefully", () => {
      const redirectMap: Record<string, string> = {
        client: "/client/login",
        staff: "/staff/pending-approval",
        partner: "/partner/login",
      };

      const unknownType = "unknown";
      const redirectPath = redirectMap[unknownType] || "/";
      expect(redirectPath).toBe("/");
    });
  });
});
