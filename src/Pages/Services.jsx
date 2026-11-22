import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'react-toastify';
import Layout from '../Components/Layout';
import Modal from '../Common/Modal';
import GstInvoicePrint from '../Components/GstInvoicePrint';
import AxiosService from '../Common/AxiosService';
import UseReloadHook from '../Hooks/UseReloadHook';
import { formatCurrency, formatDate, getStoredUser } from '../Common/authUtils';
import { FiTool, FiPlusCircle, FiTrash2, FiPrinter, FiSearch } from 'react-icons/fi';

const SERVICE_PRESETS = [
  { name: 'New Connection / Installation', hsn: '998422' },
  { name: 'Router / ONT Supply', hsn: '851762' },
  { name: 'Fiber Cable Laying', hsn: '998719' },
  { name: 'Connection Shifting', hsn: '998719' },
  { name: 'Static IP Setup', hsn: '998422' },
  { name: 'On-Site Support Visit', hsn: '998719' },
];

function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = getStoredUser()?.role === 'admin';
  const { customer = [] } = useSelector((state) => state.customer);
  const { customerReload, collectionReload } = UseReloadHook();

  const [services, setServices] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const [form, setForm] = useState({
    customerId: '',
    serviceName: '',
    description: '',
    hsnSac: '998422',
    amount: '',
    payNow: true,
    paymentMode: 'cash',
    transactionId: '',
    isGstApplicable: false,
    gstRate: 18,
  });

  const loadServices = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.paymentStatus = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await AxiosService.get('/service/list', { params });
      if (res.status === 200) {
        setServices(res.data.services || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load service charges');
      }
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    customerReload();
    loadServices();
  }, [customerReload, loadServices]);

  useEffect(() => {
    const cid = searchParams.get('customerId');
    if (cid && customer.length > 0) {
      const found = customer.find((c) => c._id === cid);
      if (found) {
        setForm((prev) => ({
          ...prev,
          customerId: found._id,
          isGstApplicable: Boolean(found.isGstCustomer),
          gstRate: found.gstRate ?? 18,
          hsnSac: found.hsnSac || '998422',
        }));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, customer]);

  const customerOptions = useMemo(
    () =>
      customer.map((c) => ({
        value: c._id,
        label: `${c.isGstCustomer ? '[GST] ' : ''}${c.name}${
          c.companyName ? ` (${c.companyName})` : ''
        } — ${c.mobile}`,
        raw: c,
      })),
    [customer]
  );

  const previewTotal = useMemo(() => {
    const base = Number(form.amount) || 0;
    const tax = form.isGstApplicable ? (base * (Number(form.gstRate) || 0)) / 100 : 0;
    return { base, tax, total: base + tax };
  }, [form.amount, form.isGstApplicable, form.gstRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) return toast.error('Select a customer');
    if (!form.serviceName.trim()) return toast.error('Enter a service name');
    if (!(Number(form.amount) > 0)) return toast.error('Enter a positive service amount');
    if (form.payNow && form.paymentMode === 'online' && !form.transactionId.trim()) {
      return toast.error('Enter Transaction ID for online payment');
    }

    setSaving(true);
    try {
      const res = await AxiosService.post('/service/add', {
        ...form,
        amount: Number(form.amount),
        gstRate: Number(form.gstRate) || 18,
      });
      toast.success(res?.data?.message || 'Service charge recorded');
      if (res?.data?.gstInvoice) {
        setPreviewInvoice(res.data.gstInvoice);
      }
      setForm((prev) => ({
        ...prev,
        serviceName: '',
        description: '',
        amount: '',
        transactionId: '',
      }));
      await Promise.allSettled([loadServices(), customerReload(), collectionReload()]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add service charge');
    } finally {
      setSaving(false);
    }
  };

  const handleViewInvoice = async (gstInvoiceId) => {
    try {
      const res = await AxiosService.get(`/gst/invoices/${gstInvoiceId}`);
      if (res.status === 200) {
        setPreviewInvoice(res.data.invoice);
      }
    } catch {
      toast.error('Unable to open GST invoice');
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await AxiosService.delete(`/service/${id}`);
      toast.success(res?.data?.message || 'Service removed');
      await Promise.allSettled([loadServices(), customerReload(), collectionReload()]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not remove service');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add Service Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D6E1DF] p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#E5ECEB]">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FiTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#141918]">Add Service Charge</h2>
              <p className="text-xs text-[#4A5452]">
                Records on customer history &amp; generates GST invoice if applicable.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1">Customer *</label>
              <Select
                options={customerOptions}
                isSearchable
                placeholder="Search customer..."
                value={customerOptions.find((o) => o.value === form.customerId) || null}
                onChange={(opt) => {
                  const c = opt?.raw;
                  setForm((p) => ({
                    ...p,
                    customerId: opt?.value || '',
                    isGstApplicable: Boolean(c?.isGstCustomer),
                    gstRate: c?.gstRate ?? 18,
                    hsnSac: c?.hsnSac || p.hsnSac,
                  }));
                }}
              />
            </div>

            {/* Quick Service Presets */}
            <div>
              <p className="text-xs font-semibold text-[#4A5452] mb-1.5">Quick Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, serviceName: preset.name, hsnSac: preset.hsn }))
                    }
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E5ECEB] hover:bg-brand-50 hover:text-brand-700 text-[#2A3331] transition cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Router Replacement"
                  value={form.serviceName}
                  onChange={(e) => setForm((p) => ({ ...p, serviceName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2A3331] mb-1">HSN/SAC</label>
                <input
                  type="text"
                  value={form.hsnSac}
                  onChange={(e) => setForm((p) => ({ ...p, hsnSac: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                Base Charge Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g., 500"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                Details / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Material used, technician notes, etc."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
              />
            </div>

            {/* GST Toggle */}
            <div className="p-3 rounded-xl bg-[#F7FAFA] border border-[#D6E1DF] space-y-2">
              <label className="flex items-center justify-between gap-2 text-xs font-semibold text-[#1E2524] cursor-pointer">
                <span>Apply GST &amp; Generate Sequential GST Invoice</span>
                <input
                  type="checkbox"
                  checked={form.isGstApplicable}
                  onChange={(e) => setForm((p) => ({ ...p, isGstApplicable: e.target.checked }))}
                  className="toggle toggle-sm toggle-primary"
                />
              </label>
              {form.isGstApplicable && (
                <div className="flex items-center justify-between text-xs text-[#4A5452] pt-1">
                  <span>GST Rate: {form.gstRate}% (Tax: {formatCurrency(previewTotal.tax)})</span>
                  <span className="font-bold text-brand-700 tabular-nums">
                    Total: {formatCurrency(previewTotal.total)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Timing */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, payNow: true }))}
                className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                  form.payNow
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-[#D6E1DF] text-[#4A5452]'
                }`}
              >
                Collect Payment Now
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, payNow: false }))}
                className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                  !form.payNow
                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                    : 'bg-white border-[#D6E1DF] text-[#4A5452]'
                }`}
              >
                Add to Customer Due
              </button>
            </div>

            {form.payNow && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm((p) => ({ ...p, paymentMode: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-[#C3D2CF] bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online / UPI</option>
                </select>
                {form.paymentMode === 'online' && (
                  <input
                    type="text"
                    required
                    placeholder="UPI / Txn ID"
                    value={form.transactionId}
                    onChange={(e) => setForm((p) => ({ ...p, transactionId: e.target.value }))}
                    className="px-3 py-2 text-sm rounded-xl border border-[#C3D2CF]"
                  />
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlusCircle className="w-4 h-4" />
              <span>
                {saving
                  ? 'Recording...'
                  : `Record Service (${formatCurrency(previewTotal.total)})`}
              </span>
            </button>
          </form>
        </div>

        {/* Service History List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5ECEB] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#141918]">Service Charges Ledger</h3>
              <span className="text-xs text-[#4A5452]">{services.length} record(s)</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <FiSearch className="w-4 h-4 text-[#596361] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search service, customer, or invoice no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D6E1DF] bg-[#F7FAFA] focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#D6E1DF] bg-white"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending Due</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F7FAFA] border-b border-[#D6E1DF]">
                <tr className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                  <th className="py-3 px-4">Customer &amp; Service</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEB] text-sm">
                {loadingList ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <span className="loading loading-spinner loading-md text-brand-600" />
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[#4A5452] text-sm">
                      No service charges recorded yet.
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr key={svc._id} className="hover:bg-[#F7FAFA]">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#141918]">{svc.serviceName}</p>
                        <p className="text-xs text-[#4A5452]">
                          {svc.customerId?.name || 'Customer'} ({svc.customerId?.mobile || '—'})
                        </p>
                        {svc.invoiceNumber && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono text-xs font-bold">
                            {svc.invoiceNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4A5452] whitespace-nowrap">
                        <p>{formatDate(svc.serviceDate)}</p>
                        <p className="text-[#596361]">By {svc.recordedBy?.userName || 'Staff'}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-[#141918]">
                        {formatCurrency(svc.totalAmount)}
                        {svc.isGstApplicable && (
                          <p className="text-xs font-normal text-[#596361]">
                            incl. {svc.gstRate}% GST
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            svc.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {svc.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {svc.gstInvoiceId && (
                            <button
                              type="button"
                              onClick={() => handleViewInvoice(svc.gstInvoiceId)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E5ECEB] hover:bg-[#D6E1DF] text-[#2A3331] text-xs font-semibold cursor-pointer"
                            >
                              <FiPrinter className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          )}
                          {isAdmin && svc.paymentStatus === 'Pending' && !svc.gstInvoiceId && (
                            <button
                              type="button"
                              disabled={deletingId === svc._id}
                              onClick={() => handleDelete(svc._id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <FiTrash2 className="w-4 h-4" />
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
      </div>

      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title="Service GST Tax Invoice"
        maxWidth="max-w-4xl"
      >
        <GstInvoicePrint invoice={previewInvoice} />
      </Modal>
    </Layout>
  );
}

export default Services;
