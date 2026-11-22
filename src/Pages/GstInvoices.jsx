import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import Select from 'react-select';
import Layout from '../Components/Layout';
import Modal from '../Common/Modal';
import GstInvoicePrint from '../Components/GstInvoicePrint';
import AxiosService from '../Common/AxiosService';
import UseReloadHook from '../Hooks/UseReloadHook';
import { formatCurrency, formatDate, getMonthName, getStoredUser } from '../Common/authUtils';
import {
  FiPlus,
  FiDownload,
  FiSettings,
  FiPrinter,
  FiCreditCard,
  FiXCircle,
  FiTrash2,
  FiSearch,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiPlay,
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

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#0f6b66' : '#c3d2cf',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(15, 107, 102, 0.16)' : 'none',
    '&:hover': { borderColor: '#0f6b66' },
    fontSize: '0.875rem',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    zIndex: 30,
    fontSize: '0.875rem',
  }),
};

function GstInvoices() {
  const isAdmin = getStoredUser()?.role === 'admin';
  const { customer = [] } = useSelector((state) => state.customer);
  const { customerReload, collectionReload } = UseReloadHook();

  const now = new Date();
  const [activeTab, setActiveTab] = useState('monthly');

  // Register state
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [availableFYs, setAvailableFYs] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [fyFilter, setFyFilter] = useState('all');
  const [regMonthFilter, setRegMonthFilter] = useState('all');
  const [regYearFilter, setRegYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Monthly GST Customer Status Tracker state
  const [trackerMonth, setTrackerMonth] = useState(now.getMonth() + 1);
  const [trackerYear, setTrackerYear] = useState(now.getFullYear());
  const [trackerFilter, setTrackerFilter] = useState('all');
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerSummary, setTrackerSummary] = useState(null);
  const [trackerRows, setTrackerRows] = useState([]);
  const [loadingTracker, setLoadingTracker] = useState(true);
  const [generatingAllMissing, setGeneratingAllMissing] = useState(false);
  const [generatingRowId, setGeneratingRowId] = useState(null);

  // Print preview modal
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Create manual invoice modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInv, setNewInv] = useState({
    customerId: '',
    invoiceType: 'monthly',
    invoiceDate: new Date().toISOString().slice(0, 10),
    gstRate: 18,
    items: [{ particulars: 'Bandwidth Charges', hsnSac: '998422', quantity: 1, rate: '' }],
  });

  // Payment modal
  const [payInvoice, setPayInvoice] = useState(null);
  const [payForm, setPayForm] = useState({
    amountPaid: '',
    paymentMode: 'online',
    transactionId: '',
  });
  const [paying, setPaying] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [settingsMeta, setSettingsMeta] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  const yearOptions = useMemo(() => {
    const yr = new Date().getFullYear();
    return [yr - 2, yr - 1, yr, yr + 1];
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fyFilter !== 'all') params.fy = fyFilter;
      if (regMonthFilter !== 'all') params.month = Number(regMonthFilter);
      if (regYearFilter !== 'all') params.year = Number(regYearFilter);
      if (statusFilter !== 'all') params.paymentStatus = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await AxiosService.get('/gst/invoices', { params });
      if (res.status === 200) {
        setInvoices(res.data.invoices || []);
        setSummary(res.data.summary || {});
        setAvailableFYs(res.data.availableFYs || []);
        setAvailableMonths(res.data.availableMonths || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load GST invoices');
      }
    } finally {
      setLoading(false);
    }
  }, [fyFilter, regMonthFilter, regYearFilter, statusFilter, search]);

  const loadMonthlyStatus = useCallback(
    async (m = trackerMonth, y = trackerYear) => {
      setLoadingTracker(true);
      try {
        const res = await AxiosService.get('/gst/monthly-status', {
          params: { month: m, year: y },
        });
        if (res.status === 200) {
          setTrackerSummary(res.data.summary || null);
          setTrackerRows(res.data.rows || []);
        }
      } catch (error) {
        if (error?.response?.status !== 401) {
          toast.error(error?.response?.data?.message || 'Failed to load monthly GST billing status');
        }
      } finally {
        setLoadingTracker(false);
      }
    },
    [trackerMonth, trackerYear]
  );

  const loadSettings = useCallback(async () => {
    try {
      const res = await AxiosService.get('/gst/settings');
      if (res.status === 200) {
        setSettingsForm({
          ...res.data.settings,
          currentSequence: res.data.currentSequence ?? 0,
        });
        setSettingsMeta({
          currentFinancialYear: res.data.currentFinancialYear,
          nextInvoicePreview: res.data.nextInvoicePreview,
        });
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadSettings();
    customerReload();
  }, [loadInvoices, loadSettings, customerReload]);

  useEffect(() => {
    loadMonthlyStatus(trackerMonth, trackerYear);
  }, [loadMonthlyStatus, trackerMonth, trackerYear]);

  const refreshAllGstViews = useCallback(async () => {
    await Promise.allSettled([
      loadInvoices(),
      loadMonthlyStatus(trackerMonth, trackerYear),
      loadSettings(),
      collectionReload(),
      customerReload(),
    ]);
  }, [
    loadInvoices,
    loadMonthlyStatus,
    trackerMonth,
    trackerYear,
    loadSettings,
    collectionReload,
    customerReload,
  ]);

  const filteredTrackerRows = useMemo(() => {
    const q = trackerSearch.trim().toLowerCase();
    return trackerRows.filter((row) => {
      if (trackerFilter === 'not_generated' && row.billingStatus !== 'not_generated') return false;
      if (trackerFilter === 'generated' && row.billingStatus !== 'generated') return false;
      if (
        trackerFilter === 'inactive' &&
        row.billingStatus !== 'inactive' &&
        row.billingStatus !== 'no_plan'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        String(row.companyName || '').toLowerCase().includes(q) ||
        String(row.contactName || '').toLowerCase().includes(q) ||
        String(row.gstin || '').toLowerCase().includes(q) ||
        String(row.mobile || '').toLowerCase().includes(q) ||
        String(row.invoice?.invoiceNumber || '').toLowerCase().includes(q)
      );
    });
  }, [trackerRows, trackerFilter, trackerSearch]);

  const handleGenerateSingleGstBill = async (row) => {
    setGeneratingRowId(row.customerId);
    try {
      const res = await AxiosService.post(`/collection/generate-customer-bill/${row.customerId}`, {
        month: trackerMonth,
        year: trackerYear,
      });
      toast.success(
        res?.data?.message ||
          `Generated ${getMonthName(trackerMonth, trackerYear)} GST invoice for ${row.companyName}`
      );
      await refreshAllGstViews();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate GST invoice');
    } finally {
      setGeneratingRowId(null);
    }
  };

  const handleGenerateAllMissingGst = async () => {
    setGeneratingAllMissing(true);
    try {
      const res = await AxiosService.post('/gst/generate-missing', {
        month: trackerMonth,
        year: trackerYear,
      });
      toast.success(
        res?.data?.message ||
          `Generated missing GST bills for ${getMonthName(trackerMonth, trackerYear)}`
      );
      await refreshAllGstViews();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate missing GST bills');
    } finally {
      setGeneratingAllMissing(false);
    }
  };

  const handleOpenInvoicePdfById = async (invoiceId) => {
    try {
      const res = await AxiosService.get(`/gst/invoices/${invoiceId}`);
      if (res.status === 200) setPreviewInvoice(res.data.invoice);
    } catch {
      toast.error('Failed to load GST invoice details');
    }
  };

  const customerOptions = useMemo(() => {
    const sorted = [...customer].sort((a, b) => Number(b.isGstCustomer) - Number(a.isGstCustomer));
    return sorted.map((c) => ({
      value: c._id,
      label: `${c.isGstCustomer ? '[GST] ' : ''}${c.companyName || c.name}${
        c.gstin ? ` (${c.gstin})` : ''
      } — ${c.mobile}`,
      raw: c,
    }));
  }, [customer]);

  const selectedCustomerObj = useMemo(
    () => customer.find((c) => c._id === newInv.customerId) || null,
    [customer, newInv.customerId]
  );

  const livePreviewTotals = useMemo(() => {
    const taxable = newInv.items.reduce(
      (sum, it) => sum + Math.max(1, Number(it.quantity) || 1) * (Number(it.rate) || 0),
      0
    );
    const rate = Number(newInv.gstRate) || 0;
    const tax = (taxable * rate) / 100;
    return { taxable, tax, grand: taxable + tax };
  }, [newInv.items, newInv.gstRate]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newInv.customerId) return toast.error('Select a customer');

    const formattedItems = newInv.items.map((it) => ({
      particulars: it.particulars.trim(),
      hsnSac: it.hsnSac.trim() || '998422',
      quantity: Math.max(1, Number(it.quantity) || 1),
      rate: Number(it.rate) || 0,
      amount: Math.max(1, Number(it.quantity) || 1) * (Number(it.rate) || 0),
    }));

    if (formattedItems.some((it) => !it.particulars || it.amount <= 0)) {
      return toast.error('Each line item must have a description and positive rate');
    }

    setCreating(true);
    try {
      const res = await AxiosService.post('/gst/invoices', {
        customerId: newInv.customerId,
        invoiceType: newInv.invoiceType,
        invoiceDate: newInv.invoiceDate,
        gstRate: Number(newInv.gstRate),
        items: formattedItems,
        addToCollection: true,
      });
      toast.success(res?.data?.message || 'GST Invoice created');
      setIsCreateOpen(false);
      setPreviewInvoice(res.data.invoice);
      await refreshAllGstViews();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create GST invoice');
    } finally {
      setCreating(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payInvoice) return;
    setPaying(true);
    try {
      const res = await AxiosService.put(`/gst/invoices/${payInvoice._id}/payment`, {
        amountPaid: Number(payForm.amountPaid),
        paymentMode: payForm.paymentMode,
        transactionId: payForm.paymentMode === 'online' ? payForm.transactionId.trim() : null,
      });
      toast.success(res?.data?.message || 'Payment recorded');
      setPayInvoice(null);
      await refreshAllGstViews();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  };

  const handleCancelInvoice = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await AxiosService.put(`/gst/invoices/${cancelTarget._id}/cancel`, {
        reason: cancelReason.trim(),
      });
      toast.success(res?.data?.message || 'Invoice cancelled');
      setCancelTarget(null);
      setCancelReason('');
      await refreshAllGstViews();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await AxiosService.put('/gst/settings', settingsForm);
      toast.success(res?.data?.message || 'Settings updated');
      setSettingsMeta({
        currentFinancialYear: res.data.currentFinancialYear,
        nextInvoicePreview: res.data.nextInvoicePreview,
      });
      setIsSettingsOpen(false);
      await loadMonthlyStatus(trackerMonth, trackerYear);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadAuditExcel = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (fyFilter !== 'all') params.fy = fyFilter;
      if (regMonthFilter !== 'all') params.month = Number(regMonthFilter);
      if (regYearFilter !== 'all') params.year = Number(regYearFilter);

      const res = await AxiosService.get('/gst/download-audit-excel', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileLabel =
        regMonthFilter !== 'all' && regYearFilter !== 'all'
          ? `GST_Audit_${getMonthName(regMonthFilter, regYearFilter).replace(/\s+/g, '_')}.xlsx`
          : fyFilter !== 'all'
            ? `GST_Audit_FY_${fyFilter}.xlsx`
            : 'GST_Audit_Report.xlsx';
      saveAs(blob, fileLabel);
      toast.success('GST Audit Excel downloaded (GSTR-1 + HSN + Monthly + Customers)');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No GST data found to export');
    } finally {
      setDownloading(false);
    }
  };

  const addLineItem = () => {
    setNewInv((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { particulars: '', hsnSac: selectedCustomerObj?.hsnSac || '998422', quantity: 1, rate: '' },
      ],
    }));
  };

  const updateLineItem = (idx, field, val) => {
    setNewInv((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [field]: val } : it)),
    }));
  };

  const removeLineItem = (idx) => {
    setNewInv((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const missingCount = trackerSummary?.notGeneratedCount || 0;
  const trackerPeriodName = getMonthName(trackerMonth, trackerYear);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Unified Hairline KPI Strip */}
        <section className="bg-white rounded-2xl border border-[#D6E1DF] grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#D6E1DF]">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
              Active Invoices
            </p>
            <p className="font-display text-2xl font-extrabold text-[#141918] tabular-nums mt-1">
              {summary.totalInvoices || 0}
            </p>
            <p className="text-xs font-mono text-brand-700 font-semibold mt-1 truncate">
              Next: {settingsMeta.nextInvoicePreview || '—'}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
              Taxable Value
            </p>
            <p className="font-display text-2xl font-extrabold text-[#141918] tabular-nums mt-1">
              {formatCurrency(summary.totalTaxable)}
            </p>
            <p className="text-xs text-[#596361] mt-1">Base supply value</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
              Total GST Tax
            </p>
            <p className="font-display text-2xl font-extrabold text-brand-700 tabular-nums mt-1">
              {formatCurrency(summary.totalTax)}
            </p>
            <p className="text-xs text-[#596361] tabular-nums mt-1">
              C: {formatCurrency(summary.totalCgst)} • S: {formatCurrency(summary.totalSgst)}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
              GST Collected
            </p>
            <p className="font-display text-2xl font-extrabold text-[#157347] tabular-nums mt-1">
              {formatCurrency(summary.totalPaid)}
            </p>
            <p className="text-xs text-[#596361] mt-1">Paid tax invoices</p>
          </div>
          <div className="p-4 sm:p-5 col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
              Balance Due
            </p>
            <p className="font-display text-2xl font-extrabold text-[#B91C1C] tabular-nums mt-1">
              {formatCurrency(summary.totalPending)}
            </p>
            <p className="text-xs text-[#596361] mt-1">Pending GST receivables</p>
          </div>
        </section>

        {/* Actionable Missing GST Bills Alert Banner */}
        {!loadingTracker && missingCount > 0 && (
          <div className="rounded-2xl bg-[#FEF6E7] border border-[#F2D59B] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B45309] text-white flex items-center justify-center shrink-0">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold text-[#141918]">
                  {missingCount} active GST customer{missingCount > 1 ? 's' : ''} not yet billed
                  for {trackerPeriodName}
                </p>
                <p className="text-xs text-[#5C3409] mt-0.5 tabular-nums">
                  Projected missing GST billing value:{' '}
                  <strong>{formatCurrency(trackerSummary?.projectedMissingValue)}</strong>. Generate
                  individual bills or run all missing GST buyers below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeTab !== 'monthly' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('monthly');
                    setTrackerFilter('not_generated');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#E2BA6F] text-[#7A3803] text-xs font-bold hover:bg-[#FFFBF2] cursor-pointer"
                >
                  View Missing ({missingCount})
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  disabled={generatingAllMissing}
                  onClick={handleGenerateAllMissingGst}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                >
                  <FiPlay className="w-3.5 h-3.5" />
                  <span>
                    {generatingAllMissing
                      ? 'Generating...'
                      : `Generate All Missing (${missingCount})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Tab Navigation + Admin Actions */}
        <div className="bg-white rounded-2xl border border-[#D6E1DF] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
              }`}
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Monthly GST Status</span>
              {missingCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                    activeTab === 'monthly'
                      ? 'bg-white text-brand-800'
                      : 'bg-[#FDF0EF] text-[#B91C1C]'
                  }`}
                >
                  {missingCount} Pending
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Invoice Register ({invoices.length})</span>
            </button>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C3D2CF] bg-white hover:bg-[#F7FAFA] text-[#2A3331] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <FiSettings className="w-4 h-4" />
                <span>FY Settings</span>
              </button>
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadAuditExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#BBE2CC] bg-[#EAF6EF] hover:bg-[#D8EFE2] text-[#157347] text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                <FiDownload className="w-4 h-4" />
                <span>{downloading ? 'Exporting...' : 'GSTR-1 Excel'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Custom GST Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: MONTHLY GST CUSTOMER STATUS TRACKER (Generated vs Not Generated!) */}
        {activeTab === 'monthly' && (
          <div className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
            {/* Tracker Controls */}
            <div className="p-4 sm:p-5 border-b border-[#E5ECEB] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#141918]">
                    GST Customer Billing Tracker — {trackerPeriodName}
                  </h2>
                  <p className="text-xs text-[#4A5452] mt-0.5">
                    {trackerSummary?.generatedCount || 0} Generated •{' '}
                    <span className="font-bold text-[#B91C1C]">
                      {missingCount} Not Generated
                    </span>{' '}
                    • {trackerSummary?.inactiveCount || 0} Paused/Disconnected
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={trackerMonth}
                    onChange={(e) => setTrackerMonth(Number(e.target.value))}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#141918] cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={trackerYear}
                    onChange={(e) => setTrackerYear(Number(e.target.value))}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#141918] tabular-nums cursor-pointer"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={loadingTracker}
                    onClick={() => loadMonthlyStatus(trackerMonth, trackerYear)}
                    className="p-2 rounded-xl border border-[#C3D2CF] bg-white hover:bg-[#F7FAFA] text-[#2A3331] cursor-pointer"
                    title="Refresh status"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loadingTracker ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="w-4 h-4 text-[#596361] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search company, GSTIN, mobile, or invoice #..."
                    value={trackerSearch}
                    onChange={(e) => setTrackerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#C3D2CF] bg-[#F7FAFA] focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'all', label: `All (${trackerRows.length})` },
                    { key: 'not_generated', label: `Not Generated (${missingCount})` },
                    {
                      key: 'generated',
                      label: `Generated (${trackerSummary?.generatedCount || 0})`,
                    },
                    {
                      key: 'inactive',
                      label: `Paused / No Plan (${
                        (trackerSummary?.inactiveCount || 0) + (trackerSummary?.noPlanCount || 0)
                      })`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setTrackerFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        trackerFilter === tab.key
                          ? 'bg-brand-600 text-white'
                          : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly GST Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                    <th className="py-3 px-4">GST Buyer &amp; GSTIN</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-right">Taxable</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4">{trackerPeriodName} Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEB] text-sm">
                  {loadingTracker ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <span className="loading loading-spinner loading-md text-brand-600" />
                      </td>
                    </tr>
                  ) : filteredTrackerRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-[#4A5452]">
                        No GST customers match this filter. Mark any subscriber as a GST Customer to
                        track them here.
                      </td>
                    </tr>
                  ) : (
                    filteredTrackerRows.map((row) => {
                      const isMissing = row.billingStatus === 'not_generated';
                      const isGenerated = row.billingStatus === 'generated';
                      const isBusy = generatingRowId === row.customerId;

                      return (
                        <tr
                          key={row.customerId}
                          className={`transition-colors ${
                            isMissing ? 'bg-[#FFFBF2] hover:bg-[#FEF6E7]/70' : 'hover:bg-[#F7FAFA]'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#141918]">{row.companyName}</p>
                            <p className="text-xs font-mono text-[#4A5452] mt-0.5">
                              {row.gstin || 'No GSTIN'} • State {row.stateCode}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-semibold text-[#1E2524]">{row.planName}</p>
                            {row.planSpeed && (
                              <p className="text-[#596361]">{row.planSpeed} Mbps</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-[#2A3331]">
                            {formatCurrency(row.baseAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-xs text-[#4A5452]">
                            <p className="font-semibold text-[#141918]">
                              {formatCurrency(row.taxAmount)}
                            </p>
                            <p className="text-[#596361]">
                              {row.isInterState ? `IGST ${row.gstRate}%` : `C+S ${row.gstRate}%`}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#141918]">
                            {formatCurrency(isGenerated ? row.invoice.grandTotal : row.grandTotal)}
                          </td>
                          <td className="py-3.5 px-4">
                            {isMissing ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDF0EF] text-[#B91C1C] border border-[#F3C5C2]">
                                <FiAlertTriangle className="w-3.5 h-3.5" />
                                <span>Not Generated</span>
                              </span>
                            ) : isGenerated ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF6EF] text-[#157347] border border-[#BBE2CC]">
                                  <FiCheckCircle className="w-3.5 h-3.5" />
                                  <span>Generated</span>
                                </span>
                                <p className="text-xs font-mono font-bold text-brand-700">
                                  {row.invoice.invoiceNumber}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E5ECEB] text-[#4A5452] border border-[#C3D2CF] capitalize">
                                {row.billingStatus === 'no_plan' ? 'No Plan' : row.customerStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isMissing && isAdmin ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleGenerateSingleGstBill(row)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                              >
                                <FiPlus className="w-3.5 h-3.5" />
                                <span>{isBusy ? 'Generating...' : 'Generate GST Bill'}</span>
                              </button>
                            ) : isGenerated ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoicePdfById(row.invoice._id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E5ECEB] hover:bg-[#D6E1DF] text-[#141918] text-xs font-semibold cursor-pointer"
                                >
                                  <FiPrinter className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>
                                {Number(row.invoice.balanceDue) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPayInvoice(row.invoice);
                                      setPayForm({
                                        amountPaid: String(row.invoice.balanceDue),
                                        paymentMode: 'online',
                                        transactionId: '',
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold cursor-pointer"
                                  >
                                    <FiCreditCard className="w-3.5 h-3.5" />
                                    <span>Collect</span>
                                  </button>
                                )}
                              </div>
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
          </div>
        )}

        {/* TAB 2: FULL GST INVOICE REGISTER (Polished Layout & Month-Wise Filter) */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E5ECEB] space-y-3.5">
              {/* Quick Month-Wise Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4A5452] mr-1">
                  Month Filter:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegMonthFilter('all');
                    setRegYearFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    regMonthFilter === 'all' && regYearFilter === 'all'
                      ? 'bg-brand-600 text-white'
                      : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
                  }`}
                >
                  All Months
                </button>
                {availableMonths.slice(0, 8).map((m) => {
                  const isActive =
                    Number(regMonthFilter) === m.month && Number(regYearFilter) === m.year;
                  return (
                    <button
                      key={`${m.year}-${m.month}`}
                      type="button"
                      onClick={() => {
                        setRegMonthFilter(String(m.month));
                        setRegYearFilter(String(m.year));
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
                      }`}
                    >
                      <span>{getMonthName(m.month, m.year)}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-[#2A3331]'
                        }`}
                      >
                        {m.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search + FY / Month / Year / Status Dropdowns */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                <div className="relative flex-1">
                  <FiSearch className="w-4 h-4 text-[#596361] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search invoice no, buyer company, or GSTIN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#C3D2CF] bg-[#F7FAFA] focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={fyFilter}
                    onChange={(e) => setFyFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#2A3331]"
                  >
                    <option value="all">All Financial Years</option>
                    {availableFYs.map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy}
                      </option>
                    ))}
                  </select>

                  <select
                    value={regMonthFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegMonthFilter(val);
                      if (val !== 'all' && regYearFilter === 'all') {
                        setRegYearFilter(String(new Date().getFullYear()));
                      }
                    }}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#2A3331]"
                  >
                    <option value="all">All Months</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={String(m.value)}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={regYearFilter}
                    onChange={(e) => setRegYearFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#2A3331] tabular-nums"
                  >
                    <option value="all">All Years</option>
                    {yearOptions.map((yr) => (
                      <option key={yr} value={String(yr)}>
                        {yr}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#2A3331]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Buyer &amp; GSTIN</th>
                    <th className="py-3 px-4 text-right">Taxable</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEB] text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <span className="loading loading-spinner loading-md text-brand-600" />
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#4A5452] text-sm">
                        No GST invoices match these filters.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr
                        key={inv._id}
                        className={`hover:bg-[#F7FAFA] ${inv.isCancelled ? 'opacity-65 bg-[#FDF0EF]/40' : ''}`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block font-mono font-bold text-xs text-brand-800 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg">
                            {inv.invoiceNumber}
                          </span>
                          <p className="text-xs text-[#596361] mt-1 capitalize">
                            {inv.invoiceType} • FY {inv.financialYear}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#4A5452]">
                          {formatDate(inv.invoiceDate)}
                        </td>
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <p className="font-semibold text-[#141918]">
                            {inv.buyer?.companyName || inv.buyer?.contactName}
                          </p>
                          <p className="text-xs font-mono text-[#596361] mt-0.5">
                            {inv.buyer?.gstin || 'No GSTIN'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#2A3331] whitespace-nowrap">
                          {formatCurrency(inv.taxableValue)}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-xs text-[#4A5452] whitespace-nowrap">
                          <p className="font-semibold text-[#141918]">
                            {formatCurrency(inv.totalTax)}
                          </p>
                          <p className="text-[#596361]">
                            {inv.isInterState ? `IGST ${inv.igstRate}%` : `C+S ${inv.gstRate}%`}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#141918] whitespace-nowrap">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-[#B91C1C] whitespace-nowrap">
                          {formatCurrency(inv.balanceDue)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv.isCancelled ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF0EF] text-[#B91C1C] border border-[#F3C5C2]">
                              Cancelled
                            </span>
                          ) : (
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                inv.paymentStatus === 'Paid'
                                  ? 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]'
                                  : inv.paymentStatus === 'Partial'
                                    ? 'bg-[#EDF6FC] text-[#0369A1] border-[#BAE0F5]'
                                    : 'bg-[#FEF6E7] text-[#B45309] border-[#F2D59B]'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewInvoice(inv)}
                              title="View & Print Tax Invoice"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E5ECEB] hover:bg-[#D6E1DF] text-[#141918] text-xs font-semibold cursor-pointer"
                            >
                              <FiPrinter className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            {!inv.isCancelled && inv.balanceDue > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPayInvoice(inv);
                                  setPayForm({
                                    amountPaid: String(inv.balanceDue),
                                    paymentMode: 'online',
                                    transactionId: '',
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold cursor-pointer"
                              >
                                <FiCreditCard className="w-3.5 h-3.5" />
                                <span>Collect</span>
                              </button>
                            )}

                            {isAdmin && !inv.isCancelled && Number(inv.amountPaid) === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelTarget(inv);
                                  setCancelReason('');
                                }}
                                title="Cancel Invoice"
                                className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#FDF0EF] cursor-pointer"
                              >
                                <FiXCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Print / PDF Preview Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title="GST Tax Invoice"
        maxWidth="max-w-4xl"
      >
        <GstInvoicePrint invoice={previewInvoice} />
      </Modal>

      {/* Create Custom GST Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !creating && setIsCreateOpen(false)}
        title="Create GST Tax Invoice"
        subtitle={`Next sequential number: ${settingsMeta.nextInvoicePreview || ''}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1">
              Select Customer (GST buyers listed first) *
            </label>
            <Select
              options={customerOptions}
              styles={selectStyles}
              isSearchable
              placeholder="Search customer or GSTIN..."
              value={customerOptions.find((o) => o.value === newInv.customerId) || null}
              onChange={(opt) => {
                const c = opt?.raw;
                const planAmt = typeof c?.planId === 'object' ? c.planId?.amount : '';
                setNewInv((prev) => ({
                  ...prev,
                  customerId: opt?.value || '',
                  gstRate: c?.gstRate ?? 18,
                  items: [
                    {
                      particulars: 'Bandwidth Charges',
                      hsnSac: c?.hsnSac || '998422',
                      quantity: 1,
                      rate: planAmt || prev.items[0]?.rate || '',
                    },
                  ],
                }));
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A3331] mb-1">Invoice Type</label>
              <select
                value={newInv.invoiceType}
                onChange={(e) => setNewInv((p) => ({ ...p, invoiceType: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] bg-white"
              >
                <option value="monthly">Monthly Subscription</option>
                <option value="service">Service Charge</option>
                <option value="custom">Custom Invoice</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A3331] mb-1">Invoice Date</label>
              <input
                type="date"
                value={newInv.invoiceDate}
                onChange={(e) => setNewInv((p) => ({ ...p, invoiceDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A3331] mb-1">GST Rate (%)</label>
              <select
                value={newInv.gstRate}
                onChange={(e) => setNewInv((p) => ({ ...p, gstRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] bg-white"
              >
                <option value={18}>18% (9% CGST + 9% SGST)</option>
                <option value={12}>12% (6% + 6%)</option>
                <option value={5}>5% (2.5% + 2.5%)</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4A5452]">
                Line Items
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs font-semibold text-brand-700 hover:underline cursor-pointer"
              >
                + Add Line Item
              </button>
            </div>

            {newInv.items.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-[#F7FAFA] border border-[#D6E1DF]"
              >
                <input
                  type="text"
                  placeholder="Particulars (e.g., Bandwidth Charges)"
                  value={it.particulars}
                  onChange={(e) => updateLineItem(idx, 'particulars', e.target.value)}
                  className="col-span-5 px-2.5 py-1.5 text-xs rounded-lg border border-[#C3D2CF] bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="HSN/SAC"
                  value={it.hsnSac}
                  onChange={(e) => updateLineItem(idx, 'hsnSac', e.target.value)}
                  className="col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-[#C3D2CF] bg-white font-mono"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={it.quantity}
                  onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                  className="col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-[#C3D2CF] bg-white"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Rate ₹"
                  value={it.rate}
                  onChange={(e) => updateLineItem(idx, 'rate', e.target.value)}
                  className="col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-[#C3D2CF] bg-white tabular-nums"
                  required
                />
                <div className="col-span-1 text-right">
                  {newInv.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="p-1 text-[#B91C1C] hover:bg-[#FDF0EF] rounded cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 text-xs space-y-1">
            <div className="flex justify-between text-[#4A5452]">
              <span>Taxable Value</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(livePreviewTotals.taxable)}
              </span>
            </div>
            <div className="flex justify-between text-[#4A5452]">
              <span>GST ({newInv.gstRate}%)</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(livePreviewTotals.tax)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-brand-900 pt-1 border-t border-brand-200">
              <span>Invoice Grand Total</span>
              <span className="tabular-nums">{formatCurrency(livePreviewTotals.grand)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
            >
              {creating ? 'Generating...' : 'Generate Tax Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment on GST Invoice Modal */}
      <Modal
        isOpen={Boolean(payInvoice)}
        onClose={() => !paying && setPayInvoice(null)}
        title="Record GST Invoice Payment"
        subtitle={`${payInvoice?.invoiceNumber} • Balance Due: ${formatCurrency(
          payInvoice?.balanceDue
        )}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1">
              Amount Received (₹) *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={payForm.amountPaid}
              onChange={(e) => setPayForm((p) => ({ ...p, amountPaid: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] tabular-nums"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1">Payment Mode</label>
            <select
              value={payForm.paymentMode}
              onChange={(e) => setPayForm((p) => ({ ...p, paymentMode: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white"
            >
              <option value="online">Online / NEFT / RTGS / UPI</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          {payForm.paymentMode === 'online' && (
            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1">
                UTR / Transaction Reference *
              </label>
              <input
                type="text"
                required
                placeholder="Enter NEFT/UPI/Cheque reference"
                value={payForm.transactionId}
                onChange={(e) => setPayForm((p) => ({ ...p, transactionId: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF]"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={() => setPayInvoice(null)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paying}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold cursor-pointer"
            >
              {paying ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Invoice Modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        title="Cancel GST Invoice"
        subtitle={`${cancelTarget?.invoiceNumber} (sequence stays intact for GST audit)`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCancelInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g., Wrong billing period or duplicate invoice"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={cancelling}
              className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold cursor-pointer"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Company & FY Sequence Settings Modal */}
      <Modal
        isOpen={isSettingsOpen && Boolean(settingsForm)}
        onClose={() => !savingSettings && setIsSettingsOpen(false)}
        title="Company GST & Invoice Sequence Settings"
        subtitle={`Active Financial Year: ${settingsMeta.currentFinancialYear || ''} (Resets to 001 on April 1)`}
        maxWidth="max-w-2xl"
      >
        {settingsForm && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-900 mb-1">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={settingsForm.invoicePrefix || ''}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, invoicePrefix: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-900 mb-1">
                  Last Issued Seq No (FY {settingsMeta.currentFinancialYear})
                </label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.currentSequence ?? 0}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, currentSequence: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-200 bg-white tabular-nums"
                />
                <p className="text-xs text-brand-700 mt-1">
                  Next invoice will be #{Number(settingsForm.currentSequence || 0) + 1}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settingsForm.companyName || ''}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, companyName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Company GSTIN
                </label>
                <input
                  type="text"
                  value={settingsForm.gstin || ''}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Company PAN
                </label>
                <input
                  type="text"
                  value={settingsForm.pan || ''}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Contact &amp; Email
                </label>
                <input
                  type="text"
                  value={settingsForm.contact || ''}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, contact: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settingsForm.bankName || ''}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, bankName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settingsForm.accountNumber || ''}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, accountNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Branch &amp; IFSC Code
                </label>
                <input
                  type="text"
                  value={settingsForm.branchAndIfsc || ''}
                  onChange={(e) =>
                    setSettingsForm((p) => ({ ...p, branchAndIfsc: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold cursor-pointer"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}

export default GstInvoices;
