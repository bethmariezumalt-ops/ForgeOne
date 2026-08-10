import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import WorkOrders from "./pages/WorkOrders";
import Vehicles from "./pages/Vehicles";
import Clients from "./pages/Clients";
import Invoices from "./pages/Invoices";
import Calendar from "./pages/Calendar";
import Inventory from "./pages/Inventory";
import DrivingLog from "./pages/DrivingLog";
import Expenses from "./pages/Expenses";
import Profitability from "./pages/Profitability";
import FlipProjects from "./pages/FlipProjects";
import GeneralWork from "./pages/GeneralWork";
import ScanQR from "./pages/ScanQR";
import VehicleDetail from "./pages/VehicleDetail";
import Team from "./pages/Team";
import TimeBilling from "./pages/TimeBilling";
import ClientOverview from "./pages/ClientOverview";
import InvoiceScanner from "./pages/InvoiceScanner";
import CustomerPortal from "./pages/CustomerPortal";
import Assets from "./pages/Assets";
import RealEstate from "./pages/RealEstate";
import Inquiries from "./pages/Inquiries";
import JobBoard from "./pages/JobBoard";
import HourBank from "./pages/HourBank";
import UserProfile from "./pages/UserProfile";
import TimeTracking from "./pages/TimeTracking";
import PartsTracker from "./pages/PartsTracker";
import PayTracking from "./pages/PayTracking";
import TechPerformance from "./pages/TechPerformance";
import ProfitTracker from "./pages/ProfitTracker";
import BranchWorkOrders from "./pages/BranchWorkOrders";
import BranchInvoices from "./pages/BranchInvoices";
import BranchClients from "./pages/BranchClients";
import BranchInquiries from "./pages/BranchInquiries";
import TotalClients from "./pages/TotalClients";
import EmployeeTasks from "./pages/EmployeeTasks";
import PhoneCalls from "./pages/PhoneCalls";
import { ViewAsProvider } from "./contexts/ViewAsContext";

// Branch wrapper components
function OnsiteWorkOrders() { return <BranchWorkOrders branchKey="on_site_advantage" branchName="On-Site Advantage" branchColor="bg-emerald-600 hover:bg-emerald-700" />; }
function OnsiteInvoices() { return <BranchInvoices branchKey="on_site_advantage" branchName="On-Site Advantage" branchColor="bg-emerald-600 hover:bg-emerald-700" />; }
function OnsiteClients() { return <BranchClients branchKey="on_site_advantage" branchName="On-Site Advantage" branchColor="bg-emerald-600 hover:bg-emerald-700" />; }
function OnsiteInquiries() { return <BranchInquiries branchKey="on_site_advantage" branchName="On-Site Advantage" branchColor="bg-emerald-600 hover:bg-emerald-700" />; }

function CustomWorkOrders() { return <BranchWorkOrders branchKey="customized_enterprise" branchName="Customized Enterprise" branchColor="bg-purple-600 hover:bg-purple-700" />; }
function CustomInvoices() { return <BranchInvoices branchKey="customized_enterprise" branchName="Customized Enterprise" branchColor="bg-purple-600 hover:bg-purple-700" />; }
function CustomClients() { return <BranchClients branchKey="customized_enterprise" branchName="Customized Enterprise" branchColor="bg-purple-600 hover:bg-purple-700" />; }
function CustomInquiries() { return <BranchInquiries branchKey="customized_enterprise" branchName="Customized Enterprise" branchColor="bg-purple-600 hover:bg-purple-700" />; }

function DashboardRouter() {
  return (
    <ViewAsProvider>
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/work-orders" component={WorkOrders} />
        <Route path="/scan" component={ScanQR} />
        <Route path="/scan/:vin" component={ScanQR} />
        <Route path="/general-work" component={GeneralWork} />
        <Route path="/calendar" component={Calendar} />
        {/* Acme Automotive */}
        <Route path="/vehicles" component={Vehicles} />
        <Route path="/vehicles/:id" component={VehicleDetail} />
        <Route path="/clients" component={Clients} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/client-overview" component={ClientOverview} />
        <Route path="/invoice-scanner" component={InvoiceScanner} />
        <Route path="/inquiries" component={Inquiries} />
        {/* On-Site Advantage */}
        <Route path="/onsite-work-orders" component={OnsiteWorkOrders} />
        <Route path="/onsite-invoices" component={OnsiteInvoices} />
        <Route path="/onsite-clients" component={OnsiteClients} />
        <Route path="/onsite-inquiries" component={OnsiteInquiries} />
        {/* Customized Enterprise */}
        <Route path="/custom-work-orders" component={CustomWorkOrders} />
        <Route path="/custom-invoices" component={CustomInvoices} />
        <Route path="/custom-clients" component={CustomClients} />
        <Route path="/custom-inquiries" component={CustomInquiries} />
        <Route path="/flip-projects" component={FlipProjects} />
        <Route path="/assets" component={Assets} />
        <Route path="/real-estate" component={RealEstate} />
        {/* Operations */}
        <Route path="/inventory" component={Inventory} />
        <Route path="/driving" component={DrivingLog} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/profitability" component={Profitability} />
        <Route path="/time-billing" component={TimeBilling} />
        <Route path="/job-board" component={JobBoard} />
        <Route path="/hour-bank" component={HourBank} />
        <Route path="/time-tracking" component={TimeTracking} />
        <Route path="/parts-tracker" component={PartsTracker} />
        <Route path="/profit-tracker" component={ProfitTracker} />
        {/* All Clients */}
        <Route path="/total-clients" component={TotalClients} />
        <Route path="/employee-tasks" component={EmployeeTasks} />
        <Route path="/phone-calls" component={PhoneCalls} />
        {/* Admin */}
        <Route path="/team" component={Team} />
        <Route path="/pay" component={PayTracking} />
        <Route path="/tech-performance" component={TechPerformance} />
        {/* Personal */}
        <Route path="/my-profile" component={UserProfile} />
        <Route path="/team/:userId" component={UserProfile} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
    </ViewAsProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            {/* Public-facing customer portal (no auth required) */}
            <Route path="/portal" component={CustomerPortal} />
            {/* All other routes go through the authenticated dashboard layout */}
            <Route>
              <DashboardRouter />
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
