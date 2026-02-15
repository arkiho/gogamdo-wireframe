import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const STATUS_LABELS: Record<string, string> = {
  planning: "기획", designing: "설계", permit: "인허가",
  construction: "시공중", inspection: "검수", completed: "완료",
  warranty: "하자보수", closed: "종료",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "#94a3b8", designing: "#60a5fa", permit: "#a78bfa",
  construction: "#fbbf24", inspection: "#22d3ee", completed: "#4ade80",
  warranty: "#fb923c", closed: "#9ca3af",
};

const CATEGORY_LABELS: Record<string, string> = {
  material: "자재비", labor: "인건비", subcontract: "하도급비",
  equipment: "장비비", transportation: "운반비", utility: "공과금",
  office: "사무용품", meal: "식대", other: "기타",
  overhead: "경비", design: "설계비", permit: "인허가비",
};

const CATEGORY_COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316",
];

/** 월별 지출 추이 라인 차트 */
export function MonthlyExpenseChart() {
  const { data, isLoading } = trpc.ops.charts.monthlyExpense.useQuery();

  if (isLoading) return <ChartSkeleton title="월별 지출 추이" />;
  if (!data?.length) return <EmptyChart title="월별 지출 추이" />;

  const chartData = {
    labels: data.map(d => {
      const [y, m] = d.month.split("-");
      return `${m}월`;
    }),
    datasets: [{
      label: "지출 금액",
      data: data.map(d => Number(d.total)),
      borderColor: "#c8a97e",
      backgroundColor: "rgba(200, 169, 126, 0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#c8a97e",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 4,
    }],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">월별 지출 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.2,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${Number(ctx.raw).toLocaleString()}원`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (v) => `${(Number(v) / 10000).toLocaleString()}만`,
                  font: { size: 11 },
                },
                grid: { color: "rgba(0,0,0,0.05)" },
              },
              x: {
                ticks: { font: { size: 11 } },
                grid: { display: false },
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

/** 프로젝트 상태 분포 도넛 차트 */
export function ProjectStatusChart() {
  const { data, isLoading } = trpc.ops.charts.projectStatus.useQuery();

  if (isLoading) return <ChartSkeleton title="프로젝트 상태 분포" />;
  if (!data?.length) return <EmptyChart title="프로젝트 상태 분포" />;

  const chartData = {
    labels: data.map(d => STATUS_LABELS[d.status] ?? d.status),
    datasets: [{
      data: data.map(d => Number(d.count)),
      backgroundColor: data.map(d => STATUS_COLORS[d.status] ?? "#9ca3af"),
      borderWidth: 2,
      borderColor: "#fff",
    }],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">프로젝트 상태 분포</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="w-full max-w-[280px]">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { padding: 12, usePointStyle: true, pointStyle: "circle", font: { size: 11 } },
                },
              },
              cutout: "60%",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** 프로젝트별 원가 집행률 바 차트 */
export function CostExecutionChart({ projectId }: { projectId: number }) {
  const { data, isLoading } = trpc.ops.charts.costExecution.useQuery({ projectId });

  if (isLoading) return <ChartSkeleton title="원가 집행률" />;
  if (!data?.length) return <EmptyChart title="원가 집행률" />;

  const chartData = {
    labels: data.map(d => CATEGORY_LABELS[d.category] ?? d.category),
    datasets: [
      {
        label: "예산",
        data: data.map(d => Number(d.budget)),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderRadius: 4,
      },
      {
        label: "실적",
        data: data.map(d => Number(d.actual)),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderRadius: 4,
      },
      {
        label: "지급",
        data: data.map(d => Number(d.paid)),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderRadius: 4,
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">원가 집행률 (카테고리별)</CardTitle>
      </CardHeader>
      <CardContent>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
              legend: {
                position: "top",
                labels: { padding: 12, usePointStyle: true, pointStyle: "circle", font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()}원`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (v) => `${(Number(v) / 10000).toLocaleString()}만`,
                  font: { size: 11 },
                },
                grid: { color: "rgba(0,0,0,0.05)" },
              },
              x: {
                ticks: { font: { size: 10 } },
                grid: { display: false },
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

/** 공정 진행률 차트 */
export function ScheduleProgressChart({ projectId }: { projectId: number }) {
  const { data, isLoading } = trpc.ops.charts.scheduleProgress.useQuery({ projectId });

  if (isLoading) return <ChartSkeleton title="공정 진행률" />;
  if (!data || data.total === 0) return <EmptyChart title="공정 진행률" />;

  const chartData = {
    labels: ["완료", "진행중", "지연", "미착수/보류"],
    datasets: [{
      data: [
        data.completed,
        data.inProgress,
        data.delayed,
        data.total - data.completed - data.inProgress - data.delayed,
      ],
      backgroundColor: ["#4ade80", "#fbbf24", "#ef4444", "#e2e8f0"],
      borderWidth: 2,
      borderColor: "#fff",
    }],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">공정 진행률</CardTitle>
          <span className="text-2xl font-bold text-foreground">{data.avgProgress}%</span>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="w-full max-w-[240px]">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { padding: 10, usePointStyle: true, pointStyle: "circle", font: { size: 11 } },
                },
              },
              cutout: "65%",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** 지출 카테고리 분포 차트 */
export function ExpenseCategoryChart({ projectId }: { projectId?: number }) {
  const { data, isLoading } = trpc.ops.charts.expenseCategory.useQuery({ projectId });

  if (isLoading) return <ChartSkeleton title="지출 카테고리 분포" />;
  if (!data?.length) return <EmptyChart title="지출 카테고리 분포" />;

  const chartData = {
    labels: data.map(d => CATEGORY_LABELS[d.category] ?? d.category),
    datasets: [{
      data: data.map(d => Number(d.total)),
      backgroundColor: CATEGORY_COLORS.slice(0, data.length),
      borderWidth: 2,
      borderColor: "#fff",
    }],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">지출 카테고리 분포</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="w-full max-w-[280px]">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { padding: 10, usePointStyle: true, pointStyle: "circle", font: { size: 11 } },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const val = Number(ctx.raw);
                      return `${ctx.label}: ${val.toLocaleString()}원`;
                    },
                  },
                },
              },
              cutout: "55%",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          데이터가 없습니다
        </div>
      </CardContent>
    </Card>
  );
}
