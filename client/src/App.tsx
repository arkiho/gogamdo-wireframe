import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AnalyticsProvider from "./components/AnalyticsProvider";
import Layout from "./components/Layout";

// Home is eagerly loaded (first screen)
import Home from "./pages/Home";

// Lazy-loaded public pages
const About = lazy(() => import("./pages/About"));
const Solutions = lazy(() => import("./pages/Solutions"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PortfolioDbDetail = lazy(() => import("./pages/PortfolioDbDetail"));
const Estimator = lazy(() => import("./pages/Estimator"));
const Insights = lazy(() => import("./pages/Insights"));
const InsightDetail = lazy(() => import("./pages/InsightDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ReviewWrite = lazy(() => import("./pages/ReviewWrite"));
const Resources = lazy(() => import("./pages/Resources"));
const AIChat = lazy(() => import("./pages/AIChat"));
const AIStyle = lazy(() => import("./pages/AIStyle"));
const AIRedesign = lazy(() => import("./pages/AIRedesign"));
const FAQ = lazy(() => import("./pages/FAQ"));
const HowWeWork = lazy(() => import("./pages/HowWeWork"));
const RegionInterior = lazy(() => import("./pages/RegionInterior"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const PwaInstallBanner = lazy(() => import("./components/PwaInstallBanner"));

// Lazy-loaded portal pages
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const ClientProjectDetail = lazy(() => import("./pages/ClientProjectDetail"));
const ClientRegister = lazy(() => import("./pages/ClientRegister"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const ClientVerifyEmail = lazy(() => import("./pages/ClientVerifyEmail"));
const ClientForgotPassword = lazy(() => import("./pages/ClientForgotPassword"));
const ClientResetPassword = lazy(() => import("./pages/ClientResetPassword"));
const ClientSpaceDashboard = lazy(() => import("./pages/ClientSpaceDashboard"));

// Lazy-loaded survey pages
const CompanySurvey = lazy(() => import("./pages/CompanySurvey"));
const SurveyResponse = lazy(() => import("./pages/SurveyResponse"));
const WorkspaceSurvey = lazy(() => import("./pages/WorkspaceSurvey"));
const WorkspaceInterview = lazy(() => import("./pages/WorkspaceInterview"));
const WorkspaceReport = lazy(() => import("./pages/WorkspaceReport"));

// Lazy-loaded ops pages
const OpsHome = lazy(() => import("./pages/ops/OpsHome"));
const OpsProjectDetail = lazy(() => import("./pages/ops/OpsProjectDetail"));
const SubPortal = lazy(() => import("./pages/ops/SubPortal"));
const OpsStaffManagement = lazy(() => import("./pages/ops/OpsStaffManagement"));
const OpsCalendar = lazy(() => import("./pages/ops/OpsCalendar"));
const OpsPartners = lazy(() => import("./pages/ops/OpsPartners"));
const OpsStaffDashboard = lazy(() => import("./pages/ops/OpsStaffDashboard"));
const OpsCameras = lazy(() => import("./pages/ops/OpsCameras"));
const OpsFieldMeasure = lazy(() => import("./pages/ops/OpsFieldMeasure"));
const OpsProjects = lazy(() => import("./pages/ops/OpsProjects"));
const OpsSchedule = lazy(() => import("./pages/ops/OpsSchedule"));
const OpsApproval = lazy(() => import("./pages/ops/OpsApproval"));
const OpsApprovalLines = lazy(() => import("./pages/ops/OpsApprovalLines"));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPortfolioDetail = lazy(() => import("./pages/AdminPortfolioDetail"));
const AdminDDIA = lazy(() => import("./pages/AdminDDIA"));
const AdminCRM = lazy(() => import("./pages/AdminCRM"));
const AdminDesignAuto = lazy(() => import("./pages/AdminDesignAuto"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const AdminClientPipeline = lazy(() => import("./pages/AdminClientPipeline"));
const AdminDownloadLogs = lazy(() => import("./pages/AdminDownloadLogs"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminPortfolios = lazy(() => import("./pages/AdminPortfolios"));
const AdminSurveyAutomation = lazy(() => import("./pages/AdminSurveyAutomation"));
const AdminVendorPortal = lazy(() => import("./pages/AdminVendorPortal"));
const AdminPostOccupancy = lazy(() => import("./pages/AdminPostOccupancy"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const AdminKpiOkr = lazy(() => import("./pages/AdminKpiOkr"));
const AdminPipelineOverview = lazy(() => import("./pages/AdminPipelineOverview"));
const AdminJourneyAnalytics = lazy(() => import("./pages/AdminJourneyAnalytics"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const AdminMarketing = lazy(() => import("./pages/AdminMarketing"));
const AdminContentCalendar = lazy(() => import("./pages/AdminContentCalendar"));

// Auth pages
const AuthLogin = lazy(() => import("./pages/AuthLogin"));

// Lazy-loaded misc pages
const SensorApiDocs = lazy(() => import("./pages/SensorApiDocs"));
const PartnerPortal = lazy(() => import("./pages/PartnerPortal"));
const StaffJoin = lazy(() => import("./pages/StaffJoin"));
const StaffPendingApproval = lazy(() => import("./pages/StaffPendingApproval"));
const PartnerLogin = lazy(() => import("./pages/PartnerLogin"));
const Offline = lazy(() => import("./pages/Offline"));

function LazyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground text-sm">로딩 중...</div>
    </div>
  );
}

function PublicRouter() {
  return (
    <Layout>
      <Suspense fallback={<LazyFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/solutions" component={Solutions} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/portfolio/p/:id" component={PortfolioDbDetail} />
          <Route path="/review/:token" component={ReviewWrite} />
          <Route path="/estimator" component={Estimator} />
          <Route path="/insights" component={Insights} />
          <Route path="/insights/:slug" component={InsightDetail} />
          <Route path="/unsubscribe/:token" component={Unsubscribe} />
          <Route path="/resources" component={Resources} />
          <Route path="/ai-chat" component={AIChat} />
          <Route path="/ai-style" component={AIStyle} />
          <Route path="/ai-redesign" component={AIRedesign} />
          <Route path="/faq" component={FAQ} />
          <Route path="/how-we-work" component={HowWeWork} />
          <Route path="/office-interior/:region" component={RegionInterior} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          {/* 고객 포털 (로그인 필요) */}
          <Route path="/portal" component={ClientPortal} />
          <Route path="/my" component={ClientPortal} />
          <Route path="/my/project/:id" component={ClientProjectDetail} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

// 관리자 셸(사이드바) 안에서 개별 admin 페이지를 라우팅
function AdminRouter() {
  return (
    <AdminLayout>
      <Suspense fallback={<LazyFallback />}>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          {/* 대시보드 내부 탭 → 사이드바 라우트 (모두 AdminDashboard가 URL로 탭 결정) */}
          <Route path="/admin/inquiries" component={AdminDashboard} />
          <Route path="/admin/subscribers" component={AdminDashboard} />
          <Route path="/admin/estimates" component={AdminDashboard} />
          <Route path="/admin/leads" component={AdminDashboard} />
          <Route path="/admin/ai-chat" component={AdminDashboard} />
          <Route path="/admin/ai-style" component={AdminDashboard} />
          <Route path="/admin/announcements" component={AdminDashboard} />
          <Route path="/admin/popups" component={AdminDashboard} />
          <Route path="/admin/notifications" component={AdminDashboard} />
          <Route path="/admin/drive-sync" component={AdminDashboard} />
          <Route path="/admin/deletion-log" component={AdminDashboard} />
          <Route path="/admin/portfolios" component={AdminPortfolios} />
          <Route path="/admin/portfolio/:id" component={AdminPortfolioDetail} />
          <Route path="/admin/ddia" component={AdminDDIA} />
          <Route path="/admin/crm" component={AdminCRM} />
          <Route path="/admin/design-auto" component={AdminDesignAuto} />
          <Route path="/admin/reviews" component={AdminReviews} />
          <Route path="/admin/newsletter" component={AdminNewsletter} />
          <Route path="/admin/insights" component={AdminInsights} />
          <Route path="/admin/client-pipeline" component={AdminClientPipeline} />
          <Route path="/admin/download-logs" component={AdminDownloadLogs} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/survey" component={AdminSurveyAutomation} />
          <Route path="/admin/vendor" component={AdminVendorPortal} />
          <Route path="/admin/aftercare" component={AdminPostOccupancy} />
          <Route path="/admin/employee" component={EmployeeDashboard} />
          <Route path="/admin/kpi-okr" component={AdminKpiOkr} />
          <Route path="/admin/pipeline" component={AdminPipelineOverview} />
          <Route path="/admin/journey-analytics" component={AdminJourneyAnalytics} />
          <Route path="/admin/finance" component={AdminFinance} />
          <Route path="/admin/marketing" component={AdminMarketing} />
          <Route path="/admin/content-calendar" component={AdminContentCalendar} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        {/* 고객 여정 서베이 (공개 접근) */}
        <Route path="/survey/workspace" component={WorkspaceSurvey} />
        <Route path="/survey/interview" component={WorkspaceInterview} />
        <Route path="/survey/report" component={WorkspaceReport} />
        <Route path="/survey/:token" component={CompanySurvey} />
        <Route path="/survey-response/:token" component={SurveyResponse} />
        {/* 하도급 업체 포털 */}
        <Route path="/ops/sub-portal/:subId" component={SubPortal} />
        {/* 고객 인증 및 공간 활용 대시보드 */}
        <Route path="/client/register" component={ClientRegister} />
        <Route path="/client/login" component={ClientLogin} />
        <Route path="/client/verify-email" component={ClientVerifyEmail} />
        <Route path="/client/forgot-password" component={ClientForgotPassword} />
        <Route path="/client/reset-password" component={ClientResetPassword} />
        <Route path="/client/dashboard" component={ClientSpaceDashboard} />
        {/* 로그인 */}
        <Route path="/auth/login" component={AuthLogin} />
        {/* 직원 및 협력사 인증 */}
        <Route path="/staff/pending-approval" component={StaffPendingApproval} />
        <Route path="/partner/login" component={PartnerLogin} />
        {/* 개발자 문서 */}
        <Route path="/developer/sensor-api" component={SensorApiDocs} />
        {/* 직원 대시보드 */}
        <Route path="/ops" component={OpsHome} />
        <Route path="/ops/project/:id" component={OpsProjectDetail} />
        <Route path="/ops/staff" component={OpsStaffManagement} />
        <Route path="/ops/calendar" component={OpsCalendar} />
        <Route path="/ops/partners" component={OpsPartners} />
        <Route path="/ops/partners/:tab" component={OpsPartners} />
        <Route path="/ops/staff-dashboard" component={OpsStaffDashboard} />
        <Route path="/ops/cameras" component={OpsCameras} />
        <Route path="/ops/field-measure" component={OpsFieldMeasure} />
        <Route path="/ops/projects" component={OpsProjects} />
        <Route path="/ops/schedule" component={OpsSchedule} />
        <Route path="/ops/approval" component={OpsApproval} />
        <Route path="/ops/approval-lines" component={OpsApprovalLines} />
        {/* 협력업체 포털 */}
        <Route path="/partner-portal" component={PartnerPortal} />
        {/* 직원 가입 신청 */}
        <Route path="/staff-join" component={StaffJoin} />
        {/* 오프라인 페이지 */}
        <Route path="/offline" component={Offline} />
        {/* Admin routes — 사이드바 셸(AdminLayout)로 감싼 중첩 라우터 */}
        <Route path="/admin/:rest*" component={AdminRouter} />
        <Route path="/admin" component={AdminRouter} />
        <Route component={PublicRouter} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AnalyticsProvider>
            <Router />
            <Suspense fallback={null}>
              <PwaInstallBanner />
            </Suspense>
          </AnalyticsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
