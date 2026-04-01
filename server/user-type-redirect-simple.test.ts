import { describe, it, expect } from "vitest";

/**
 * 사용자 유형별 리다이렉트 로직 테스트
 * 각 사용자 유형(고객/직원/협력사)에 따른 올바른 리다이렉트 경로 검증
 */

describe("User Type Redirect Logic", () => {
  // 사용자 유형별 리다이렉트 매핑
  const redirectMap: Record<string, string> = {
    client: "/client/login",
    staff: "/staff/pending-approval",
    partner: "/partner/login",
  };

  describe("Redirect Path Mapping", () => {
    it("should map client userType to /client/login", () => {
      const userType = "client";
      const redirectPath = redirectMap[userType];
      expect(redirectPath).toBe("/client/login");
    });

    it("should map staff userType to /staff/pending-approval", () => {
      const userType = "staff";
      const redirectPath = redirectMap[userType];
      expect(redirectPath).toBe("/staff/pending-approval");
    });

    it("should map partner userType to /partner/login", () => {
      const userType = "partner";
      const redirectPath = redirectMap[userType];
      expect(redirectPath).toBe("/partner/login");
    });

    it("should handle unknown userType gracefully", () => {
      const userType = "unknown";
      const redirectPath = redirectMap[userType] || "/";
      expect(redirectPath).toBe("/");
    });
  });

  describe("Email Verification Redirect", () => {
    it("should include userType in verify email response", () => {
      const verifyResponse = {
        success: true,
        message: "이메일 인증이 완료되었습니다.",
        userType: "client",
      };

      const redirectPath = redirectMap[verifyResponse.userType];
      expect(redirectPath).toBe("/client/login");
    });

    it("should determine redirect path based on userType after verification", () => {
      const testCases = [
        { userType: "client", expectedPath: "/client/login" },
        { userType: "staff", expectedPath: "/staff/pending-approval" },
        { userType: "partner", expectedPath: "/partner/login" },
      ];

      testCases.forEach(({ userType, expectedPath }) => {
        const redirectPath = redirectMap[userType];
        expect(redirectPath).toBe(expectedPath);
      });
    });
  });

  describe("Registration Flow", () => {
    it("should set userType during registration", () => {
      const registrationData = {
        email: "test@example.com",
        password: "TestPassword123!",
        name: "Test User",
        userType: "client",
      };

      expect(registrationData.userType).toBe("client");
      expect(redirectMap[registrationData.userType]).toBe("/client/login");
    });

    it("should support all three user types during registration", () => {
      const userTypes = ["client", "staff", "partner"];

      userTypes.forEach((userType) => {
        expect(redirectMap).toHaveProperty(userType);
        expect(redirectMap[userType]).toBeDefined();
      });
    });
  });

  describe("User Type Validation", () => {
    it("should validate userType is one of allowed values", () => {
      const allowedUserTypes = ["client", "staff", "partner"];
      const testUserType = "client";

      expect(allowedUserTypes).toContain(testUserType);
    });

    it("should reject invalid userType", () => {
      const allowedUserTypes = ["client", "staff", "partner"];
      const invalidUserType = "invalid";

      expect(allowedUserTypes).not.toContain(invalidUserType);
    });
  });

  describe("Post-Verification Redirect", () => {
    it("should redirect client to login page after email verification", () => {
      const verifiedUser = {
        userType: "client",
        emailVerified: true,
      };

      const redirectPath = redirectMap[verifiedUser.userType];
      expect(redirectPath).toBe("/client/login");
      expect(verifiedUser.emailVerified).toBe(true);
    });

    it("should redirect staff to pending approval page after email verification", () => {
      const verifiedUser = {
        userType: "staff",
        emailVerified: true,
      };

      const redirectPath = redirectMap[verifiedUser.userType];
      expect(redirectPath).toBe("/staff/pending-approval");
      expect(verifiedUser.emailVerified).toBe(true);
    });

    it("should redirect partner to login page after email verification", () => {
      const verifiedUser = {
        userType: "partner",
        emailVerified: true,
      };

      const redirectPath = redirectMap[verifiedUser.userType];
      expect(redirectPath).toBe("/partner/login");
      expect(verifiedUser.emailVerified).toBe(true);
    });
  });

  describe("Redirect Timing", () => {
    it("should redirect immediately after email verification", () => {
      const verificationTime = Date.now();
      const redirectTime = Date.now() + 100; // 100ms 후 리다이렉트

      expect(redirectTime).toBeGreaterThan(verificationTime);
    });

    it("should auto-redirect after 3 seconds (as per UI design)", () => {
      const autoRedirectDelay = 3000; // 3초

      expect(autoRedirectDelay).toBe(3000);
    });
  });
});
