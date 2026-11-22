import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../Components/Layout';
import UseReloadHook from '../Hooks/UseReloadHook';
import { toast } from 'react-toastify';
import AxiosService from '../Common/AxiosService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Modal from '../Common/Modal';
import { formatCurrency, formatDate, getStoredUser } from '../Common/authUtils';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiSend,
  FiTool,
} from 'react-icons/fi';

const submitSchema = Yup.object().shape({
  subscriptionAmount: Yup.number().typeError('Invalid').min(0, 'Cannot be negative'),
  serviceAmount: Yup.number().typeError('Invalid').min(0, 'Cannot be negative'),
  advanceAmount: Yup.number().typeError('Invalid').min(0, 'Cannot be negative'),
});

function DailyCollection() {
  const { cardData, todaySplit, getAllCollection } = UseReloadHook();
  const [exData, setExData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userName = getStoredUser()?.userName || '';

  const getReport = useCallback(async () => {
    try {
      const res = await AxiosService.get('/collection/getreport');
      if (res.status === 200) {
        setReportData(res?.data?.report || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load submitted reports');
      }
    }
  }, []);

  const getExpense = useCallback(async () => {
    try {
      const res = await AxiosService.get('/collection/getexpense');
      if (res.status === 200) {
        setExData(res?.data?.todayExpense || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load expense data');
      }
    }
  }, []);

  useEffect(() => {
    getAllCollection(false);
    getExpense();
    getReport();
  }, [getAllCollection, getExpense, getReport]);

  const todayCollections = useMemo(() => {
    const todayDay = new Date().getDate();
    if (!Array.isArray(cardData)) return [];
    return cardData.filter(
      (item) => item.day === todayDay && item?.collectedBy?.userName === userName
    );
  }, [cardData, userName]);

  const liveTodaySplit = useMemo(() => {
    if (todaySplit && Number(todaySplit.totalCollected) > 0) {
      return todaySplit;
    }
    let subscriptionAmount = 0;
    let serviceAmount = 0;
    let advanceAmount = 0;
    todayCollections.forEach((item) => {
      const amt = Number(item.totalCollected) || 0;
      if (item.type === 'service') serviceAmount += amt;
      else if (item.type === 'advance') advanceAmount += amt;
      else subscriptionAmount += amt;
    });
    return {
      subscriptionAmount,
      serviceAmount,
      advanceAmount,
      totalCollected: subscriptionAmount + serviceAmount + advanceAmount,
    };
  }, [todaySplit, todayCollections]);

  const totalUnclaimedExpense = useMemo(
    () => exData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [exData]
  );

  const submittedToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return reportData.some(
      (item) => item?.collectionDate && new Date(item.collectionDate).toDateString() === todayStr
    );
  }, [reportData]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Unified Split Strip: Monthly Bills | Service Bills | Expenses | Handover */}
        <section className="bg-white rounded-2xl border border-[#D6E1DF] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D6E1DF]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Monthly Bills Today
              </span>
              <FiDollarSign className="w-4 h-4 text-[#157347]" />
            </div>
            <p className="font-display text-2xl font-extrabold text-[#157347] tabular-nums">
              {formatCurrency(liveTodaySplit.subscriptionAmount)}
            </p>
            <p className="text-xs text-[#596361] mt-1 tabular-nums">
              Advance: {formatCurrency(liveTodaySplit.advanceAmount)}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Service Bills Today
              </span>
              <FiTool className="w-4 h-4 text-brand-700" />
            </div>
            <p className="font-display text-2xl font-extrabold text-brand-700 tabular-nums">
              {formatCurrency(liveTodaySplit.serviceAmount)}
            </p>
            <p className="text-xs text-[#596361] mt-1 tabular-nums">
              Combined Total: {formatCurrency(liveTodaySplit.totalCollected)}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Unclaimed Expenses
              </span>
              <FiFileText className="w-4 h-4 text-[#B45309]" />
            </div>
            <p className="font-display text-2xl font-extrabold text-[#B45309] tabular-nums">
              {formatCurrency(totalUnclaimedExpense)}
            </p>
            <p className="text-xs text-[#596361] mt-1">{exData.length} itemized entry(s)</p>
          </div>

          <div className="p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                Daily Handover
              </p>
              <p className="text-sm font-bold text-[#141918] mt-1">
                {submittedToday ? 'Submitted today' : 'Ready to submit'}
              </p>
            </div>
            <button
              type="button"
              disabled={submittedToday}
              onClick={() => setIsSubmitOpen(true)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition shrink-0 ${
                submittedToday
                  ? 'bg-[#E5ECEB] text-[#4A5452] border border-[#C3D2CF] cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer'
              }`}
            >
              <FiSend className="w-4 h-4" />
              <span>{submittedToday ? 'Submitted' : 'Submit'}</span>
            </button>
          </div>
        </section>

        {/* Today's Split Breakdown & Unclaimed Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-bold text-[#141918]">
                Today&apos;s Collection Split
              </h3>
              <span className="text-xs font-semibold text-[#4A5452]">
                Day {new Date().getDate()}
              </span>
            </div>

            {todayCollections.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A5452]">
                No subscription, service, or advance collections logged by you today yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E5ECEB] border-y border-[#E5ECEB]">
                {todayCollections.map((item, idx) => (
                  <div
                    key={`${item.type}-${idx}`}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                          item.type === 'service'
                            ? 'bg-brand-50 text-brand-700 border-brand-200'
                            : item.type === 'advance'
                              ? 'bg-[#EDF6FC] text-[#0369A1] border-[#BAE0F5]'
                              : 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]'
                        }`}
                      >
                        {item.type === 'subscription' ? 'Monthly Subscriptions' : item.type}
                      </span>
                      <p className="text-xs text-[#596361] mt-1">
                        Collector: {item.collectedBy?.userName || userName}
                      </p>
                    </div>
                    <p
                      className={`font-display text-xl font-bold tabular-nums ${
                        item.type === 'service'
                          ? 'text-brand-700'
                          : item.type === 'advance'
                            ? 'text-[#0369A1]'
                            : 'text-[#157347]'
                      }`}
                    >
                      {formatCurrency(item.totalCollected)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-bold text-[#141918]">
                Available Unclaimed Expenses
              </h3>
              <span className="text-xs font-semibold text-[#4A5452]">{exData.length} item(s)</span>
            </div>

            {exData.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A5452]">
                No unclaimed expenses on file.
              </p>
            ) : (
              <div className="divide-y divide-[#E5ECEB] border-y border-[#E5ECEB] max-h-56 overflow-y-auto">
                {exData.map((exp) => (
                  <div
                    key={exp._id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#141918] truncate">{exp.remarks}</p>
                      <p className="text-xs text-[#596361]">{formatDate(exp.date)}</p>
                    </div>
                    <span className="text-base font-bold text-[#B45309] tabular-nums shrink-0">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submitted Settlement History with Subscription vs Service Split */}
        <div className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5ECEB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-brand-700" />
              <h3 className="font-display text-base font-bold text-[#141918]">
                Submitted Settlement History
              </h3>
            </div>
            <span className="text-xs text-[#4A5452]">Last {reportData.length} submission(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Monthly Bills</th>
                  <th className="py-3 px-4 text-right">Service Bills</th>
                  <th className="py-3 px-4 text-right">Total Collected</th>
                  <th className="py-3 px-4 text-right">Expense</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4">Admin Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEB] text-sm">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[#4A5452]">
                      You haven&apos;t submitted any daily collections yet.
                    </td>
                  </tr>
                ) : (
                  reportData.map((item) => {
                    const expenseAmt =
                      Number(item?.totalExpenseAmount ?? item?.expenseId?.amount) || 0;
                    const remarksText =
                      item?.combinedRemarks || item?.expenseId?.remarks || '—';
                    const collectedAmt = Number(item?.collectionAmount) || 0;
                    const subAmt = Number(item?.subscriptionAmount) || 0;
                    const svcAmt = Number(item?.serviceAmount) || 0;
                    const netSubmitted = Math.max(0, collectedAmt - expenseAmt);
                    const isReceived = item?.status === 'Recieved';

                    return (
                      <tr key={item._id} className="hover:bg-[#F7FAFA] transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#1E2524]">
                          {formatDate(item?.collectionDate || item?.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[#141918]">
                          {formatCurrency(subAmt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-brand-700">
                          {formatCurrency(svcAmt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#141918]">
                          {formatCurrency(collectedAmt)}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#B45309] font-medium">
                          {formatCurrency(expenseAmt)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#4A5452] max-w-xs break-words">
                          {remarksText}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#157347]">
                          {formatCurrency(netSubmitted)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isReceived
                                ? 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]'
                                : 'bg-[#FEF6E7] text-[#B45309] border-[#F2D59B]'
                            }`}
                          >
                            {isReceived ? (
                              <>
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                <span>Received</span>
                              </>
                            ) : (
                              <>
                                <FiClock className="w-3.5 h-3.5" />
                                <span>Pending Verification</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Today's Collection Modal with Editable Subscription vs Service Split */}
        <Modal
          isOpen={isSubmitOpen}
          onClose={() => setIsSubmitOpen(false)}
          title="Submit Today's Collection"
          subtitle="Verify your Subscription vs Service Bill split and check expenses to deduct"
          maxWidth="max-w-md"
        >
          <Formik
            enableReinitialize
            initialValues={{
              subscriptionAmount: liveTodaySplit.subscriptionAmount || 0,
              serviceAmount: liveTodaySplit.serviceAmount || 0,
              advanceAmount: liveTodaySplit.advanceAmount || 0,
              expenseIds: [],
            }}
            validationSchema={submitSchema}
            onSubmit={async (values, { resetForm }) => {
              const gross =
                (Number(values.subscriptionAmount) || 0) +
                (Number(values.serviceAmount) || 0) +
                (Number(values.advanceAmount) || 0);
              setSubmitting(true);
              try {
                const res = await AxiosService.post('/collection/submitreport', {
                  collectionAmount: gross,
                  subscriptionAmount: Number(values.subscriptionAmount) || 0,
                  serviceAmount: Number(values.serviceAmount) || 0,
                  advanceAmount: Number(values.advanceAmount) || 0,
                  expenseIds: values.expenseIds,
                });
                if (res.status === 201) {
                  toast.success(res?.data?.message || 'Daily collection submitted!');
                  resetForm();
                  setIsSubmitOpen(false);
                  await Promise.allSettled([getAllCollection(false), getExpense(), getReport()]);
                }
              } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to submit daily collection.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
              const toggleExpense = (id) => {
                const exists = values.expenseIds.includes(id);
                setFieldValue(
                  'expenseIds',
                  exists ? values.expenseIds.filter((x) => x !== id) : [...values.expenseIds, id]
                );
              };

              const grossCollection =
                (Number(values.subscriptionAmount) || 0) +
                (Number(values.serviceAmount) || 0) +
                (Number(values.advanceAmount) || 0);

              const expenseDeduction = exData
                .filter((e) => values.expenseIds.includes(e._id))
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
              const netPayout = Math.max(0, grossCollection - expenseDeduction);

              return (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="daily-sub"
                        className="block text-xs font-semibold text-[#2A3331] mb-1"
                      >
                        Monthly Bills (₹)
                      </label>
                      <input
                        id="daily-sub"
                        type="number"
                        min="0"
                        name="subscriptionAmount"
                        value={values.subscriptionAmount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-[#C3D2CF] bg-white text-[#141918] tabular-nums focus:outline-none focus:border-brand-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="daily-svc"
                        className="block text-xs font-semibold text-[#2A3331] mb-1"
                      >
                        Service Bills (₹)
                      </label>
                      <input
                        id="daily-svc"
                        type="number"
                        min="0"
                        name="serviceAmount"
                        value={values.serviceAmount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-[#C3D2CF] bg-white text-brand-700 tabular-nums focus:outline-none focus:border-brand-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="daily-adv"
                      className="block text-xs font-semibold text-[#2A3331] mb-1"
                    >
                      Direct Advance Collected (₹)
                    </label>
                    <input
                      id="daily-adv"
                      type="number"
                      min="0"
                      name="advanceAmount"
                      value={values.advanceAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-[#C3D2CF] bg-white text-[#141918] tabular-nums focus:outline-none focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2A3331] mb-1.5">
                      Attach Unclaimed Expenses ({values.expenseIds.length} selected)
                    </label>
                    {exData.length === 0 ? (
                      <p className="text-xs text-[#596361] py-2">No unclaimed expenses available.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {exData.map((e) => {
                          const checked = values.expenseIds.includes(e._id);
                          return (
                            <label
                              key={e._id}
                              className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                checked
                                  ? 'bg-brand-50 border-brand-500'
                                  : 'bg-white border-[#D6E1DF] hover:bg-[#F7FAFA]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleExpense(e._id)}
                                  className="checkbox checkbox-sm checkbox-primary"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#1E2524] truncate">
                                    {e.remarks}
                                  </p>
                                  <p className="text-xs text-[#596361]">{formatDate(e.date)}</p>
                                </div>
                              </div>
                              <span className="font-bold text-[#B45309] tabular-nums shrink-0">
                                {formatCurrency(e.amount)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#D6E1DF] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#4A5452]">
                      <span>Monthly Subscriptions</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(values.subscriptionAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-brand-700">
                      <span>Service Bills</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(values.serviceAmount)}
                      </span>
                    </div>
                    {Number(values.advanceAmount) > 0 && (
                      <div className="flex justify-between text-[#0369A1]">
                        <span>Advance Credit</span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(values.advanceAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#141918] font-semibold pt-1 border-t border-[#E5ECEB]">
                      <span>Gross Collection</span>
                      <span className="tabular-nums">{formatCurrency(grossCollection)}</span>
                    </div>
                    <div className="flex justify-between text-[#B45309]">
                      <span>Expense Deduction ({values.expenseIds.length})</span>
                      <span className="font-semibold tabular-nums">
                        - {formatCurrency(expenseDeduction)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#141918] pt-1.5 border-t border-[#D6E1DF]">
                      <span>Net Handover to Admin</span>
                      <span className="text-[#157347] tabular-nums">
                        {formatCurrency(netPayout)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
                    <button
                      type="button"
                      onClick={() => setIsSubmitOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      {submitting && <span className="loading loading-spinner loading-xs" />}
                      <span>{submitting ? 'Submitting...' : 'Submit Settlement'}</span>
                    </button>
                  </div>
                </form>
              );
            }}
          </Formik>
        </Modal>
      </div>
    </Layout>
  );
}

export default DailyCollection;
