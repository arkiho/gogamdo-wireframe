import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AnalyticsProvider from "./components/AnalyticsProvider";
import Home from "./pages/Home";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import Portfolio from "./pages/Portfolio";
import ProjectDetail from "./pages/ProjectDetail";
import PortfolioDbDetail from "./pages/PortfolioDbDetail";
import Estimator from "./pages/Estimator";
import Insights from "./pages/Insights";
import InsightDetail from "./pages/InsightDetail";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPortfolioDetail from "./pages/AdminPortfolioDetail";
import AdminDDIA from "./pages/AdminDDIA";
import AdminCRM from "./pages/AdminCRM";
import AdminDesignAuto from "./pages/AdminDesignAuto";
import AdminReviews from "./pages/AdminReviews";
import AdminNewsletter from "./pages/AdminNewsletter";
import AdminInsights from "./pages/AdminInsights";
import AdminClientPipeline from "./pages/AdminClientPipeline";
import AdminDownloadLogs from "./pages/AdminDownloadLogs";
import AdminSettings from "./pages/AdminSettings";
import Unsubscribe from "./pages/Unsubscribe";
import ReviewWrite from "./pages/ReviewWrite";
import CompanySurvey from "./pages/CompanySurvey";
import ClientPortal from "./pages/ClientPortal";
import ClientProjectDetail from "./pages/ClientProjectDetail";
import Resources from "./pages/Resources";
import AIChat from "./pages/AIChat";
import AIStyle from "./pages/AIStyle";
import AIRedesign from "./pages/AIRedesign";
import FAQ from "./pages/FAQ";
import OpsXProcess from "./pages/OpsXProcess";
import OpsHome from "./pages/ops/OpsHome";
import OpsProjectDetail from "./pages/ops/OpsProjectDetail";
import SubPortal from "./pages/ops/SubPortal";
import OpsStaffManagement from "./pages/ops/OpsStaffManagement";
import OpsCalendar from "./pages/ops/OpsCalendar";
import OpsPartners from "./pages/ops/OpsPartners";
import ClientRegister from "./pages/ClientRegister";
import ClientLogin from "./pages/ClientLogin";
import ClientVerifyEmail from "./pages/ClientVerifyEmail";
import SensorApiDocs from "./pages/SensorApiDocs";
import ClientSpaceDashboard from "./pages/ClientSpaceDashboard";
import Layout from "./components/Layout";
import AdminSurveyAutomation from "./pages/AdminSurveyAutomation";
import AdminRealestateMatching from "./pages/AdminRealestateMatching";
import AdminVendorPortal from "./pages/AdminVendorPortal";
import AdminPostOccupancy from "./pages/AdminPostOccupancy";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminPortfolios from "./pages/AdminPortfolios";
import SurveyResponse from "./pages/SurveyResponse";
import OpsStaffDashboard from "./pages/ops/OpsStaffDashboard";
import OpsCameras from "./pages/ops/OpsCameras";
import AdminKpiOkr from "./pages/AdminKpiOkr";
import AdminPipelineOverview from "./pages/AdminPipelineOverview";
import PartnerPortal from "./pages/PartnerPortal";
import StaffJoin from "./pages/StaffJoin";

function PublicRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/solutions" component={Solutions} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/portfolio/p/:id" component={PortfolioDbDetail} />
        <Route path="/review/:token" component={ReviewWrite} />
        <Route path="/portfolio/:slug" component={ProjectDetail} />
        <Route path="/estimator" component={Estimator} />
        <Route path="/insights" component={Insights} />
        <Route path="/insights/:slug" component={InsightDetail} />
        <Route path="/unsubscribe/:token" component={Unsubscribe} />
        <Route path="/resources" component={Resources} />
        <Route path="/ai-chat" component={AIChat} />
        <Route path="/ai-style" component={AIStyle} />
        <Route path="/ai-redesign" component={AIRedesign} />
        <Route path="/faq" component={FAQ} />
        <Route path="/opsx" component={OpsXProcess} />
        <Route path="/contact" component={Contact} />
        {/* 고객 포털 (로그인 필요) */}
        <Route path="/portal" component={ClientPortal} />
        <Route path="/my" component={ClientPortal} />
        <Route path="/my/project/:id" component={ClientProjectDetail} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      {/* 전사 서베이 - Layout 없이 독립 페이지 */}
      <Route path="/survey/:token" component={CompanySurvey} />
      <Route path="/survey-response/:token" component={SurveyResponse} />
      {/* 하도급 업체 포털 - Layout 없이 독립 페이지 */}
      <Route path="/ops/sub-portal/:subId" component={SubPortal} />
      {/* 고객 인증 및 공간 활용 대시보드 */}
      <Route path="/client/register" component={ClientRegister} />
      <Route path="/client/login" component={ClientLogin} />
      <Route path="/client/verify-email" component={ClientVerifyEmail} />
      <Route path="/client/dashboard" component={ClientSpaceDashboard} />
      {/* 개발자 문서 */}
      <Route path="/developer/sensor-api" component={SensorApiDocs} />
      {/* OpsX 직원 대시보드 */}
      <Route path="/ops" component={OpsHome} />
      <Route path="/ops/project/:id" component={OpsProjectDetail} />
      <Route path="/ops/staff" component={OpsStaffManagement} />
      <Route path="/ops/calendar" component={OpsCalendar} />
      <Route path="/ops/partners" component={OpsPartners} />
      <Route path="/ops/partners/:tab" component={OpsPartners} />
      <Route path="/ops/staff-dashboard" component={OpsStaffDashboard} />
      <Route path="/ops/cameras" component={OpsCameras} />
      {/* 협력업체 포털 */}
      <Route path="/partner-portal" component={PartnerPortal} />
      {/* 직원 가입 신청 */}
      <Route path="/staff-join" component={StaffJoin} />
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
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
      <Route path="/admin/realestate" component={AdminRealestateMatching} />
      <Route path="/admin/vendor" component={AdminVendorPortal} />
      <Route path="/admin/aftercare" component={AdminPostOccupancy} />
      <Route path="/admin/employee" component={EmployeeDashboard} />
      <Route path="/admin/kpi-okr" component={AdminKpiOkr} />
      <Route path="/admin/pipeline" component={AdminPipelineOverview} />
      <Route component={PublicRouter} />
    </Switch>
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
          </AnalyticsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
