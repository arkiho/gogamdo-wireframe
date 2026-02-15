import jsPDF from "jspdf";
import "jspdf-autotable";
import { applyIPProtection } from "./pdfWatermark";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// ===== Types =====
interface ReportProject {
  name: string;
  clientName?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  address?: string;
}

interface ReportExpense {
  title: string;
  category: string;
  amount: string | number;
  status: string;
  createdAt: string;
  authorName?: string;
}

interface ReportSchedule {
  taskName: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface ReportCost {
  category: string;
  itemName: string;
  budget: number;
  actual: number;
}

interface ReportMeeting {
  title: string;
  meetingDate: string;
  attendees?: string;
  decisions?: string;
}

export interface ProjectReportData {
  project: ReportProject;
  expenses: ReportExpense[];
  schedules: ReportSchedule[];
  costs: ReportCost[];
  meetings: ReportMeeting[];
  reportMonth: string; // "2026-02"
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  not_started: "Not Started",
  delayed: "Delayed",
};

const CATEGORY_LABELS: Record<string, string> = {
  material: "Material",
  labor: "Labor",
  subcontract: "Subcontract",
  equipment: "Equipment",
  transportation: "Transport",
  utility: "Utility",
  office: "Office",
  meal: "Meal",
  other: "Other",
  design: "Design",
  construction: "Construction",
  supervision: "Supervision",
  overhead: "Overhead",
};

function formatAmount(amount: number): string {
  return amount.toLocaleString();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("ko-KR");
  } catch {
    return dateStr;
  }
}

export function generateProjectReportPdf(data: ProjectReportData, trackingCode?: string) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addFooter = () => {
    const footerY = pageHeight - 8;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `KOKAMDO OpsX Monthly Report | Generated ${new Date().toLocaleDateString()} | Confidential`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
  };

  const checkNewPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  // ==================== COVER HEADER ====================
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Gold accent line
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 50, pageWidth, 2, "F");

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("KOKAMDO", margin, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Project Report", margin, 30);

  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(data.reportMonth, margin, 40);

  // Project name on right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.project.name, pageWidth - margin, 25, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Status: ${STATUS_LABELS[data.project.status] ?? data.project.status}`,
    pageWidth - margin,
    35,
    { align: "right" }
  );

  y = 62;

  // ==================== PROJECT OVERVIEW ====================
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. Project Overview", margin, y);
  y += 2;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 35, y);
  y += 6;

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
      ["Project", data.project.name, "Client", data.project.clientName ?? "-"],
      ["Start", formatDate(data.project.startDate), "End", formatDate(data.project.endDate)],
      ["Status", STATUS_LABELS[data.project.status] ?? data.project.status, "Address", data.project.address ?? "-"],
    ],
  });
  y = doc.lastAutoTable.finalY + 10;

  // ==================== SUMMARY STATS ====================
  checkNewPage(40);
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Summary Statistics", margin, y);
  y += 2;
  doc.setDrawColor(212, 175, 55);
  doc.line(margin, y, margin + 35, y);
  y += 6;

  // Calculate stats
  const totalBudget = data.costs.reduce((s, c) => s + c.budget, 0);
  const totalActual = data.costs.reduce((s, c) => s + c.actual, 0);
  const budgetRate = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
  const avgProgress = data.schedules.length > 0
    ? Math.round(data.schedules.reduce((s, sc) => s + sc.progress, 0) / data.schedules.length)
    : 0;
  const totalExpenseAmount = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const approvedExpenses = data.expenses.filter(e => e.status === "approved" || e.status === "paid").length;

  const statBoxWidth = (contentWidth - 15) / 4;
  const stats = [
    { label: "Total Budget", value: formatAmount(totalBudget) },
    { label: "Budget Used", value: `${budgetRate}%` },
    { label: "Avg Progress", value: `${avgProgress}%` },
    { label: "Expenses", value: formatAmount(totalExpenseAmount) },
  ];

  stats.forEach((stat, i) => {
    const x = margin + i * (statBoxWidth + 5);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, y, statBoxWidth, 22, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(stat.label, x + statBoxWidth / 2, y + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 26);
    doc.text(stat.value, x + statBoxWidth / 2, y + 17, { align: "center" });
  });
  y += 30;

  // ==================== COST MANAGEMENT ====================
  if (data.costs.length > 0) {
    checkNewPage(50);
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("3. Cost Management", margin, y);
    y += 2;
    doc.setDrawColor(212, 175, 55);
    doc.line(margin, y, margin + 35, y);
    y += 6;

    const costBody = data.costs.map(c => [
      CATEGORY_LABELS[c.category] ?? c.category,
      c.itemName,
      formatAmount(c.budget),
      formatAmount(c.actual),
      formatAmount(c.budget - c.actual),
      c.budget > 0 ? `${Math.round((c.actual / c.budget) * 100)}%` : "0%",
    ]);

    costBody.push([
      "",
      "TOTAL",
      formatAmount(totalBudget),
      formatAmount(totalActual),
      formatAmount(totalBudget - totalActual),
      `${budgetRate}%`,
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Category", "Item", "Budget", "Actual", "Remaining", "Rate"]],
      body: costBody,
      theme: "grid",
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: [212, 175, 55],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25, halign: "right" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (d: any) => {
        if (d.row.index === costBody.length - 1) {
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.fillColor = [245, 245, 245];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ==================== SCHEDULE PROGRESS ====================
  if (data.schedules.length > 0) {
    checkNewPage(50);
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("4. Schedule Progress", margin, y);
    y += 2;
    doc.setDrawColor(212, 175, 55);
    doc.line(margin, y, margin + 35, y);
    y += 6;

    const schedBody = data.schedules.map(s => [
      s.taskName,
      formatDate(s.startDate),
      formatDate(s.endDate),
      `${s.progress}%`,
      STATUS_LABELS[s.status ?? ""] ?? s.status ?? "-",
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Task", "Start", "End", "Progress", "Status"]],
      body: schedBody,
      theme: "grid",
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: [212, 175, 55],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 60 },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 25, halign: "center" },
      },
      didParseCell: (d: any) => {
        // Color code progress
        if (d.column.index === 3 && d.section === "body") {
          const val = parseInt(d.cell.raw);
          if (val >= 100) d.cell.styles.textColor = [34, 139, 34];
          else if (val >= 70) d.cell.styles.textColor = [0, 100, 200];
          else if (val >= 40) d.cell.styles.textColor = [200, 150, 0];
          else d.cell.styles.textColor = [200, 50, 50];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ==================== EXPENSE DETAILS ====================
  if (data.expenses.length > 0) {
    checkNewPage(50);
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("5. Expense Details", margin, y);
    y += 2;
    doc.setDrawColor(212, 175, 55);
    doc.line(margin, y, margin + 35, y);
    y += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Total: ${formatAmount(totalExpenseAmount)} | Approved: ${approvedExpenses}/${data.expenses.length}`,
      margin,
      y
    );
    y += 5;

    const expBody = data.expenses.map((e, i) => [
      String(i + 1),
      e.title,
      CATEGORY_LABELS[e.category] ?? e.category,
      formatAmount(Number(e.amount)),
      STATUS_LABELS[e.status] ?? e.status,
      formatDate(e.createdAt),
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Title", "Category", "Amount", "Status", "Date"]],
      body: expBody,
      theme: "grid",
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: [212, 175, 55],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 25 },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ==================== MEETING NOTES ====================
  if (data.meetings.length > 0) {
    checkNewPage(40);
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("6. Meeting Notes", margin, y);
    y += 2;
    doc.setDrawColor(212, 175, 55);
    doc.line(margin, y, margin + 35, y);
    y += 6;

    const meetBody = data.meetings.map((m, i) => [
      String(i + 1),
      m.title,
      formatDate(m.meetingDate),
      m.attendees ?? "-",
      m.decisions ?? "-",
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Title", "Date", "Attendees", "Key Decisions"]],
      body: meetBody,
      theme: "grid",
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: [212, 175, 55],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: contentWidth - 110 },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ==================== FOOTER ====================
  addFooter();

  // IP 보호 적용 (워터마크 + 법적 고지)
  if (trackingCode) {
    applyIPProtection(doc, trackingCode);
  }

  // Save
  const monthStr = data.reportMonth.replace("-", "");
  doc.save(`project_report_${monthStr}_${data.project.name.replace(/\s/g, "_")}.pdf`);
}
