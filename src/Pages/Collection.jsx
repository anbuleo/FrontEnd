import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Layout from '../Components/Layout';
import { useSelector } from 'react-redux';
import AxiosService from '../Common/AxiosService';
import UseReloadHook from '../Hooks/UseReloadHook';
import Modal from '../Common/Modal';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { formatCurrency, formatDate, getMonthName, getStoredUser } from '../Common/authUtils';
import {
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiRotateCcw,
  FiSearch,
  FiSmartphone,
} from 'react-icons/fi';

const STATUS_TABS = [
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Paid', label: 'Paid' },
  { key: 'all', label: 'All' },
];

function Collection() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('unpaid');
  const [billToReverse, setBillToReverse] = useState(null);
  const [reverseAmount, setReverseAmount] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const isAdmin = getStoredUser()?.role === 'admin';
  const { collectionReload, customerReload, reloadCollectionreports } = UseReloadHook();
  const { collection = [] } = useSelector((state) => state.collection);

  useEffect(() => {
    collectionReload();
  }, [collectionReload]);

  const formik = useFormik({
    initialValues: {
      collectionId: '',
      amountPaid: '',
      paymentMode: 'cash',
      transactionId: '',
    },
    validationSchema: Yup.object({
      collectionId: Yup.string().required('Please select a pending bill'),
      amountPaid: Yup.number()
        .typeError('Enter a valid amount')
        .positive('Amount must be greater than 0')
        .required('Amount is required'),
      paymentMode: Yup.string().oneOf(['cash', 'online'], 'Invalid payment mode'),
      transactionId: Yup.string().when('paymentMode', ([paymentMode], schema) =>
        paymentMode === 'online'
          ? schema.trim().required('Transaction ID is required for online payments')
          : schema.notRequired()
      ),
    }),
    onSubmit: async (values, { resetForm }) => {
      setIsLoading(true);
      try {
        const res = await AxiosService.put('/collection/payment', {
          collectionId: values.collectionId,
          amountPaid: Number(values.amountPaid),
          paymentMode: values.paymentMode,
          transactionId: values.paymentMode === 'online' ? values.transactionId.trim() : null,
        });
        toast.success(res?.data?.message || 'Payment recorded successfully');
        resetForm({
          values: {
            collectionId: '',
            amountPaid: '',
            paymentMode: 'cash',
            transactionId: '',
          },
        });
        await Promise.allSettled([
          collectionReload(),
          customerReload(),
          reloadCollectionreports(),
        ]);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to record payment');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleOpenReverse = (col) => {
    setBillToReverse(col);
    setReverseAmount(String(col.amountPaid || ''));
    setReverseReason('');
  };

  const handleConfirmReverse = async (e) => {
    e.preventDefault();
    if (!billToReverse) return;
    const amt = Number(reverseAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return toast.error('Enter a valid reversal amount');
    }
    if (reverseReason.trim().length < 3) {
      return toast.error('Please enter a reason for this reversal');
    }

    setReversing(true);
    try {
      const res = await AxiosService.post(`/collection/reverse/${billToReverse._id}`, {
        amount: amt,
        reason: reverseReason.trim(),
      });
      toast.success(res?.data?.message || 'Payment reversed successfully');
      setBillToReverse(null);
      await Promise.allSettled([
        collectionReload(),
        customerReload(),
        reloadCollectionreports(),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reverse payment');
    } finally {
      setReversing(false);
    }
  };

  const collectionOptions = useMemo(() => {
    if (!Array.isArray(collection)) return [];
    return collection
      .filter((col) => col.status !== 'Paid' && Number(col.amountDue) > 0)
      .map((col) => {
        const periodTag = getMonthName(col.month, col.year);
        const typeTag = col.invoiceNumber
          ? `${col.invoiceNumber} • ${periodTag}`
          : col.billType === 'service'
            ? `Service: ${col.description || 'Charge'}`
            : periodTag;
        const overduePrefix = col.status === 'Overdue' ? 'OVERDUE • ' : '';
        return {
          value: col._id,
          label: `${col.customerId?.name || 'Unknown'} [${overduePrefix}${typeTag}] — Due ${formatCurrency(
            col.amountDue
          )} (${col.customerId?.mobile || 'N/A'})`,
          raw: col,
        };
      });
  }, [collection]);

  const selectedOption = useMemo(
    () => collectionOptions.find((opt) => opt.value === formik.values.collectionId) || null,
    [collectionOptions, formik.values.collectionId]
  );

  const filteredLedger = useMemo(() => {
    if (!Array.isArray(collection)) return [];
    const q = searchQuery.trim().toLowerCase();
    return collection.filter((item) => {
      if (statusFilter === 'unpaid') {
        if (item.status !== 'Pending' && item.status !== 'Overdue') return false;
      } else if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const name = String(item.customerId?.name || '').toLowerCase();
      const mobile = String(item.customerId?.mobile || '').toLowerCase();
      const inv = String(item.invoiceNumber || '').toLowerCase();
      return name.includes(q) || mobile.includes(q) || inv.includes(q);
    });
  }, [collection, searchQuery, statusFilter]);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#0f6b66' : '#d4d1c7',
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

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Payment Entry Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D6E1DF] p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#E5ECEB]">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#141918]">Record Payment</h2>
              <p className="text-xs text-[#4A5452]">
                {collectionOptions.length} pending bill(s) awaiting payment this month
              </p>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1.5">
                Select Customer Bill *
              </label>
              <Select
                options={collectionOptions}
                isSearchable
                isClearable
                placeholder="Search customer by name or mobile..."
                styles={selectStyles}
                name="collectionId"
                value={selectedOption}
                onChange={(opt) => {
                  formik.setFieldValue('collectionId', opt?.value || '');
                  if (opt?.raw?.amountDue && !formik.values.amountPaid) {
                    formik.setFieldValue('amountPaid', opt.raw.amountDue);
                  }
                }}
                onBlur={() => formik.setFieldTouched('collectionId', true)}
                noOptionsMessage={() => 'No unpaid bills found for this month'}
              />
              {formik.touched.collectionId && formik.errors.collectionId && (
                <p className="mt-1 text-xs text-rose-600">{formik.errors.collectionId}</p>
              )}
            </div>

            {selectedOption?.raw && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  selectedOption.raw.status === 'Overdue'
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-brand-50/70 border-brand-100'
                }`}
              >
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-[#141918]">
                      {selectedOption.raw.customerId?.name}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-white text-[#2A3331] border border-[#D6E1DF]">
                      {getMonthName(selectedOption.raw.month, selectedOption.raw.year)}
                    </span>
                    {selectedOption.raw.status === 'Overdue' && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-[#4A5452] mt-0.5">
                    Pending Due:{' '}
                    <span className="font-bold text-rose-600 tabular-nums">
                      {formatCurrency(selectedOption.raw.amountDue)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('amountPaid', selectedOption.raw.amountDue)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Fill Full Due
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="payment-amount"
                className="block text-sm font-medium text-[#2A3331] mb-1.5"
              >
                Amount Collected (₹) *
              </label>
              <input
                id="payment-amount"
                type="number"
                min="1"
                name="amountPaid"
                placeholder="Enter amount received"
                value={formik.values.amountPaid}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  formik.touched.amountPaid && formik.errors.amountPaid
                    ? 'border-rose-400'
                    : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {formik.touched.amountPaid && formik.errors.amountPaid && (
                <p className="mt-1 text-xs text-rose-600">{formik.errors.amountPaid}</p>
              )}
              <p className="mt-1 text-xs text-[#4A5452]">
                Any amount above the due balance is automatically credited to customer advance.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1.5">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    formik.setFieldValue('paymentMode', 'cash');
                    formik.setFieldValue('transactionId', '');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    formik.values.paymentMode === 'cash'
                      ? 'bg-brand-50 border-brand-500 text-brand-700'
                      : 'bg-white border-[#D6E1DF] text-[#4A5452] hover:bg-[#F7FAFA]'
                  }`}
                >
                  <FiDollarSign className="w-4 h-4" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('paymentMode', 'online')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    formik.values.paymentMode === 'online'
                      ? 'bg-brand-50 border-brand-500 text-brand-700'
                      : 'bg-white border-[#D6E1DF] text-[#4A5452] hover:bg-[#F7FAFA]'
                  }`}
                >
                  <FiSmartphone className="w-4 h-4" />
                  <span>Online / UPI</span>
                </button>
              </div>
            </div>

            {formik.values.paymentMode === 'online' && (
              <div>
                <label
                  htmlFor="payment-txnid"
                  className="block text-sm font-medium text-[#2A3331] mb-1.5"
                >
                  UPI / Transaction Reference ID *
                </label>
                <input
                  id="payment-txnid"
                  type="text"
                  name="transactionId"
                  placeholder="Enter UTR / Transaction ID"
                  value={formik.values.transactionId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    formik.touched.transactionId && formik.errors.transactionId
                      ? 'border-rose-400'
                      : 'border-[#C3D2CF] focus:border-brand-500'
                  }`}
                />
                {formik.touched.transactionId && formik.errors.transactionId && (
                  <p className="mt-1 text-xs text-rose-600">{formik.errors.transactionId}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Collect Payment</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Active Bills Ledger (Current Month & Overdue Arrears) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5ECEB] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#141918]">
                  Active Bills (Current &amp; Overdue)
                </h3>
                <p className="text-xs text-[#4A5452]">
                  Includes this month&apos;s bills plus any unpaid overdue arrears from earlier
                  cycles.
                </p>
              </div>
              <span className="text-xs font-medium text-[#4A5452] shrink-0">
                {filteredLedger.length} record(s)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="w-4 h-4 text-[#596361] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by customer, mobile, or invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D6E1DF] bg-[#F7FAFA] focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      statusFilter === tab.key
                        ? 'bg-brand-600 text-white'
                        : 'bg-[#E5ECEB] text-[#4A5452] hover:bg-[#D6E1DF]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F7FAFA] border-b border-[#D6E1DF]">
                <tr className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                  <th className="py-3 px-4">Customer &amp; Cycle</th>
                  <th className="py-3 px-4 text-right">Due</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEB] text-sm">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-[#4A5452]">
                      No bills found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((col) => {
                    const isPaid = col.status === 'Paid';
                    const isOverdue = col.status === 'Overdue';
                    const isSelected = formik.values.collectionId === col._id;
                    return (
                      <tr
                        key={col._id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-brand-50/70'
                            : isOverdue
                              ? 'bg-rose-50/35 hover:bg-rose-50/60'
                              : 'hover:bg-[#F7FAFA]'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-[#141918]">
                              {col.customerId?.name || 'Deleted Customer'}
                            </p>
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-[#E5ECEB] text-[#4A5452] border border-[#D6E1DF]">
                              {getMonthName(col.month, col.year)}
                            </span>
                            {col.invoiceNumber && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
                                {col.invoiceNumber}
                              </span>
                            )}
                            {col.billType === 'service' && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                                Service
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#4A5452] tabular-nums">
                            {col.customerId?.mobile || '—'} • Due {formatDate(col.dueDate)}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-rose-600">
                          {formatCurrency(col.amountDue)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-emerald-600">
                          {formatCurrency(col.amountPaid)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : col.status === 'Overdue'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {col.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  formik.setFieldValue('collectionId', col._id);
                                  formik.setFieldValue('amountPaid', col.amountDue);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition cursor-pointer"
                              >
                                Select
                              </button>
                            )}
                            {isAdmin && Number(col.amountPaid) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenReverse(col)}
                                title="Reverse / Adjust payment"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                              >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                                <span>Reverse</span>
                              </button>
                            )}
                            {isPaid && !isAdmin && (
                              <span className="text-xs text-[#596361] uppercase font-medium">
                                {col.paymentMode}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Payment Reversal Modal */}
      <Modal
        isOpen={Boolean(billToReverse)}
        onClose={() => !reversing && setBillToReverse(null)}
        title="Reverse / Correct Payment"
        subtitle={`${billToReverse?.customerId?.name || 'Customer'} • Total Paid: ${formatCurrency(
          billToReverse?.amountPaid
        )}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReverse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1">
              Amount to Reverse (₹) *
            </label>
            <input
              type="number"
              min="1"
              max={billToReverse?.amountPaid || undefined}
              required
              value={reverseAmount}
              onChange={(e) => setReverseAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918] tabular-nums focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1">
              Audit Reason *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g., Duplicate entry or mistyped amount (₹5000 instead of ₹500)"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918] focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={() => setBillToReverse(null)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reversing}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {reversing && <span className="loading loading-spinner loading-xs" />}
              <span>{reversing ? 'Reversing...' : 'Confirm Reversal'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export default Collection;
