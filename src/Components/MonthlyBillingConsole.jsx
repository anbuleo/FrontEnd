import { useCallback, useEffect, useMemo, useState } from 'react';
import AxiosService from '../Common/AxiosService';
import Modal from '../Common/Modal';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate, formatTime, getMonthName } from '../Common/authUtils';
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const PREVIEW_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'will_bill', label: 'Ready to Bill' },
  { key: 'already_billed', label: 'Already Billed' },
  { key: 'skipped', label: 'Skipped' },
];

function MonthlyBillingConsole({ onBillingCompleted }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);

  const [loadingRuns, setLoadingRuns] = useState(true);
  const [billingRuns, setBillingRuns] = useState([]);
  const [cronSchedule, setCronSchedule] = useState(null);

  const [rowFilter, setRowFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [runningBatch, setRunningBatch] = useState(false);
  const [billingSingleId, setBillingSingleId] = useState(null);

  const yearOptions = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const list = [];
    for (let y = currentYr - 2; y <= currentYr + 1; y += 1) {
      list.push(y);
    }
    return list;
  }, []);

  const fetchPreview = useCallback(
    async (m = selectedMonth, y = selectedYear) => {
      setLoadingPreview(true);
      try {
        const res = await AxiosService.get('/collection/billing-preview', {
          params: { month: m, year: y },
        });
        setPreviewSummary(res?.data?.summary || null);
        setPreviewRows(res?.data?.rows || []);
      } catch (error) {
        if (error?.response?.status !== 401) {
          toast.error(error?.response?.data?.message || 'Failed to load billing preview');
        }
      } finally {
        setLoadingPreview(false);
      }
    },
    [selectedMonth, selectedYear]
  );

  const fetchBillingRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await AxiosService.get('/collection/billing-runs');
      setBillingRuns(res?.data?.runs || []);
      setCronSchedule(res?.data?.schedule || null);
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load billing history');
      }
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview(selectedMonth, selectedYear);
  }, [fetchPreview, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBillingRuns();
  }, [fetchBillingRuns]);

  const handleRunBatchBilling = async () => {
    setRunningBatch(true);
    try {
      const res = await AxiosService.post('/collection/genratebill', {
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success(
        res?.data?.message || `Monthly billing completed for ${getMonthName(selectedMonth, selectedYear)}`
      );
      setIsConfirmOpen(false);
      await Promise.allSettled([
        fetchPreview(selectedMonth, selectedYear),
        fetchBillingRuns(),
        onBillingCompleted ? onBillingCompleted() : Promise.resolve(),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Monthly billing run failed');
    } finally {
      setRunningBatch(false);
    }
  };

  const handleBillSingleCustomer = async (row) => {
    setBillingSingleId(row.customerId);
    try {
      const res = await AxiosService.post(`/collection/generate-customer-bill/${row.customerId}`, {
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success(
        res?.data?.message ||
          `Generated ${getMonthName(selectedMonth, selectedYear)} bill for ${row.name}`
      );
      await Promise.allSettled([
        fetchPreview(selectedMonth, selectedYear),
        fetchBillingRuns(),
        onBillingCompleted ? onBillingCompleted() : Promise.resolve(),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to bill ${row.name}`);
    } finally {
      setBillingSingleId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return previewRows.filter((row) => {
      if (rowFilter === 'will_bill' && row.action !== 'will_bill') return false;
      if (rowFilter === 'already_billed' && row.action !== 'already_billed') return false;
      if (
        rowFilter === 'skipped' &&
        row.action !== 'skipped_inactive' &&
        row.action !== 'skipped_no_plan'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        String(row.name || '').toLowerCase().includes(q) ||
        String(row.mobile || '').toLowerCase().includes(q) ||
        String(row.planName || '').toLowerCase().includes(q) ||
        String(row.gstin || '').toLowerCase().includes(q)
      );
    });
  }, [previewRows, rowFilter, searchQuery]);

  const cycleLabel = getMonthName(selectedMonth, selectedYear);
  const eligibleCount = previewSummary?.eligibleCount || 0;
  const skippedTotal =
    (previewSummary?.skippedAlreadyBilled || 0) +
    (previewSummary?.skippedInactive || 0) +
    (previewSummary?.skippedNoPlan || 0);

  return (
    <div className="space-y-6">
      {/* Automated Cron Status + Senior Engine Guarantees */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <FiClock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base font-bold text-[#141918]">
                Automated Monthly Subscription Engine
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF6EF] text-[#157347] border border-[#BBE2CC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#157347]" />
                CRON ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#3B4442] leading-relaxed">
              {cronSchedule?.description || 'Automatic run on the 1st of every month at 12:05 AM'}{' '}
              <span className="font-semibold text-[#141918]">
                ({cronSchedule?.timezone || 'Asia/Kolkata'})
              </span>
              . Each cycle bills only that month&apos;s subscription (Base for Regular, Base + GST
              with sequential FY Invoice for GST customers), auto-applies customer Advance credit,
              marks unpaid prior bills as <span className="font-semibold text-[#B91C1C]">Overdue</span>{' '}
              with zero double-counting, and safely skips already-billed or paused/disconnected
              accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-brand-800 bg-white border border-brand-200 px-3 py-2 rounded-xl">
          <FiShield className="w-4 h-4 shrink-0" />
          <span>100% Idempotent • Safe to Re-run</span>
        </div>
      </div>

      {/* Billing Cycle Selector & Primary Action Bar */}
      <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="billing-month-select"
              className="block text-xs font-semibold uppercase tracking-wider text-[#4A5452] mb-1.5"
            >
              Billing Month
            </label>
            <select
              id="billing-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl border border-[#C3D2CF] bg-white text-sm font-semibold text-[#141918] focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="billing-year-select"
              className="block text-xs font-semibold uppercase tracking-wider text-[#4A5452] mb-1.5"
            >
              Year
            </label>
            <select
              id="billing-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl border border-[#C3D2CF] bg-white text-sm font-semibold text-[#141918] focus:outline-none focus:border-brand-500 tabular-nums cursor-pointer"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={loadingPreview}
            onClick={() => fetchPreview(selectedMonth, selectedYear)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#C3D2CF] bg-white hover:bg-[#F7FAFA] disabled:opacity-60 text-[#2A3331] text-sm font-semibold transition cursor-pointer"
          >
            <FiRefreshCw className={`w-4 h-4 ${loadingPreview ? 'animate-spin' : ''}`} />
            <span>Refresh Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={loadingPreview || eligibleCount === 0}
            onClick={() => setIsConfirmOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              eligibleCount > 0
                ? 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
            }`}
          >
            {eligibleCount > 0 ? (
              <>
                <FiPlay className="w-4 h-4" />
                <span>
                  Run Monthly Billing — {cycleLabel} ({eligibleCount})
                </span>
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4" />
                <span>All Active Subscribers Billed for {cycleLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dry-Run KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
            <span>Ready to Bill</span>
            <FiUsers className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#141918] tabular-nums">
            {loadingPreview ? '—' : eligibleCount}
          </p>
          <p className="text-xs text-[#4A5452]">
            {previewSummary?.eligibleRegularCount || 0} Regular •{' '}
            <span className="font-semibold text-brand-600">
              {previewSummary?.eligibleGstCount || 0} GST
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
            <span>Skipped Accounts</span>
            <FiAlertCircle className="w-4 h-4 text-[#596361]" />
          </div>
          <p className="text-2xl font-extrabold text-[#141918] tabular-nums">
            {loadingPreview ? '—' : skippedTotal}
          </p>
          <p className="text-xs text-[#4A5452]">
            {previewSummary?.skippedAlreadyBilled || 0} already billed •{' '}
            {previewSummary?.skippedInactive || 0} paused/disc •{' '}
            {previewSummary?.skippedNoPlan || 0} no plan
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
            <span>Projected Bill Value</span>
            <FiFileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#141918] tabular-nums">
            {loadingPreview ? '—' : formatCurrency(previewSummary?.totalBilledAmount)}
          </p>
          <p className="text-xs text-[#4A5452] tabular-nums">
            Base {formatCurrency(previewSummary?.totalBaseAmount)} + GST{' '}
            {formatCurrency(previewSummary?.totalGstAmount)}
          </p>
          {previewSummary?.projectedInvoiceStart && (
            <p className="text-xs font-mono font-semibold text-brand-600 pt-0.5 truncate">
              FY {previewSummary.financialYear}: {previewSummary.projectedInvoiceStart}
              {previewSummary.projectedInvoiceEnd !== previewSummary.projectedInvoiceStart
                ? ` → ${previewSummary.projectedInvoiceEnd}`
                : ''}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
            <span>Net New Receivable</span>
            <FiCalendar className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">
            {loadingPreview ? '—' : formatCurrency(previewSummary?.netNewDueAmount)}
          </p>
          <p className="text-xs text-[#4A5452] tabular-nums">
            Advance Auto-Applied:{' '}
            <span className="font-semibold text-sky-600">
              {formatCurrency(previewSummary?.totalAdvanceApplied)}
            </span>
          </p>
        </div>
      </div>

      {/* Customer-by-Customer Dry-Run Preview Table */}
      <section className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
        <div className="p-5 border-b border-[#E5ECEB] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#141918]">
              Dry-Run Billing Preview — {cycleLabel}
            </h3>
            <p className="text-xs text-[#4A5452]">
              Review exact subscription amounts, GST invoices, and advance deductions before
              billing. Use &ldquo;Bill Only&rdquo; for mid-month new subscribers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative">
              <FiSearch className="w-4 h-4 text-[#596361] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search customer, plan, GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#D6E1DF] bg-[#F7FAFA] focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {PREVIEW_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRowFilter(f.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    rowFilter === f.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-[#E5ECEB] text-[#4A5452] hover:bg-[#D6E1DF]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#F7FAFA] border-b border-[#D6E1DF]">
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                <th className="py-3 px-4">Subscriber</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Type / Next Inv #</th>
                <th className="py-3 px-4 text-right">Base</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Advance</th>
                <th className="py-3 px-4 text-right">New Due</th>
                <th className="py-3 px-4">Preview Status</th>
                <th className="py-3 px-4 text-right">Single Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECEB] text-sm">
              {loadingPreview ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#4A5452]">
                    Calculating dry-run billing preview...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#4A5452]">
                    No subscribers match this filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isWillBill = row.action === 'will_bill';
                  const isAlreadyBilled = row.action === 'already_billed';
                  const isBusy = billingSingleId === row.customerId;

                  return (
                    <tr key={row.customerId} className="hover:bg-[#F7FAFA]">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#141918]">{row.name}</p>
                        <p className="text-xs text-[#4A5452] tabular-nums">
                          {row.mobile}
                          {row.existingBalance > 0 && (
                            <span className="ml-1.5 text-rose-600 font-medium">
                              • Prior Bal {formatCurrency(row.existingBalance)}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[#2A3331]">
                        {row.planName}
                      </td>
                      <td className="py-3 px-4">
                        {row.isGstCustomer ? (
                          <div>
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                              GST
                            </span>
                            {row.projectedInvoiceNumber && (
                              <p className="text-xs font-mono text-brand-700 font-semibold mt-0.5">
                                {row.projectedInvoiceNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-[#E5ECEB] text-[#4A5452] border border-[#D6E1DF]">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#2A3331]">
                        {isWillBill ? formatCurrency(row.baseAmount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#4A5452]">
                        {isWillBill && row.gstAmount > 0 ? formatCurrency(row.gstAmount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-sky-600 font-medium">
                        {isWillBill && row.advanceApplied > 0
                          ? `-${formatCurrency(row.advanceApplied)}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-[#141918]">
                        {isWillBill ? formatCurrency(row.netDue) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isWillBill
                              ? 'bg-brand-50 text-brand-700 border-brand-200'
                              : isAlreadyBilled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-[#E5ECEB] text-[#4A5452] border-[#D6E1DF]'
                          }`}
                        >
                          {row.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isWillBill ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleBillSingleCustomer(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 disabled:opacity-60 text-brand-700 border border-brand-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <FiUserPlus className="w-3.5 h-3.5" />
                            <span>{isBusy ? 'Billing...' : 'Bill Only'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-[#596361]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Immutable Billing Run Audit History */}
      <section className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5ECEB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#141918]">Billing Run Audit History</h3>
            <p className="text-xs text-[#4A5452]">
              Permanent log of every automatic cron execution, manual admin batch run, and
              mid-month single-customer bill.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#4A5452] tabular-nums">
            {billingRuns.length} run(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Trigger</th>
                <th className="py-3 px-4">Run By</th>
                <th className="py-3 px-4">Bills Generated</th>
                <th className="py-3 px-4">GST Invoice Range</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Advance Used</th>
                <th className="py-3 px-4 text-right">Net New Due</th>
                <th className="py-3 px-4">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECEB] text-sm">
              {loadingRuns ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#4A5452]">
                    Loading audit log...
                  </td>
                </tr>
              ) : billingRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#4A5452]">
                    No monthly billing runs recorded yet.
                  </td>
                </tr>
              ) : (
                billingRuns.map((run) => (
                  <tr key={run._id} className="hover:bg-[#F7FAFA]">
                    <td className="py-3 px-4 font-bold text-[#141918] whitespace-nowrap">
                      {getMonthName(run.month, run.year)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${
                          run.runType === 'cron'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : run.runType === 'single'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-brand-50 text-brand-700 border-brand-200'
                        }`}
                      >
                        {run.runType === 'cron'
                          ? 'Auto Cron'
                          : run.runType === 'single'
                            ? 'Single Catch-up'
                            : 'Manual Batch'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#2A3331]">
                      {run.triggeredBy?.userName || run.triggeredByName || 'System'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-bold text-[#141918] tabular-nums">
                        {run.totalBillsCreated}
                      </span>{' '}
                      <span className="text-[#4A5452]">
                        ({run.regularBillsCreated} Reg • {run.gstBillsCreated} GST)
                      </span>
                      {run.markedOverdueCount > 0 && (
                        <p className="text-xs text-rose-600 font-medium">
                          {run.markedOverdueCount} prior bill(s) marked Overdue
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-brand-700">
                      {run.invoiceRangeStart
                        ? run.invoiceRangeEnd && run.invoiceRangeEnd !== run.invoiceRangeStart
                          ? `${run.invoiceRangeStart} → ${run.invoiceRangeEnd}`
                          : run.invoiceRangeStart
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#141918]">
                      {formatCurrency(run.totalBilledAmount)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-sky-600 font-medium">
                      {formatCurrency(run.totalAdvanceApplied)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-emerald-600">
                      {formatCurrency(run.netNewDueAmount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4A5452] whitespace-nowrap tabular-nums">
                      {formatDate(run.createdAt)} {formatTime(run.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmed Execution Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !runningBatch && setIsConfirmOpen(false)}
        title={`Confirm Monthly Billing — ${cycleLabel}`}
        subtitle="Dry-run preview verified. Review final summary before executing."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#F7FAFA] border border-[#D6E1DF] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#4A5452]">Eligible Active Subscribers</span>
              <span className="font-bold text-[#141918] tabular-nums">
                {eligibleCount} ({previewSummary?.eligibleRegularCount || 0} Regular +{' '}
                {previewSummary?.eligibleGstCount || 0} GST)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5452]">Base Subscription Charges</span>
              <span className="font-semibold text-[#141918] tabular-nums">
                {formatCurrency(previewSummary?.totalBaseAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5452]">GST Tax (CGST/SGST/IGST)</span>
              <span className="font-semibold text-brand-700 tabular-nums">
                {formatCurrency(previewSummary?.totalGstAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5452]">Advance Credit Auto-Deducted</span>
              <span className="font-semibold text-sky-600 tabular-nums">
                -{formatCurrency(previewSummary?.totalAdvanceApplied)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#D6E1DF] text-base">
              <span className="font-bold text-[#141918]">Net New Receivable</span>
              <span className="font-extrabold text-emerald-600 tabular-nums">
                {formatCurrency(previewSummary?.netNewDueAmount)}
              </span>
            </div>
            {previewSummary?.projectedInvoiceStart && (
              <p className="text-xs font-mono text-brand-700 pt-1">
                GST Invoices: {previewSummary.projectedInvoiceStart}
                {previewSummary.projectedInvoiceEnd !== previewSummary.projectedInvoiceStart
                  ? ` → ${previewSummary.projectedInvoiceEnd}`
                  : ''}
              </p>
            )}
          </div>

          <p className="text-xs text-[#4A5452] leading-relaxed">
            Unpaid bills from previous months will be automatically marked{' '}
            <span className="font-semibold text-rose-600">Overdue</span> and kept separately so
            receivables are never double-counted. Already-billed, suspended, and disconnected
            subscribers will be skipped.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              disabled={runningBatch}
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={runningBatch}
              onClick={handleRunBatchBilling}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              {runningBatch && <span className="loading loading-spinner loading-xs" />}
              <span>{runningBatch ? 'Generating Bills...' : `Confirm & Bill ${cycleLabel}`}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MonthlyBillingConsole;
