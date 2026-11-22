import { FiMenu, FiCalendar } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { getStoredUser } from '../Common/authUtils';

const ROUTE_META = {
  '/home': {
    title: 'Dashboard',
    subtitle: 'Overview of customer billing, collections, and ledger activity',
  },
  '/customer': {
    title: 'Customers',
    subtitle: 'Manage subscriber directory, plans, and transaction history',
  },
  '/collection': {
    title: 'Collections',
    subtitle: 'Record customer payments and track active & overdue bills',
  },
  '/services': {
    title: 'Services & Extra Charges',
    subtitle: 'Record installation, equipment, or field service charges on customer history',
  },
  '/gst': {
    title: 'GST Invoices & Audit',
    subtitle: 'Sequential FY tax invoices, PDF printing, and GSTR-1 Excel exports',
  },
  '/plan': {
    title: 'Internet Plans',
    subtitle: 'View and configure broadband speed packages and monthly tariffs',
  },
  '/expense': {
    title: 'Daily Expenses',
    subtitle: 'Log and manage operational field expenses',
  },
  '/dailycollection': {
    title: 'Daily Settlement',
    subtitle: 'Submit daily cash collections and attach itemized expenses',
  },
  '/admin': {
    title: 'Admin & Reports',
    subtitle: 'Analytics, monthly billing console, settlements, and staff approval',
  },
};

function NavBar({ toggleSidebar }) {
  const location = useLocation();
  const user = getStoredUser();
  const meta = ROUTE_META[location.pathname] || {
    title: 'Sky Communications',
    subtitle: 'Billing & Collection Portal',
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#F7FAFA] border-b border-[#D6E1DF] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-2 -ml-2 rounded-lg text-[#4A5452] hover:text-[#141918] hover:bg-[#E5ECEB] transition-colors cursor-pointer"
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-[#141918] truncate leading-tight">
            {meta.title}
          </h1>
          <p className="text-xs text-[#4A5452] truncate hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5ECEB] text-[#3B4442] text-xs font-medium border border-[#D6E1DF]">
          <FiCalendar className="w-3.5 h-3.5 text-brand-700" />
          <span>{todayFormatted}</span>
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-[#D6E1DF]">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold uppercase">
            {user?.userName?.slice(0, 2) || 'SC'}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-[#141918] max-w-[140px] truncate">
              {user?.userName || 'User'}
            </p>
            <span
              className={`inline-block text-xs font-semibold capitalize ${
                user?.role === 'admin' ? 'text-brand-700' : 'text-[#4A5452]'
              }`}
            >
              {user?.role || 'staff'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
