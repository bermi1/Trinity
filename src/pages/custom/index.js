// Hand-written pages, by page key (the generated design pages are in ../index.js).
import RequisitionsPage from './RequisitionsPage';
import StockLedgerPage from './StockLedgerPage';
import JobPage from './JobPage';
import PrintFloorPage from './PrintFloorPage';
import UsersPage from './UsersPage';
import TodayPage from './TodayPage';
import CompanyPage from './CompanyPage';
import DeptPage from './DeptPage';
import ClientsPage from './ClientsPage';
import MeetingsPage from './MeetingsPage';
import FinanceHub from './FinanceHub';
import ReportingPage from './ReportingPage';

export default {
  requisitions: RequisitionsPage,
  movements: StockLedgerPage,
  job: JobPage,
  printshop: PrintFloorPage,
  users: UsersPage,
  today: TodayPage,
  company: CompanyPage,
  dept: DeptPage,
  clients: ClientsPage,
  meetings: MeetingsPage,
  invoices: FinanceHub,
  cashbook: FinanceHub,
  freports: FinanceHub,
  float: FinanceHub,
  reporting: ReportingPage,
  petty: FinanceHub
};
