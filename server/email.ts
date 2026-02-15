/**
 * 이메일 발송 유틸리티
 * Resend API를 활용한 실제 이메일 발송 + notifyOwner 폴백
 * 
 * 지원 이메일 유형:
 * 1. 이메일 인증 (회원가입 시)
 * 2. 인증 메일 재발송
 * 3. 비밀번호 재설정
 * 4. 포트폴리오 리뷰 요청
 */

import { notifyOwner } from "./_core/notification";

// ============================================================
// Types
// ============================================================

interface EmailResult {
  sent: boolean;
  method: "resend" | "notification_fallback";
  error?: string;
}

interface ReviewEmailData {
  reviewerName: string;
  reviewerEmail: string;
  reviewerCompany?: string;
  projectTitle: string;
  reviewUrl: string;
  expiresAt: Date;
}

interface VerificationEmailData {
  email: string;
  name: string;
  verifyToken: string;
  origin: string;
}

interface PasswordResetEmailData {
  email: string;
  name: string;
  resetToken: string;
  origin: string;
}

// ============================================================
// Core Send Function
// ============================================================

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "고감도 <noreply@kokamdo.co.kr>";

  if (!resendApiKey) {
    return { sent: false, method: "notification_fallback", error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Email] Sent via Resend to ${params.to}: ${data.id}`);
      return { sent: true, method: "resend" };
    }

    const errorText = await response.text();
    console.warn(`[Email] Resend API failed (${response.status}):`, errorText);
    return { sent: false, method: "notification_fallback", error: errorText };
  } catch (error: any) {
    console.warn("[Email] Resend API error:", error.message);
    return { sent: false, method: "notification_fallback", error: error.message };
  }
}

// ============================================================
// Email Base Template
// ============================================================

function emailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f3ef;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a1a;padding:32px 40px;text-align:center;">
              <span style="color:#c8a97e;font-size:24px;font-weight:700;letter-spacing:2px;">KOKAMDO</span>
              <br>
              <span style="color:#ffffff80;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Office Interior Specialist</span>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f3ef;padding:24px 40px;text-align:center;">
              <p style="font-size:11px;color:#999;margin:0 0 4px 0;">
                (주)고감도 | 서울특별시 서초구 서초대로 398, 4층
              </p>
              <p style="font-size:11px;color:#999;margin:0;">
                02-6952-3111 | contact@kokamdo.co.kr
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================
// Email Templates
// ============================================================

function generateVerificationEmailHtml(data: VerificationEmailData): string {
  const verifyUrl = `${data.origin}/api/verify-email?token=${data.verifyToken}`;

  return emailWrapper(`
    <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 8px 0;font-weight:700;">
      이메일 인증을 완료해주세요
    </h1>
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;line-height:1.6;">
      안녕하세요, <strong>${data.name}</strong>님.<br>
      고감도 고객 포털에 가입해주셔서 감사합니다.<br>
      아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
    </p>
    
    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" 
             style="display:inline-block;background-color:#c8a97e;color:#1a1a1a;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
            이메일 인증하기
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#999;margin:0 0 8px 0;">
      위 버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하여 접속해주세요:
    </p>
    <p style="font-size:11px;color:#c8a97e;word-break:break-all;margin:0 0 24px 0;">
      ${verifyUrl}
    </p>

    <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px;">
      <p style="font-size:12px;color:#999;margin:0;line-height:1.5;">
        ⏰ 인증 유효 기간: 24시간<br>
        🔒 본인이 가입하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
      </p>
    </div>
  `);
}

function generatePasswordResetEmailHtml(data: PasswordResetEmailData): string {
  const resetUrl = `${data.origin}/client/reset-password?token=${data.resetToken}`;

  return emailWrapper(`
    <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 8px 0;font-weight:700;">
      비밀번호 재설정
    </h1>
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;line-height:1.6;">
      안녕하세요, <strong>${data.name}</strong>님.<br>
      비밀번호 재설정을 요청하셨습니다.<br>
      아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
    </p>
    
    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" 
             style="display:inline-block;background-color:#c8a97e;color:#1a1a1a;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
            비밀번호 재설정하기
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#999;margin:0 0 8px 0;">
      위 버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하여 접속해주세요:
    </p>
    <p style="font-size:11px;color:#c8a97e;word-break:break-all;margin:0 0 24px 0;">
      ${resetUrl}
    </p>

    <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px;">
      <p style="font-size:12px;color:#999;margin:0;line-height:1.5;">
        ⏰ 재설정 링크 유효 기간: 1시간<br>
        🔒 본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.<br>
        비밀번호는 자동으로 변경되지 않습니다.
      </p>
    </div>
  `);
}

export function generateReviewEmailHtml(data: ReviewEmailData): string {
  const expiresDate = new Date(data.expiresAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return emailWrapper(`
    <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 8px 0;font-weight:700;">
      프로젝트 리뷰를 요청드립니다
    </h1>
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;line-height:1.6;">
      안녕하세요, ${data.reviewerName}님.
      ${data.reviewerCompany ? `<br>${data.reviewerCompany}의 ` : ""}
      <strong>${data.projectTitle}</strong> 프로젝트에 대한 리뷰를 부탁드립니다.
    </p>
    
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;line-height:1.6;">
      고감도와 함께한 프로젝트에 대한 솔직한 의견을 남겨주시면,
      더 나은 서비스를 제공하는 데 큰 도움이 됩니다.
    </p>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td align="center">
          <a href="${data.reviewUrl}" 
             style="display:inline-block;background-color:#c8a97e;color:#1a1a1a;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
            리뷰 작성하기
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#999;margin:0 0 8px 0;">
      위 버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하여 접속해주세요:
    </p>
    <p style="font-size:11px;color:#c8a97e;word-break:break-all;margin:0 0 24px 0;">
      ${data.reviewUrl}
    </p>

    <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px;">
      <p style="font-size:12px;color:#999;margin:0;line-height:1.5;">
        ⏰ 리뷰 작성 기한: <strong>${expiresDate}</strong>까지<br>
        📝 작성 시간: 약 3~5분 소요<br>
        🔒 작성하신 리뷰는 관리자 승인 후 공개됩니다
      </p>
    </div>
  `);
}

// ============================================================
// Public Send Functions
// ============================================================

/**
 * 이메일 인증 메일 발송
 */
export async function sendVerificationEmail(data: VerificationEmailData): Promise<EmailResult> {
  const html = generateVerificationEmailHtml(data);
  
  // Resend로 발송 시도
  const result = await sendViaResend({
    to: data.email,
    subject: "[고감도] 이메일 인증을 완료해주세요",
    html,
  });

  if (result.sent) return result;

  // Fallback: 관리자에게 알림
  try {
    const verifyUrl = `${data.origin}/api/verify-email?token=${data.verifyToken}`;
    await notifyOwner({
      title: `[고감도] 이메일 인증 필요: ${data.name} (${data.email})`,
      content: `고객 ${data.name}님(${data.email})의 이메일 인증이 필요합니다.\n\n인증 링크: ${verifyUrl}\n\n※ Resend API 키가 설정되지 않아 직접 이메일을 보내주시거나, 관리자 대시보드에서 수동 인증 처리해주세요.`,
    });
  } catch { /* 알림 실패해도 진행 */ }

  return result;
}

/**
 * 비밀번호 재설정 메일 발송
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailResult> {
  const html = generatePasswordResetEmailHtml(data);
  
  const result = await sendViaResend({
    to: data.email,
    subject: "[고감도] 비밀번호 재설정 안내",
    html,
  });

  if (result.sent) return result;

  // Fallback: 관리자에게 알림
  try {
    const resetUrl = `${data.origin}/client/reset-password?token=${data.resetToken}`;
    await notifyOwner({
      title: `[고감도] 비밀번호 재설정 요청: ${data.name} (${data.email})`,
      content: `고객 ${data.name}님(${data.email})이 비밀번호 재설정을 요청했습니다.\n\n재설정 링크: ${resetUrl}\n\n※ Resend API 키가 설정되지 않아 직접 이메일을 보내주시거나, 관리자 대시보드에서 비밀번호를 직접 재설정해주세요.`,
    });
  } catch { /* ignore */ }

  return result;
}

/**
 * 리뷰 요청 이메일 발송
 */
export async function sendReviewRequestEmail(data: ReviewEmailData): Promise<{ sent: boolean; method: string }> {
  const html = generateReviewEmailHtml(data);
  
  const result = await sendViaResend({
    to: data.reviewerEmail,
    subject: `[고감도] ${data.projectTitle} 프로젝트 리뷰를 요청드립니다`,
    html,
  });

  if (result.sent) return result;

  // Fallback: 관리자에게 알림
  await notifyOwner({
    title: `리뷰 요청 이메일 발송 필요: ${data.reviewerName}`,
    content: `${data.reviewerName}님(${data.reviewerEmail})에게 "${data.projectTitle}" 프로젝트 리뷰 요청 이메일을 보내주세요.\n\n리뷰 링크: ${data.reviewUrl}\n만료일: ${new Date(data.expiresAt).toLocaleDateString("ko-KR")}`,
  });

  return { sent: false, method: "notification_fallback" };
}
