import { useCallback, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Layout from '../Components/Layout';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate } from '../Common/authUtils';
import { FiFileText, FiPlusCircle, FiClock, FiTrash2 } from 'react-icons/fi';

function Expense() {
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadExpenses = useCallback(async () => {
    setFetching(true);
    try {
      const res = await AxiosService.get('/collection/getexpense');
      if (res.status === 200) {
        setExpenses(res?.data?.todayExpense || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load expenses');
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const formik = useFormik({
    initialValues: {
      amount: '',
      remarks: '',
    },
    validationSchema: Yup.object({
      amount: Yup.number()
        .typeError('Enter a valid amount')
        .positive('Amount must be greater than 0')
        .required('Expense amount is required'),
      remarks: Yup.string()
        .trim()
        .min(3, 'Please provide a brief description')
        .required('Expense remarks are required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      setIsLoading(true);
      try {
        const res = await AxiosService.post('/collection/expense', {
          amount: Number(values.amount),
          remarks: values.remarks.trim(),
        });
        toast.success(res?.data?.message || 'Expense recorded successfully');
        resetForm();
        await loadExpenses();
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to save expense');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleDeleteExpense = async (id) => {
    setDeletingId(id);
    try {
      const res = await AxiosService.delete(`/collection/expense/${id}`);
      if (res.status === 200) {
        toast.success(res?.data?.message || 'Expense removed');
        await loadExpenses();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const totalUnclaimed = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Record Expense Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D6E1DF] p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#E5ECEB]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#141918]">Record Daily Expense</h2>
              <p className="text-xs text-[#4A5452]">
                Add one or multiple itemized expenses and attach them during daily settlement.
              </p>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="expense-amount"
                className="block text-sm font-medium text-[#2A3331] mb-1.5"
              >
                Expense Amount (₹) *
              </label>
              <input
                id="expense-amount"
                type="number"
                min="1"
                name="amount"
                placeholder="e.g., 250"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  formik.touched.amount && formik.errors.amount
                    ? 'border-rose-400'
                    : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {formik.touched.amount && formik.errors.amount && (
                <p className="mt-1 text-xs text-rose-600">{formik.errors.amount}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="expense-remarks"
                className="block text-sm font-medium text-[#2A3331] mb-1.5"
              >
                Description / Remarks *
              </label>
              <textarea
                id="expense-remarks"
                name="remarks"
                rows={4}
                placeholder="e.g., Fuel charges, fiber cable connectors, field maintenance..."
                value={formik.values.remarks}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  formik.touched.remarks && formik.errors.remarks
                    ? 'border-rose-400'
                    : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {formik.touched.remarks && formik.errors.remarks && (
                <p className="mt-1 text-xs text-rose-600">{formik.errors.remarks}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiPlusCircle className="w-4 h-4" />
                  <span>Add Expense</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Unclaimed Expenses List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5ECEB] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#141918]">Your Unclaimed Expenses</h3>
              <p className="text-xs text-[#4A5452]">
                Select one or more expenses during Daily Settlement to deduct from cash in hand.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-[#596361] font-semibold">
                Total Unclaimed
              </p>
              <p className="text-lg font-bold text-amber-600 tabular-nums">
                {formatCurrency(totalUnclaimed)}
              </p>
            </div>
          </div>

          <div className="p-5">
            {fetching ? (
              <div className="py-10 text-center">
                <span className="loading loading-spinner loading-md text-brand-600" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#E5ECEB] text-[#596361] flex items-center justify-center mx-auto mb-3">
                  <FiClock className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#2A3331]">No unclaimed expenses</p>
                <p className="text-xs text-[#4A5452] mt-1">
                  Expenses you record will appear here until claimed in a daily settlement.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl border border-[#D6E1DF] bg-[#F7FAFA] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#4A5452]">
                          {formatDate(item.date)}
                        </span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#1E2524] whitespace-pre-line break-words">
                        {item.remarks}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-lg font-bold text-[#141918] tabular-nums">
                        {formatCurrency(item.amount)}
                      </p>
                      <button
                        type="button"
                        disabled={deletingId === item._id}
                        onClick={() => handleDeleteExpense(item._id)}
                        title="Delete unclaimed expense"
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer disabled:opacity-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Expense;
