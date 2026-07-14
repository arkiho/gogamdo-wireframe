import SEOHead from "@/components/SEOHead";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="개인정보처리방침 | 고감도 KOKAMDO"
        description="(주)고감도의 개인정보처리방침입니다. 수집 항목, 목적, 보유기간 등을 안내합니다."
      />
      <div className="min-h-screen bg-surface pt-32 pb-20">
        <div className="container max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-ink mb-2">개인정보처리방침</h1>
          <p className="text-sm text-ink/50 mb-10">시행일: 2026년 7월 14일</p>

          <div className="space-y-10 text-ink/80 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">1. 개인정보의 수집 항목 및 수집 방법</h2>
              <p className="mb-2">(주)고감도(이하 "회사")는 다음과 같은 개인정보를 수집합니다.</p>
              <table className="w-full border-collapse text-sm mb-4">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">수집 경로</th>
                    <th className="text-left py-2 pr-4 font-medium">수집 항목</th>
                    <th className="text-left py-2 font-medium">수집 목적</th>
                  </tr>
                </thead>
                <tbody className="text-ink/70">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">문의 폼</td>
                    <td className="py-2 pr-4">이름, 회사명, 이메일, 전화번호, 공간유형, 면적, 문의내용</td>
                    <td className="py-2">상담 및 견적 안내</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">뉴스레터</td>
                    <td className="py-2 pr-4">이메일</td>
                    <td className="py-2">인사이트·뉴스레터 발송</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">고객 포털 회원가입</td>
                    <td className="py-2 pr-4">이메일, 비밀번호, 이름</td>
                    <td className="py-2">프로젝트 진행 현황 제공</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">AI 예상 견적</td>
                    <td className="py-2 pr-4">공간유형, 면적, 등급 (비식별)</td>
                    <td className="py-2">예상 비용 산출</td>
                  </tr>
                </tbody>
              </table>
              <p>수집 방법: 홈페이지 내 입력 폼, 이메일, 전화 상담</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">2. 개인정보의 수집 및 이용 목적</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>인테리어 상담 및 견적 요청 처리</li>
                <li>뉴스레터 및 인사이트 정보 발송</li>
                <li>고객 포털 계정 관리 및 프로젝트 진행 현황 공유</li>
                <li>서비스 개선을 위한 통계 분석 (비식별 처리)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">3. 개인정보의 보유 및 이용 기간</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>문의·상담 정보: 상담 완료 후 <strong>3년</strong> (전자상거래법)</li>
                <li>뉴스레터 구독 정보: <strong>구독 해지 시까지</strong></li>
                <li>고객 포털 계정: <strong>회원 탈퇴 시까지</strong></li>
                <li>관계 법령에 의한 보존이 필요한 경우 해당 기간까지 보관</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">4. 개인정보의 제3자 제공</h2>
              <p>회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령에 의하여 요구되는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">5. 개인정보 처리 위탁</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">수탁업체</th>
                    <th className="text-left py-2 font-medium">위탁 업무</th>
                  </tr>
                </thead>
                <tbody className="text-ink/70">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Amazon Web Services (AWS)</td>
                    <td className="py-2">클라우드 서버 운영 및 데이터 저장</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">6. 이용자의 권리 및 행사 방법</h2>
              <p className="mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 열람, 정정, 삭제, 처리 정지 요구</li>
                <li>뉴스레터 구독 해지 (이메일 내 수신 거부 링크)</li>
                <li>고객 포털 회원 탈퇴</li>
              </ul>
              <p className="mt-2">요청 방법: 이메일(<a href="mailto:contact@kokamdo.co.kr" className="text-gold hover:underline">contact@kokamdo.co.kr</a>) 또는 전화(02-3487-6133)</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">7. 쿠키 및 분석 도구</h2>
              <p className="mb-2">회사는 서비스 개선을 위해 다음의 분석 도구를 사용합니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Umami Analytics: 페이지 방문 통계 (개인 비식별)</li>
                <li>Kakao JavaScript SDK: 카카오톡 상담·공유 기능</li>
              </ul>
              <p className="mt-2">이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">8. 개인정보보호 책임자</h2>
              <ul className="space-y-1">
                <li>성명: 김기호</li>
                <li>직위: 공동대표이사</li>
                <li>이메일: <a href="mailto:contact@kokamdo.co.kr" className="text-gold hover:underline">contact@kokamdo.co.kr</a></li>
                <li>전화: 02-3487-6133</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">9. 개인정보처리방침의 변경</h2>
              <p>이 개인정보처리방침은 2026년 7월 14일부터 적용됩니다. 변경 시 시행 7일 전부터 홈페이지를 통해 공지합니다.</p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-xs text-ink/40">
              (주)고감도 | 공동대표 안향자·김기호 | 서울특별시 강남구 역삼동 | 02-3487-6133 |{" "}
              <a href="mailto:contact@kokamdo.co.kr" className="hover:text-ink/60">contact@kokamdo.co.kr</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
