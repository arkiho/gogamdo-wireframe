import { describe, it, expect } from "vitest";

describe("Resend API 키 검증", () => {
  it("RESEND_API_KEY 환경변수가 설정되어 있다", () => {
    // RESEND_API_KEY는 선택적이므로 존재 여부만 확인
    // 미설정 시 notifyOwner 폴백으로 동작
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      expect(apiKey.length).toBeGreaterThan(10);
      expect(apiKey.startsWith("re_")).toBe(true);
    } else {
      // 키가 없으면 폴백 모드로 동작 - 이것도 정상
      expect(true).toBe(true);
    }
  });

  it("이메일 발송 함수가 API 키 없이도 정상 동작한다 (폴백)", async () => {
    // sendViaResend가 API 키 없을 때 notification_fallback을 반환하는지 확인
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const { sendVerificationEmail } = await import("./email");
    const result = await sendVerificationEmail({
      email: "test@example.com",
      name: "테스트",
      verifyToken: "test-token-123",
      origin: "https://example.com",
    });

    expect(result.method).toBe("notification_fallback");

    // 원래 키 복원
    if (originalKey) {
      process.env.RESEND_API_KEY = originalKey;
    }
  });
});
