import jsPDF from "jspdf";
import "jspdf-autotable";
import { applyIPProtection } from "./pdfWatermark";

// jspdf-autotable extends jsPDF prototype
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비",
  labor: "인건비",
  subcontract: "하도급비",
  equipment: "장비비",
  transportation: "운반비",
  utility: "공과금",
  office: "사무용품",
  meal: "식대",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "작성중",
  submitted: "상신됨",
  in_review: "결재중",
  approved: "승인됨",
  rejected: "반려됨",
  paid: "지급완료",
};

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "계좌이체",
  card: "카드",
  cash: "현금",
  check: "수표",
};

interface ExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks?: string;
}

interface ApprovalStep {
  stepOrder: number;
  approverName: string;
  action: string;
  comment?: string;
  actedAt?: string;
}

interface ExpenseData {
  expenseNumber: string;
  title: string;
  category: string;
  items: ExpenseItem[];
  totalAmount: string | number;
  paymentMethod?: string;
  payeeName?: string;
  payeeBank?: string;
  payeeAccount?: string;
  notes?: string;
  status: string;
  authorName: string;
  projectName: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvalSteps?: ApprovalStep[];
}

export function generateExpensePdf(expense: ExpenseData, trackingCode?: string) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== Use built-in Helvetica (no Korean font embedding for speed) =====
  // For Korean text, we use a simple approach: output as unicode
  // jsPDF default fonts don't support Korean well, so we'll use a workaround

  // Header - Company Logo Area
  doc.setFillColor(26, 26, 26); // #1a1a1a
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(212, 175, 55); // gold
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("KOKAMDO", margin, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Expense Approval Form", margin, 27);

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(`No. ${expense.expenseNumber}`, pageWidth - margin, 18, { align: "right" });
  doc.text(`Status: ${STATUS_LABELS[expense.status] ?? expense.status}`, pageWidth - margin, 27, { align: "right" });

  y = 45;

  // ===== Basic Info Section =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Report", margin, y);
  y += 2;

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 40, y);
  y += 8;

  // Info table
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30, textColor: [100, 100, 100] },
      1: { cellWidth: contentWidth / 2 - 30 },
      2: { fontStyle: "bold", cellWidth: 30, textColor: [100, 100, 100] },
      3: { cellWidth: contentWidth / 2 - 30 },
    },
    body: [
      ["Title", expense.title, "Category", CATEGORY_LABELS[expense.category] ?? expense.category],
      ["Author", expense.authorName, "Project", expense.projectName],
      ["Date", new Date(expense.createdAt).toLocaleDateString(), "Payment", PAYMENT_LABELS[expense.paymentMethod ?? ""] ?? expense.paymentMethod ?? "-"],
      ["Payee", expense.payeeName ?? "-", "Bank", expense.payeeBank ? `${expense.payeeBank} ${expense.payeeAccount ?? ""}` : "-"],
    ],
  });

  y = doc.lastAutoTable.finalY + 8;

  // ===== Items Table =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Expense Items", margin, y);
  y += 5;

  const items = expense.items ?? [];
  const tableBody = items.map((item, i) => [
    String(i + 1),
    item.description,
    String(item.quantity),
    Number(item.unitPrice).toLocaleString(),
    Number(item.amount).toLocaleString(),
    item.remarks ?? "",
  ]);

  // Add total row
  tableBody.push([
    "",
    "TOTAL",
    "",
    "",
    Number(expense.totalAmount).toLocaleString(),
    "",
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Description", "Qty", "Unit Price", "Amount", "Remarks"]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: [212, 175, 55],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: contentWidth - 135 },
    },
    didParseCell: (data: any) => {
      // Bold total row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [245, 245, 245];
      }
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ===== Notes =====
  if (expense.notes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(expense.notes, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 5;
  }

  // ===== Approval History =====
  if (expense.approvalSteps && expense.approvalSteps.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Approval History", margin, y);
    y += 5;

    const ACTION_LABELS: Record<string, string> = {
      approved: "Approved",
      rejected: "Rejected",
      pending: "Pending",
    };

    const approvalBody = expense.approvalSteps.map(s => [
      `Step ${s.stepOrder}`,
      s.approverName,
      ACTION_LABELS[s.action] ?? s.action,
      s.comment ?? "-",
      s.actedAt ? new Date(s.actedAt).toLocaleDateString() : "-",
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Step", "Approver", "Action", "Comment", "Date"]],
      body: approvalBody,
      theme: "grid",
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ===== Signature Area =====
  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  const sigWidth = (contentWidth - 10) / 3;
  const sigY = y + 5;

  ["Author", "Reviewer", "Approver"].forEach((label, i) => {
    const x = margin + i * (sigWidth + 5);
    doc.rect(x, sigY, sigWidth, 30);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(label, x + sigWidth / 2, sigY + 5, { align: "center" });
    doc.setDrawColor(200, 200, 200);
    doc.line(x + 10, sigY + 22, x + sigWidth - 10, sigY + 22);
  });

  // Fill author name
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(expense.authorName, margin + sigWidth / 2, sigY + 18, { align: "center" });

  // ===== Footer =====
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by KOKAMDO OpsX | ${new Date().toLocaleString()} | This document is for internal use only.`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // IP 보호 적용 (워터마크 + 법적 고지)
  if (trackingCode) {
    applyIPProtection(doc, trackingCode);
  }

  // Save
  doc.save(`expense_${expense.expenseNumber}.pdf`);
}
