import SEOHead from "@/components/SEOHead";
import { Link } from "wouter";

export default function Terms() {
  return (
    <>
      <SEOHead
        title="이용약관 | 고감도 KOKAMDO"
        description="(주)고감도 홈페이지 이용약관입니다."
      />
      <div className="min-h-screen bg-surface pt-32 pb-20">
        <div className="container max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-ink mb-2">이용약관</h1>
          <p className="text-sm text-ink/50 mb-10">시행일: 2026년 7월 14일</p>

          <div className="space-y-10 text-ink/80 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제1조 (목적)</h2>
              <p>이 약관은 주식회사 고감도(이하 "회사")가 운영하는 홈페이지(kokamdo.co.kr, 이하 "사이트")에서 제공하는 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제2조 (정의)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>"서비스"란 사이트를 통해 제공하는 인테리어 상담, AI 예상 견적, 포트폴리오 열람, 뉴스레터, 고객 포털 등 일체의 서비스를 말합니다.</li>
                <li>"이용자"란 사이트에 접속하여 서비스를 이용하는 자를 말합니다.</li>
                <li>"회원"이란 고객 포털에 가입하여 계정을 보유한 이용자를 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제3조 (약관의 효력 및 변경)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>이 약관은 사이트에 공시함으로써 효력을 발생합니다.</li>
                <li>회사는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행 7일 전부터 사이트에 공지합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제4조 (서비스의 제공)</h2>
              <p className="mb-2">회사는 다음의 서비스를 제공합니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>인테리어 상담 신청 및 견적 문의</li>
                <li>AI 예상 견적 서비스 (참고용 정보 제공)</li>
                <li>포트폴리오 및 인사이트 콘텐츠</li>
                <li>뉴스레터 구독</li>
                <li>고객·협력사 포털</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제5조 (AI 예상 견적 면책)</h2>
              <p>AI 예상 견적은 이용자가 입력한 정보를 기반으로 산출된 <strong>참고용 추정치</strong>입니다. 실제 시공 비용은 현장 실측, 자재 선택, 공사 범위 등에 따라 달라질 수 있으며, 회사는 AI 견적의 정확성에 대해 법적 책임을 지지 않습니다. 정확한 견적은 현장 실측 후 별도 제공됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제6조 (회원 가입 및 관리)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 가입은 이메일 인증을 통해 완료됩니다.</li>
                <li>회원은 정확한 정보를 제공해야 하며, 허위 정보 기재 시 서비스 이용에 제한이 있을 수 있습니다.</li>
                <li>계정 정보의 관리 책임은 회원에게 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제7조 (이용자의 의무)</h2>
              <p className="mb-2">이용자는 다음 행위를 해서는 안 됩니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>타인의 정보를 도용하는 행위</li>
                <li>서비스의 정상적 운영을 방해하는 행위</li>
                <li>사이트 콘텐츠를 무단 복제·배포하는 행위</li>
                <li>기타 관계 법령에 위배되는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제8조 (서비스의 중단)</h2>
              <p>회사는 시스템 점검, 교체, 장애 또는 천재지변 등 불가항력적 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다. 이 경우 사전 공지하며, 불가피한 경우 사후 공지합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제9조 (책임 제한)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회사는 무료로 제공되는 서비스(AI 견적, 콘텐츠 열람 등)에 대해 관련 법령에서 정한 범위 내에서 책임을 부담합니다.</li>
                <li>이용자가 제공한 정보의 부정확성에 따른 결과에 대해 회사는 책임을 지지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">제10조 (분쟁 해결)</h2>
              <p>서비스 이용과 관련한 분쟁은 대한민국 법을 적용하며, 서울중앙지방법원을 관할 법원으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">부칙</h2>
              <p>이 약관은 2026년 7월 14일부터 시행합니다.</p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-xs text-ink/40">
              (주)고감도 | 공동대표 안향자·김기호 | 서울시 광진구 동일로 12길 15 | 02-3487-6133 |{" "}
              <a href="mailto:contact@kokamdo.co.kr" className="hover:text-ink/60">contact@kokamdo.co.kr</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
