import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from '../Components/Layout';
import UseReloadHook from '../Hooks/UseReloadHook';
import AxiosService from '../Common/AxiosService';
import banner from '../assets/banner.jpg';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getMonthName,
  getStoredUser,
} from '../Common/authUtils';
import {
  FiUsers,
  FiCreditCard,
  FiAlertCircle,
  FiLayers,
  FiArrowRight,
  FiCalendar,
  FiActivity,
  FiFileText,
} from 'react-icons/fi';

const TXN_BADGE_STYLES = {
  payment: 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]',
  advance: 'bg-[#EDF6FC] text-[#0369A1] border-[#BAE0F5]',
  remainbalance: 'bg-[#E5ECEB] text-[#3B4442] border-[#C3D2CF]',
  due: 'bg-[#FEF6E7] text-[#B45309] border-[#F2D59B]',
  service: 'bg-brand-50 text-brand-800 border-brand-200',
  reversal: 'bg-[#FDF0EF] text-[#B91C1C] border-[#F3C5C2]',
};

function Home() {
  const {
    customerReload,
    reloadCollectionreports,
    ReloadPlan,
    collectionReload,
    cardData,
    getAllCollection,
  } = UseReloadHook();

  const { customer = [] } = useSelector((state) => state.customer);
  const { plan = [] } = useSelector((state) => state.plan);
  const { collection = [], monthwise = [] } = useSelector((state) => state.collection);
  const [tableData, setTableData] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  const currentUser = getStoredUser();
  const userName = currentUser?.userName || '';

  const getTransactions = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const res = await AxiosService.get('/customer/get20');
      if (res.status === 200) {
        setTableData(res?.data?.transactions || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load recent transactions', {
          toastId: 'home-txn-error',
        });
      }
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    customerReload();
    reloadCollectionreports();
    ReloadPlan();
    collectionReload();
    getTransactions();
    getAllCollection(false);
  }, [
    customerReload,
    reloadCollectionreports,
    ReloadPlan,
    collectionReload,
    getTransactions,
    getAllCollection,
  ]);

  const currentMonthStats = useMemo(() => {
    const list = Array.isArray(collection) ? collection : [];
    let subscriptionPaid = 0;
    let subscriptionPending = 0;
    let servicePaid = 0;
    let servicePending = 0;

    list.forEach((c) => {
      const paid = Number(c.amountPaid) || 0;
      const due = Number(c.amountDue) || 0;
      if (c.billType === 'service') {
        servicePaid += paid;
        servicePending += due;
      } else {
        subscriptionPaid += paid;
        subscriptionPending += due;
      }
    });

    return {
      collected: subscriptionPaid + servicePaid,
      pending: subscriptionPending + servicePending,
      subscriptionPaid,
      subscriptionPending,
      servicePaid,
      servicePending,
    };
  }, [collection]);

  const myCollections = useMemo(() => {
    if (!Array.isArray(cardData)) return [];
    return cardData.filter((item) => item?.collectedBy?.userName === userName);
  }, [cardData, userName]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Editorial Pine Operations Masthead (Zero purple gradients, zero glow orbs) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#101E1D] text-[#F1F5F4] border border-[#1E3230]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 p-6 sm:p-8 relative z-10 space-y-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Welcome back, {userName || 'Team Member'}
                </h2>
                <p className="text-sm text-[#C7D5D3] mt-1.5 max-w-xl leading-relaxed">
                  Track monthly fiber subscriptions, collect active &amp; overdue bills, issue FY
                  GST tax invoices, and reconcile daily field cash from one ledger.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition"
                >
                  <FiCreditCard className="w-4 h-4" />
                  <span>Collect Payment</span>
                </Link>
                <Link
                  to="/customer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B302E] hover:bg-[#243E3B] text-[#F1F5F4] text-sm font-medium border border-[#2C4744] transition"
                >
                  <FiUsers className="w-4 h-4" />
                  <span>Customers</span>
                </Link>
                <Link
                  to="/expense"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B302E] hover:bg-[#243E3B] text-[#F1F5F4] text-sm font-medium border border-[#2C4744] transition"
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Log Expense</span>
                </Link>
                <Link
                  to="/dailycollection"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B302E] hover:bg-[#243E3B] text-[#F1F5F4] text-sm font-medium border border-[#2C4744] transition"
                >
                  <FiCalendar className="w-4 h-4" />
                  <span>Daily Settlement</span>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-4 h-full relative min-h-[224px]">
              <img
                src={banner}
                alt="Sky Communications Fiber Network"
                className="absolute inset-0 w-full h-full object-cover opacity-45 saturate-75"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, #101E1D 0%, rgba(16,30,29,0.55) 48%, rgba(16,30,29,0.15) 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Unified Hairline-Divided Ledger KPI Strip (Subscription vs Service Split) */}
        <section className="bg-white rounded-2xl border border-[#D6E1DF] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D6E1DF]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Subscribers
              </span>
              <FiUsers className="w-4 h-4 text-brand-700" />
            </div>
            <p className="font-display text-3xl font-extrabold text-[#141918] tabular-nums">
              {customer.length}
            </p>
            <p className="text-xs text-[#596361] mt-1">
              {plan.length} active broadband plans
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Monthly Bills Collected
              </span>
              <FiCreditCard className="w-4 h-4 text-[#157347]" />
            </div>
            <p className="font-display text-3xl font-extrabold text-[#157347] tabular-nums">
              {formatCurrency(currentMonthStats.subscriptionPaid)}
            </p>
            <p className="text-xs text-[#596361] mt-1 tabular-nums">
              Pending: {formatCurrency(currentMonthStats.subscriptionPending)}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Service Bills Collected
              </span>
              <FiLayers className="w-4 h-4 text-brand-700" />
            </div>
            <p className="font-display text-3xl font-extrabold text-brand-700 tabular-nums">
              {formatCurrency(currentMonthStats.servicePaid)}
            </p>
            <p className="text-xs text-[#596361] mt-1 tabular-nums">
              Pending: {formatCurrency(currentMonthStats.servicePending)}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Total Receivable Due
              </span>
              <FiAlertCircle className="w-4 h-4 text-[#B91C1C]" />
            </div>
            <p className="font-display text-3xl font-extrabold text-[#B91C1C] tabular-nums">
              {formatCurrency(currentMonthStats.pending)}
            </p>
            <p className="text-xs text-[#596361] mt-1">
              Active + overdue unpaid bills
            </p>
          </div>
        </section>

        {/* Monthly Billing & Service Collection Summary */}
        {Array.isArray(monthwise) && monthwise.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#141918]">
                Month-Wise Subscription &amp; Service Collection
              </h3>
              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                >
                  <span>Full Reports &amp; Billing Console</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthwise.slice(0, 4).map((m, idx) => {
                const paid = Number(m.totalAmountPaid) || 0;
                const pending = Number(m.totalPending ?? m.totalAmountDue) || 0;
                const subPaid = Number(m.subscriptionPaid ?? paid) || 0;
                const subPending = Number(m.subscriptionPending ?? pending) || 0;
                const svcPaid = Number(m.servicePaid) || 0;
                const svcPending = Number(m.servicePending) || 0;
                const expected = paid + pending;
                const pct = expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : 0;

                return (
                  <div
                    key={`${m._id?.year}-${m._id?.month}-${idx}`}
                    className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base font-bold text-[#141918]">
                        {getMonthName(m._id?.month, m._id?.year)}
                      </p>
                      <span className="text-xs font-bold text-brand-800 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full tabular-nums">
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#E5ECEB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#4A5452] font-medium">Monthly Bills</span>
                        <span className="font-bold text-[#157347] tabular-nums">
                          {formatCurrency(subPaid)}
                          {subPending > 0 && (
                            <span className="font-medium text-[#B91C1C]">
                              {' '}
                              / {formatCurrency(subPending)} due
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#4A5452] font-medium">Service Bills</span>
                        <span className="font-bold text-brand-700 tabular-nums">
                          {formatCurrency(svcPaid)}
                          {svcPending > 0 && (
                            <span className="font-medium text-[#B45309]">
                              {' '}
                              / {formatCurrency(svcPending)} due
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E5ECEB]">
                        <span className="text-[#4A5452]">Total Collected</span>
                        <span className="font-bold text-[#141918] tabular-nums">
                          {formatCurrency(paid)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Transactions + My Collections Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D6E1DF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-brand-700" />
                <h3 className="font-display text-base font-bold text-[#141918]">
                  Recent Transactions
                </h3>
              </div>
              <span className="text-xs text-[#596361] font-medium">Latest 20 ledger entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEB] text-sm">
                  {loadingTxns ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#596361]">
                        <span className="loading loading-spinner loading-md text-brand-600" />
                      </td>
                    </tr>
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-[#4A5452]">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    tableData.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-[#F7FAFA] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#141918]">
                          {txn?.customerName || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-[#4A5452]">
                          <p className="font-medium text-[#2A3331]">{formatDate(txn?.date)}</p>
                          <p className="text-[#596361]">{formatTime(txn?.date)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                              TXN_BADGE_STYLES[txn?.type] ||
                              'bg-[#E5ECEB] text-[#3B4442] border-[#C3D2CF]'
                            }`}
                          >
                            {txn?.type || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums text-[#141918]">
                          {formatCurrency(txn?.amount)}
                        </td>
                        <td className="py-3 px-4 text-[#4A5452]">
                          {txn?.collectedBy?.userName || 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* My Daily Collections (Flattened hairline list — no nested cards) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#D6E1DF] flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#141918]">Your Collections</h3>
              <span className="text-xs text-[#596361] font-medium">This month</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[520px] divide-y divide-[#E5ECEB]">
              {myCollections.length === 0 ? (
                <div className="py-10 px-5 text-center text-sm text-[#4A5452]">
                  No collections logged under your account this month.
                </div>
              ) : (
                myCollections.map((item, idx) => (
                  <div
                    key={`${item.day}-${item.type}-${idx}`}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F7FAFA]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#141918]">Day {item.day}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                          item.type === 'advance'
                            ? 'bg-[#EDF6FC] text-[#0369A1] border-[#BAE0F5]'
                            : 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p
                      className={`font-display text-lg font-bold tabular-nums ${
                        item.type === 'advance' ? 'text-[#0369A1]' : 'text-[#157347]'
                      }`}
                    >
                      {formatCurrency(item.totalCollected)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
