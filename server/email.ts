/**
 * 이메일 발송 유틸리티
 * Manus 내장 notification API를 활용하여 관리자에게 이메일 내용을 전달하고,
 * 리뷰 링크를 포함한 이메일 템플릿을 생성합니다.
 * 
 * 실제 이메일 발송은 외부 이메일 서비스(Resend, SendGrid 등) 연동 시 활성화됩니다.
 * 현재는 이메일 내용을 생성하고 관리자에게 알림으로 전달하는 방식입니다.
 */

import { notifyOwner } from "./_core/notification";

interface ReviewEmailData {
  reviewerName: string;
  reviewerEmail: string;
  reviewerCompany?: string;
  projectTitle: string;
  reviewUrl: string;
  expiresAt: Date;
}

/**
 * 리뷰 요청 이메일 HTML 템플릿 생성
 */
export function generateReviewEmailHtml(data: ReviewEmailData): string {
  const expiresDate = new Date(data.expiresAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>고감도 프로젝트 리뷰 요청</title>
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

/**
 * 리뷰 요청 이메일 발송
 * 현재는 관리자에게 알림으로 이메일 내용을 전달합니다.
 * 외부 이메일 서비스 연동 시 실제 발송으로 전환됩니다.
 */
export async function sendReviewRequestEmail(data: ReviewEmailData): Promise<{ sent: boolean; method: string }> {
  const emailHtml = generateReviewEmailHtml(data);
  
  // 외부 이메일 서비스 (Resend/SendGrid) 환경변수가 설정되어 있으면 실제 발송
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "고감도 <noreply@kokamdo.co.kr>",
          to: [data.reviewerEmail],
          subject: `[고감도] ${data.projectTitle} 프로젝트 리뷰를 요청드립니다`,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        return { sent: true, method: "resend" };
      }
      
      console.warn("[Email] Resend API failed:", await response.text());
    } catch (error) {
      console.warn("[Email] Resend API error:", error);
    }
  }

  // Fallback: 관리자에게 알림으로 이메일 내용 전달 (수동 발송 안내)
  await notifyOwner({
    title: `리뷰 요청 이메일 발송 필요: ${data.reviewerName}`,
    content: `${data.reviewerName}님(${data.reviewerEmail})에게 "${data.projectTitle}" 프로젝트 리뷰 요청 이메일을 보내주세요.\n\n리뷰 링크: ${data.reviewUrl}\n만료일: ${new Date(data.expiresAt).toLocaleDateString("ko-KR")}`,
  });

  return { sent: false, method: "notification_fallback" };
}
