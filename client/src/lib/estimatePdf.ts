import jsPDF from "jspdf";
import "jspdf-autotable";
import { applyIPProtection as _applyIPProtection } from "./pdfWatermark";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// ===== Brand Colors =====
const BRAND = {
  ink: [26, 26, 26] as [number, number, number],       // #1a1a1a
  gold: [212, 175, 55] as [number, number, number],     // #d4af37
  goldLight: [230, 200, 100] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  grayLight: [245, 245, 245] as [number, number, number],
  grayMid: [200, 200, 200] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  red: [220, 53, 69] as [number, number, number],
};

// ===== Types =====
export interface EstimateItem {
  category: string;
  subcategory: string;
  item: string;
  specification: string;
  unit: string;
  quantity: number;
  materialUnitPrice: number;
  materialAmount: number;
  laborUnitPrice: number;
  laborAmount: number;
  totalAmount: number;
  remarks?: string;
}

export interface EstimatePdfData {
  estimateNumber: string;
  title: string;
  version?: number;
  items: EstimateItem[];
  subtotal: string | number;
  overhead: string | number;
  profit: string | number;
  vat: string | number;
  grandTotal: string | number;
  notes?: string;
  validUntil?: string;
  status: string;
  createdAt: string;
  // Project info
  projectName: string;
  clientName?: string;
  siteAddress?: string;
  // Author info
  authorName?: string;
}

// ===== Helpers =====
function formatNumber(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return num.toLocaleString("ko-KR");
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  submitted: "제출",
  approved: "승인",
  rejected: "반려",
  sent: "발송완료",
};

// ===== PDF Generator =====
export function generateEstimatePdf(data: EstimatePdfData, trackingCode?: string) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ============ HEADER BAR ============
  doc.setFillColor(...BRAND.ink);
  doc.rect(0, 0, pageWidth, 30, "F");

  // Gold accent line
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 30, pageWidth, 1.5, "F");

  // Logo
  doc.setTextColor(...BRAND.gold);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("KOKAMDO", margin, 16);

  // Company info
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Interior Design & Construction", margin, 22);

  // Document type
  doc.setTextColor(...BRAND.gold);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ESTIMATE", pageWidth - margin, 16, { align: "right" });

  doc.setTextColor(...BRAND.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`No. ${data.estimateNumber}`, pageWidth - margin, 22, { align: "right" });

  y = 38;

  // ============ TITLE ============
  doc.setTextColor(...BRAND.black);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, margin, y);
  y += 4;

  // Gold underline
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // ============ PROJECT INFO TABLE ============
  const infoColWidth = contentWidth / 2;
  const infoData = [
    ["Project", data.projectName],
    ["Client", data.clientName || "-"],
    ["Site", data.siteAddress || "-"],
    ["Date", formatDate(data.createdAt)],
    ["Valid Until", data.validUntil ? formatDate(data.validUntil) : "-"],
    ["Version", `V${data.version || 1}`],
    ["Status", STATUS_LABELS[data.status] || data.status],
    ["Author", data.authorName || "-"],
  ];

  // Draw info in 2 columns
  doc.setFontSize(8.5);
  const leftCol = infoData.slice(0, 4);
  const rightCol = infoData.slice(4);

  leftCol.forEach((row, i) => {
    const rowY = y + i * 6;
    // Label
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.gray);
    doc.text(row[0], margin, rowY);
    // Value
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.black);
    doc.text(row[1], margin + 28, rowY);
  });

  rightCol.forEach((row, i) => {
    const rowY = y + i * 6;
    const xStart = margin + infoColWidth;
    // Label
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.gray);
    doc.text(row[0], xStart, rowY);
    // Value
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.black);
    doc.text(row[1], xStart + 28, rowY);
  });

  y += 4 * 6 + 4;

  // Separator
  doc.setDrawColor(...BRAND.grayMid);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // ============ ITEMS TABLE ============
  if (data.items && data.items.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.black);
    doc.text("Item Details", margin, y);
    y += 5;

    // Group items by category
    const categories = new Map<string, EstimateItem[]>();
    data.items.forEach((item) => {
      const cat = item.category || "General";
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(item);
    });

    let itemIndex = 1;

    categories.forEach((items, category) => {
      // Category header row
      const tableData: any[][] = [];

      // Category header
      tableData.push([
        { content: category, colSpan: 8, styles: { fillColor: BRAND.ink, textColor: BRAND.gold, fontStyle: "bold", fontSize: 8 } },
      ]);

      // Item rows
      items.forEach((item) => {
        tableData.push([
          String(itemIndex++),
          item.item || "-",
          item.specification || "-",
          item.unit || "-",
          formatNumber(item.quantity),
          formatNumber(item.materialUnitPrice),
          formatNumber(item.laborUnitPrice),
          formatNumber(item.totalAmount),
        ]);
      });

      // Category subtotal
      const catTotal = items.reduce((sum, it) => sum + (it.totalAmount || 0), 0);
      tableData.push([
        { content: `${category} Subtotal`, colSpan: 7, styles: { fontStyle: "bold", halign: "right", fillColor: BRAND.grayLight } },
        { content: formatNumber(catTotal), styles: { fontStyle: "bold", halign: "right", fillColor: BRAND.grayLight } },
      ]);

      doc.autoTable({
        startY: y,
        head: [["#", "Item", "Spec", "Unit", "Qty", "Material", "Labor", "Total"]],
        body: tableData,
        margin: { left: margin, right: margin },
        theme: "grid",
        headStyles: {
          fillColor: BRAND.ink,
          textColor: BRAND.white,
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "center",
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: BRAND.black,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 25 },
          3: { halign: "center", cellWidth: 14 },
          4: { halign: "right", cellWidth: 14 },
          5: { halign: "right", cellWidth: 22 },
          6: { halign: "right", cellWidth: 22 },
          7: { halign: "right", cellWidth: 24 },
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252],
        },
        didDrawPage: () => {
          // Footer on each page
          drawFooter(doc, pageWidth, pageHeight, margin);
        },
      });

      y = doc.lastAutoTable.finalY + 4;
    });
  }

  // ============ SUMMARY TABLE ============
  y += 2;

  // Check if we need a new page
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.black);
  doc.text("Cost Summary", margin, y);
  y += 5;

  const summaryData = [
    ["Direct Cost (Subtotal)", formatNumber(data.subtotal)],
    ["Overhead", formatNumber(data.overhead)],
    ["Profit", formatNumber(data.profit)],
    ["VAT (10%)", formatNumber(data.vat)],
  ];

  doc.autoTable({
    startY: y,
    body: summaryData,
    margin: { left: margin + contentWidth * 0.45, right: margin },
    theme: "plain",
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: BRAND.black,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { halign: "right" },
    },
    didDrawCell: (hookData: any) => {
      // Bottom border for each row
      if (hookData.section === "body") {
        doc.setDrawColor(...BRAND.grayMid);
        doc.setLineWidth(0.2);
        doc.line(
          hookData.cell.x,
          hookData.cell.y + hookData.cell.height,
          hookData.cell.x + hookData.cell.width,
          hookData.cell.y + hookData.cell.height
        );
      }
    },
  });

  y = doc.lastAutoTable.finalY + 2;

  // Grand Total - highlighted
  doc.setFillColor(...BRAND.ink);
  const totalBoxX = margin + contentWidth * 0.45;
  const totalBoxW = contentWidth * 0.55;
  doc.rect(totalBoxX, y, totalBoxW, 12, "F");

  doc.setTextColor(...BRAND.gold);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", totalBoxX + 4, y + 8);

  doc.setTextColor(...BRAND.white);
  doc.setFontSize(12);
  doc.text(`${formatNumber(data.grandTotal)} KRW`, totalBoxX + totalBoxW - 4, y + 8, { align: "right" });

  y += 18;

  // ============ NOTES ============
  if (data.notes) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.black);
    doc.text("Notes", margin, y);
    y += 5;

    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 20, y);
    y += 4;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.gray);

    const noteLines = doc.splitTextToSize(data.notes, contentWidth - 10);
    doc.text(noteLines, margin + 2, y);
    y += noteLines.length * 4 + 6;
  }

  // ============ TERMS & CONDITIONS ============
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.black);
  doc.text("Terms & Conditions", margin, y);
  y += 5;

  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 20, y);
  y += 5;

  const terms = [
    "1. This estimate is valid for 30 days from the date of issue unless otherwise specified.",
    "2. Prices are subject to change based on material market fluctuations.",
    "3. Payment terms: 30% deposit upon contract signing, 40% at midpoint, 30% upon completion.",
    "4. Additional work beyond the scope of this estimate will be quoted separately.",
    "5. All prices include standard installation but exclude permits and inspections.",
  ];

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);

  terms.forEach((term) => {
    const termLines = doc.splitTextToSize(term, contentWidth - 5);
    doc.text(termLines, margin + 2, y);
    y += termLines.length * 3.5 + 1.5;
  });

  // ============ SIGNATURE AREA ============
  y += 6;
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  }

  // Separator
  doc.setDrawColor(...BRAND.grayMid);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // Two signature blocks
  const sigWidth = contentWidth / 2 - 10;

  // Issuer
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.black);
  doc.text("Issued by", margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.setFontSize(7.5);
  doc.text("KOKAMDO Interior", margin, y);
  doc.text(data.authorName || "-", margin, y + 4);
  doc.text("Tel: 02-000-0000", margin, y + 8);

  // Signature line
  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 16, margin + sigWidth, y + 16);
  doc.setFontSize(7);
  doc.text("Signature / Stamp", margin, y + 20);

  // Client
  const clientX = margin + contentWidth / 2 + 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.black);
  doc.text("Accepted by", clientX, y - 4);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.setFontSize(7.5);
  doc.text(data.clientName || "Client", clientX, y);
  doc.text("Date: ____________________", clientX, y + 4);

  // Signature line
  doc.line(clientX, y + 16, clientX + sigWidth, y + 16);
  doc.setFontSize(7);
  doc.text("Signature / Stamp", clientX, y + 20);

  // Footer on last page
  drawFooter(doc, pageWidth, pageHeight, margin);

  // Apply IP protection if tracking code provided
  if (trackingCode) {
    _applyIPProtection(doc, trackingCode);
  }

  // Save
  const filename = `Estimate_${data.estimateNumber}_${data.projectName.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

// ===== Footer =====
function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number) {
  const footerY = pageHeight - 10;

  // Gold line
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  // Footer text
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray);
  doc.text("KOKAMDO Interior | www.kokamdo.com | Tel: 02-000-0000", margin, footerY);

  // Page number
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  const totalPages = (doc as any).internal.getNumberOfPages();
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
}
