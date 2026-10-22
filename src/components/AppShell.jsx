// Generated from the Claude Design file by scripts/dc-to-jsx.mjs.
import CustomPage from '../pages/custom/CustomPage';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardPage from '../pages/DashboardPage';
import BriefingPage from '../pages/BriefingPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import TasksPage from '../pages/TasksPage';
import RequestsPage from '../pages/RequestsPage';
import FinancePage from '../pages/FinancePage';
import StorePage from '../pages/StorePage';
import ProcurementPage from '../pages/ProcurementPage';
import CrmPage from '../pages/CrmPage';
import StaffPage from '../pages/StaffPage';
import NotificationsPage from '../pages/NotificationsPage';
import FieldAppPage from '../pages/FieldAppPage';
import StaffPortalPage from '../pages/StaffPortalPage';
import FinancePortalPage from '../pages/FinancePortalPage';
import ReceptionPage from '../pages/ReceptionPage';
import StorekeeperPage from '../pages/StorekeeperPage';
import RoomsPage from '../pages/RoomsPage';
import ProposalsPage from '../pages/ProposalsPage';
import ProductionPage from '../pages/ProductionPage';
import LogisticsPage from '../pages/LogisticsPage';
import DocumentsPage from '../pages/DocumentsPage';
import ReportsPage from '../pages/ReportsPage';
import CalendarPage from '../pages/CalendarPage';
import SettingsPage from '../pages/SettingsPage';
import MobileAppsPage from '../pages/MobileAppsPage';
import FormModal from './FormModal';
import CommandPalette from './CommandPalette';
import AssistantPanel from './AssistantPanel';
import MobileNav from './MobileNav';
import Toasts from './Toasts';

export default function AppShell({ v }) {
  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F4F1FA" }}>
        {v.drawerOpen ? (
          <>
            <div onClick={v.closeDrawer} style={{ position: "fixed", inset: "0", background: "rgba(23,21,42,.45)", zIndex: "40" }} />
          </>
        ) : null}
        {v.showSidebar ? <Sidebar v={v} /> : null}
        <main style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
          <TopBar v={v} />
          <div style={{ padding: "clamp(16px,2.4vw,32px)", display: "flex", flexDirection: "column", gap: "20px", animation: "tmIn .25s ease" }}>
            {v.is.dashboard ? <DashboardPage v={v} /> : null}
            {v.is.briefing ? <BriefingPage v={v} /> : null}
            {v.is.projects ? <ProjectsPage v={v} /> : null}
            {v.is.project ? <ProjectDetailPage v={v} /> : null}
            {v.is.tasks ? <TasksPage v={v} /> : null}
            {v.is.requests ? <RequestsPage v={v} /> : null}
            {v.is.finance ? <FinancePage v={v} /> : null}
            {v.is.store ? <StorePage v={v} /> : null}
            {v.is.procurement ? <ProcurementPage v={v} /> : null}
            {v.is.crm ? <CrmPage v={v} /> : null}
            {v.is.staff ? <StaffPage v={v} /> : null}
            {v.is.notifications ? <NotificationsPage v={v} /> : null}
            {v.is.field ? <FieldAppPage v={v} /> : null}
            {v.is.staffportal ? <StaffPortalPage v={v} /> : null}
            {v.is.financeportal ? <FinancePortalPage v={v} /> : null}
            {v.is.reception ? <ReceptionPage v={v} /> : null}
            {v.is.storekeeper ? <StorekeeperPage v={v} /> : null}
            {v.is.rooms ? <RoomsPage v={v} /> : null}
            {v.is.proposals ? <ProposalsPage v={v} /> : null}
            {v.is.production ? <ProductionPage v={v} /> : null}
            {v.is.logistics ? <LogisticsPage v={v} /> : null}
            {v.is.documents ? <DocumentsPage v={v} /> : null}
            {v.is.reports ? <ReportsPage v={v} /> : null}
            {v.is.calendar ? <CalendarPage v={v} /> : null}
            {v.is.settings ? <SettingsPage v={v} /> : null}
            {v.is.ceomobile ? <MobileAppsPage v={v} /> : null}
            {v.phone ? (
              <>
                <div style={{ height: "84px", flex: "none" }} />
              </>
            ) : null}
            <CustomPage v={v} />
          </div>
        </main>
      </div>
      {v.modalOpen ? <FormModal v={v} /> : null}
      {v.cmdOpen ? <CommandPalette v={v} /> : null}
      {v.aiOpen ? <AssistantPanel v={v} /> : null}
      {v.phone ? <MobileNav v={v} /> : null}
      <Toasts v={v} />
    </>
  );
}
