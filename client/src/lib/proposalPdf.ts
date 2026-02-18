import jsPDF from "jspdf";
import "jspdf-autotable";
import { applyIPProtection } from "./pdfWatermark";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// ===== Brand Colors =====
const BRAND = {
  ink: [26, 26, 26] as [number, number, number],
  gold: [212, 175, 55] as [number, number, number],
  goldLight: [230, 200, 100] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  grayLight: [245, 245, 245] as [number, number, number],
  grayMid: [200, 200, 200] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

// ===== Types =====
export interface ProposalPdfData {
  title: string;
  version?: number;
  createdAt: string;
  projectName: string;
  clientName?: string;
  authorName?: string;
  clientAnalysis?: {
    industry?: string;
    companyProfile?: string;
    needs?: string[];
    painPoints?: string[];
    opportunities?: string[];
  };
  designConcept?: string;
  spaceProgram?: Array<{
    zone: string;
    area: string;
    description: string;
  }>;
  materialPlan?: Array<{
    area: string;
    material: string;
    reason: string;
  }>;
  furniturePlan?: Array<{
    item: string;
    quantity: string;
    specification: string;
  }>;
  projectTimeline?: Array<{
    phase: string;
    duration: string;
    description: string;
  }>;
  companyIntro?: string;
  differentiators?: string[];
}

// ===== Helpers =====
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number) {
  const footerY = pageHeight - 10;
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.text("KOKAMDO Interior | www.kokamdo.com | Tel: 02-000-0000", margin, footerY);
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  const totalPages = (doc as any).internal.getNumberOfPages();
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
}

function checkNewPage(doc: jsPDF, y: number, pageHeight: number, margin: number, needed: number = 50): number {
  if (y > pageHeight - needed) {
    doc.addPage();
    return margin + 5;
  }
  return y;
}

// ===== Section Header =====
function drawSectionHeader(doc: jsPDF, title: string, sectionNum: string, y: number, margin: number, contentWidth: number): number {
  // Section number badge
  doc.setFillColor(...BRAND.gold);
  doc.rect(margin, y - 4, 8, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  doc.text(sectionNum, margin + 4, y + 1, { align: "center" });

  // Section title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.ink);
  doc.text(title, margin + 12, y + 1);

  // Underline
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 5, margin + contentWidth, y + 5);

  return y + 12;
}

// ===== PDF Generator =====
export function generateProposalPdf(data: ProposalPdfData, trackingCode?: string) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ============ COVER PAGE ============
  // Full dark background
  doc.setFillColor(...BRAND.ink);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Gold accent bar at top
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Company logo area
  doc.setTextColor(...BRAND.gold);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("KOKAMDO", margin + 5, 30);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.grayMid);
  doc.text("Interior Design & Construction", margin + 5, 37);

  // Decorative gold line
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.8);
  doc.line(margin + 5, 42, margin + 60, 42);

  // Main title
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");

  const titleLines = doc.splitTextToSize(data.title, contentWidth - 10);
  doc.text(titleLines, margin + 5, 80);

  // Subtitle
  const subtitleY = 80 + titleLines.length * 12 + 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gold);
  doc.text("INTERIOR DESIGN PROPOSAL", margin + 5, subtitleY);

  // Project info block
  const infoY = subtitleY + 25;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.grayMid);

  const infoItems = [
    ["Project", data.projectName],
    ["Client", data.clientName || "-"],
    ["Date", formatDate(data.createdAt)],
    ["Version", `V${data.version || 1}`],
    ["Author", data.authorName || "KOKAMDO Design Team"],
  ];

  infoItems.forEach((item, i) => {
    const itemY = infoY + i * 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.gold);
    doc.text(item[0], margin + 5, itemY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.grayMid);
    doc.text(item[1], margin + 35, itemY);
  });

  // Bottom gold bar
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // Copyright
  doc.setFontSize(6);
  doc.setTextColor(...BRAND.grayMid);
  doc.text(
    `© ${new Date().getFullYear()} KOKAMDO Co., Ltd. All rights reserved.`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // ============ CONTENT PAGES ============
  doc.addPage();
  let y = 20;
  let sectionNum = 1;

  // --- Section 1: Client Analysis ---
  if (data.clientAnalysis) {
    y = drawSectionHeader(doc, "Client Analysis", String(sectionNum++), y, margin, contentWidth);

    if (data.clientAnalysis.companyProfile) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text("Company Profile", margin + 2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      const profileLines = doc.splitTextToSize(data.clientAnalysis.companyProfile, contentWidth - 4);
      doc.text(profileLines, margin + 2, y);
      y += profileLines.length * 4 + 6;
    }

    if (data.clientAnalysis.industry) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text("Industry", margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      doc.text(data.clientAnalysis.industry, margin + 30, y);
      y += 8;
    }

    // Needs
    if (data.clientAnalysis.needs && data.clientAnalysis.needs.length > 0) {
      y = checkNewPage(doc, y, pageHeight, margin, 30);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text("Key Needs", margin + 2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      doc.setFontSize(8);
      data.clientAnalysis.needs.forEach((need) => {
        doc.setFillColor(...BRAND.gold);
        doc.circle(margin + 4, y - 1, 1, "F");
        const needLines = doc.splitTextToSize(need, contentWidth - 12);
        doc.text(needLines, margin + 8, y);
        y += needLines.length * 3.5 + 3;
      });
      y += 4;
    }

    // Pain Points
    if (data.clientAnalysis.painPoints && data.clientAnalysis.painPoints.length > 0) {
      y = checkNewPage(doc, y, pageHeight, margin, 30);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text("Pain Points", margin + 2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      doc.setFontSize(8);
      data.clientAnalysis.painPoints.forEach((point) => {
        doc.setFillColor(220, 53, 69);
        doc.circle(margin + 4, y - 1, 1, "F");
        const pointLines = doc.splitTextToSize(point, contentWidth - 12);
        doc.text(pointLines, margin + 8, y);
        y += pointLines.length * 3.5 + 3;
      });
      y += 4;
    }

    // Opportunities
    if (data.clientAnalysis.opportunities && data.clientAnalysis.opportunities.length > 0) {
      y = checkNewPage(doc, y, pageHeight, margin, 30);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text("Opportunities", margin + 2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      doc.setFontSize(8);
      data.clientAnalysis.opportunities.forEach((opp) => {
        doc.setFillColor(40, 167, 69);
        doc.circle(margin + 4, y - 1, 1, "F");
        const oppLines = doc.splitTextToSize(opp, contentWidth - 12);
        doc.text(oppLines, margin + 8, y);
        y += oppLines.length * 3.5 + 3;
      });
      y += 4;
    }

    drawFooter(doc, pageWidth, pageHeight, margin);
  }

  // --- Section 2: Design Concept ---
  if (data.designConcept) {
    doc.addPage();
    y = 20;
    y = drawSectionHeader(doc, "Design Concept", String(sectionNum++), y, margin, contentWidth);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.gray);
    const conceptLines = doc.splitTextToSize(data.designConcept, contentWidth - 4);
    doc.text(conceptLines, margin + 2, y);
    y += conceptLines.length * 4 + 8;

    drawFooter(doc, pageWidth, pageHeight, margin);
  }

  // --- Section 3: Space Program ---
  if (data.spaceProgram && data.spaceProgram.length > 0) {
    doc.addPage();
    y = 20;
    y = drawSectionHeader(doc, "Space Program", String(sectionNum++), y, margin, contentWidth);

    doc.autoTable({
      startY: y,
      head: [["Zone", "Area", "Description"]],
      body: data.spaceProgram.map((s) => [s.zone, s.area, s.description]),
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: BRAND.ink,
        textColor: BRAND.white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: BRAND.black,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "bold" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: "auto" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didDrawPage: () => drawFooter(doc, pageWidth, pageHeight, margin),
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // --- Section 4: Material Plan ---
  if (data.materialPlan && data.materialPlan.length > 0) {
    doc.addPage();
    y = 20;
    y = drawSectionHeader(doc, "Material Plan", String(sectionNum++), y, margin, contentWidth);

    doc.autoTable({
      startY: y,
      head: [["Area", "Material", "Reason"]],
      body: data.materialPlan.map((m) => [m.area, m.material, m.reason]),
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: BRAND.ink,
        textColor: BRAND.white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: BRAND.black,
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: "bold" },
        1: { cellWidth: 45 },
        2: { cellWidth: "auto" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didDrawPage: () => drawFooter(doc, pageWidth, pageHeight, margin),
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // --- Section 5: Furniture Plan ---
  if (data.furniturePlan && data.furniturePlan.length > 0) {
    y = checkNewPage(doc, y, pageHeight, margin, 60);
    if (y <= margin + 10) {
      y = 20;
    }
    y = drawSectionHeader(doc, "Furniture Plan", String(sectionNum++), y, margin, contentWidth);

    doc.autoTable({
      startY: y,
      head: [["Item", "Quantity", "Specification"]],
      body: data.furniturePlan.map((f) => [f.item, f.quantity, f.specification]),
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: BRAND.ink,
        textColor: BRAND.white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: BRAND.black,
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: "bold" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: "auto" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didDrawPage: () => drawFooter(doc, pageWidth, pageHeight, margin),
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // --- Section 6: Project Timeline ---
  if (data.projectTimeline && data.projectTimeline.length > 0) {
    doc.addPage();
    y = 20;
    y = drawSectionHeader(doc, "Project Timeline", String(sectionNum++), y, margin, contentWidth);

    doc.autoTable({
      startY: y,
      head: [["Phase", "Duration", "Description"]],
      body: data.projectTimeline.map((t) => [t.phase, t.duration, t.description]),
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: BRAND.ink,
        textColor: BRAND.white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: BRAND.black,
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: "bold" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: "auto" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didDrawPage: () => drawFooter(doc, pageWidth, pageHeight, margin),
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // --- Section 7: Why KOKAMDO ---
  if (data.companyIntro || (data.differentiators && data.differentiators.length > 0)) {
    doc.addPage();
    y = 20;
    y = drawSectionHeader(doc, "Why KOKAMDO", String(sectionNum++), y, margin, contentWidth);

    if (data.companyIntro) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      const introLines = doc.splitTextToSize(data.companyIntro, contentWidth - 4);
      doc.text(introLines, margin + 2, y);
      y += introLines.length * 4 + 8;
    }

    if (data.differentiators && data.differentiators.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text("Our Differentiators", margin + 2, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.gray);
      doc.setFontSize(8.5);
      data.differentiators.forEach((diff, i) => {
        y = checkNewPage(doc, y, pageHeight, margin, 15);
        // Number badge
        doc.setFillColor(...BRAND.gold);
        doc.roundedRect(margin + 2, y - 4, 7, 7, 1, 1, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.white);
        doc.text(String(i + 1), margin + 5.5, y + 0.5, { align: "center" });

        // Text
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND.gray);
        doc.setFontSize(8.5);
        const diffLines = doc.splitTextToSize(diff, contentWidth - 16);
        doc.text(diffLines, margin + 12, y);
        y += diffLines.length * 4 + 5;
      });
    }

    drawFooter(doc, pageWidth, pageHeight, margin);
  }

  // ============ CLOSING PAGE ============
  doc.addPage();
  doc.setFillColor(...BRAND.ink);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, pageWidth, 4, "F");

  doc.setTextColor(...BRAND.gold);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Thank You", pageWidth / 2, pageHeight / 2 - 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.grayMid);
  doc.text("We look forward to creating an inspiring space together.", pageWidth / 2, pageHeight / 2, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...BRAND.gold);
  doc.text("KOKAMDO Interior", pageWidth / 2, pageHeight / 2 + 20, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.grayMid);
  doc.text("www.kokamdo.com | Tel: 02-000-0000", pageWidth / 2, pageHeight / 2 + 28, { align: "center" });

  doc.setFillColor(...BRAND.gold);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // Apply IP protection
  if (trackingCode) {
    applyIPProtection(doc, trackingCode);
  }

  // Save
  const filename = `Proposal_${data.projectName.replace(/\s+/g, "_")}_V${data.version || 1}.pdf`;
  doc.save(filename);
}
