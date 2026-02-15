/**
 * PDF 워터마크 유틸리티
 * - 트래킹 코드 워터마크 삽입 (대각선 반투명 텍스트)
 * - 법적 고지 페이지 추가
 * - 고유 식별 코드 하단 삽입
 */
import jsPDF from "jspdf";

// ===== Brand Colors =====
const BRAND = {
  ink: [26, 26, 26] as [number, number, number],
  gold: [212, 175, 55] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  grayLight: [200, 200, 200] as [number, number, number],
  red: [220, 53, 69] as [number, number, number],
};

/**
 * 모든 페이지에 대각선 트래킹 워터마크 삽입
 */
export function addTrackingWatermark(doc: jsPDF, trackingCode: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // 대각선 반투명 워터마크 (매우 연한 회색)
    doc.saveGraphicsState();
    const gState = (doc as any).GState({ opacity: 0.06 });
    doc.setGState(gState);
    doc.setFontSize(48);
    doc.setTextColor(150, 150, 150);

    // 대각선 텍스트 패턴
    const text = `CONFIDENTIAL  ${trackingCode}`;
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // 중앙 대각선
    doc.text(text, centerX, centerY, {
      align: "center",
      angle: 45,
    });

    // 상단 대각선
    doc.text(text, centerX - 40, centerY - 80, {
      align: "center",
      angle: 45,
    });

    // 하단 대각선
    doc.text(text, centerX + 40, centerY + 80, {
      align: "center",
      angle: 45,
    });

    doc.restoreGraphicsState();

    // 하단에 트래킹 코드 (작은 글씨)
    doc.setFontSize(5);
    doc.setTextColor(...BRAND.grayLight);
    doc.text(
      `Tracking: ${trackingCode} | Generated: ${new Date().toISOString().slice(0, 19)}`,
      pageWidth / 2,
      pageHeight - 3,
      { align: "center" }
    );
  }
}

/**
 * 법적 고지 커버 페이지 추가 (첫 페이지 앞에)
 */
export function addLegalNoticePage(doc: jsPDF, trackingCode: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // 첫 페이지 앞에 삽입
  doc.insertPage(1);
  doc.setPage(1);

  // 상단 골드 바
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, pageWidth, 3, "F");

  // 회사 로고 영역
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.ink);
  doc.text("GOGAMDO", margin, 30);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.text("INTERIOR DESIGN & CONSTRUCTION", margin, 37);

  // 구분선
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, 42, pageWidth - margin, 42);

  // 제목
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.ink);
  doc.text("CONFIDENTIAL", margin, 58);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.text("Intellectual Property Protection Notice", margin, 66);

  // 법적 고지 내용
  const notices = [
    {
      title: "1. Copyright & Ownership",
      content: "All designs, estimates, proposals, 3D renderings, drawings and other materials contained in this document are the intellectual property of GOGAMDO Co., Ltd. and are protected under the Copyright Act and related laws.",
    },
    {
      title: "2. Usage Restrictions",
      content: "This material is provided solely for project review purposes between you and GOGAMDO. The following actions are strictly prohibited:\n- Sharing, distributing, or forwarding any part of this material to third parties\n- Providing this material to other interior companies for comparison quotes or construction requests\n- Copying, modifying, or transforming this material for use\n- Publishing this material online or offline",
    },
    {
      title: "3. Tracking & Monitoring",
      content: "This document contains a unique identification code (tracking watermark). In case of unauthorized disclosure, the leak path can be traced. All download histories are recorded.",
    },
    {
      title: "4. Legal Liability",
      content: "Violation of the above restrictions may result in imprisonment of up to 5 years or a fine of up to 50 million won under Article 136 of the Copyright Act, and may be subject to civil claims for damages.",
    },
  ];

  let y = 80;
  for (const notice of notices) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.ink);
    doc.text(notice.title, margin, y);
    y += 6;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.gray);
    const lines = doc.splitTextToSize(notice.content, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 3.5 + 6;
  }

  // 경고 박스
  const boxY = y + 5;
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, 22, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.red);
  doc.text("WARNING", margin + 5, boxY + 7);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.ink);
  doc.text(
    "Unauthorized sharing of this document is a violation of copyright law and may result in legal action.",
    margin + 5,
    boxY + 13
  );
  doc.text(
    "This document is tracked with a unique code and all access is logged.",
    margin + 5,
    boxY + 18
  );

  // 트래킹 코드 표시
  const codeY = boxY + 35;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.ink);
  doc.text("Document Tracking Code:", margin, codeY);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.gold);
  doc.text(trackingCode, margin, codeY + 8);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.text(`Generated: ${new Date().toLocaleString("ko-KR")}`, margin, codeY + 15);

  // 하단 골드 바
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

  // 하단 저작권
  doc.setFontSize(6);
  doc.setTextColor(...BRAND.gray);
  doc.text(
    `© ${new Date().getFullYear()} GOGAMDO Co., Ltd. All rights reserved.`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );
}

/**
 * 견적서/제안서 PDF에 지적재산권 보호 적용
 * 1. 법적 고지 커버 페이지 추가
 * 2. 모든 페이지에 트래킹 워터마크 삽입
 */
export function applyIPProtection(doc: jsPDF, trackingCode: string) {
  addLegalNoticePage(doc, trackingCode);
  addTrackingWatermark(doc, trackingCode);
}
