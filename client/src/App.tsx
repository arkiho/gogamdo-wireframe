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
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPortfolioDetail from "./pages/AdminPortfolioDetail";
import AdminDDIA from "./pages/AdminDDIA";
import AdminCRM from "./pages/AdminCRM";
import Resources from "./pages/Resources";
import AIChat from "./pages/AIChat";
import AIStyle from "./pages/AIStyle";
import FAQ from "./pages/FAQ";
import Layout from "./components/Layout";

function PublicRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/solutions" component={Solutions} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/portfolio/p/:id" component={PortfolioDbDetail} />
        <Route path="/portfolio/:slug" component={ProjectDetail} />
        <Route path="/estimator" component={Estimator} />
        <Route path="/insights" component={Insights} />
        <Route path="/resources" component={Resources} />
        <Route path="/ai-chat" component={AIChat} />
        <Route path="/ai-style" component={AIStyle} />
        <Route path="/faq" component={FAQ} />
        <Route path="/contact" component={Contact} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/portfolio/:id" component={AdminPortfolioDetail} />
      <Route path="/admin/ddia" component={AdminDDIA} />
      <Route path="/admin/crm" component={AdminCRM} />
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
