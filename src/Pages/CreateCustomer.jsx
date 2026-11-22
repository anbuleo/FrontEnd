import { Formik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import useCreateCustomer from '../Hooks/UseCreateCustomer.jsx';
import { formatCurrency } from '../Common/authUtils';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const customerSchema = Yup.object().shape({
  name: Yup.string().trim().required('Customer name is required'),
  mobile: Yup.string()
    .trim()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit mobile number')
    .required('Mobile number is required'),
  address: Yup.string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .required('Installation address is required'),
  planId: Yup.string().required('Please select an internet plan'),
  advanceAmount: Yup.number().typeError('Must be a valid number').min(0, 'Cannot be negative'),
  remainingBalance: Yup.number().typeError('Must be a valid number').min(0, 'Cannot be negative'),
  isGstCustomer: Yup.boolean(),
  companyName: Yup.string().when('isGstCustomer', ([isGst], schema) =>
    isGst ? schema.trim().required('Business / Legal company name is required') : schema.notRequired()
  ),
  gstin: Yup.string().when('isGstCustomer', ([isGst], schema) =>
    isGst
      ? schema
          .trim()
          .uppercase()
          .matches(GSTIN_REGEX, 'Enter a valid 15-character GSTIN (e.g., 33AACCM8380N1Z1)')
          .required('GSTIN is required for GST customers')
      : schema.notRequired()
  ),
});

function CreateCustomer({ onClose }) {
  const { plan = [] } = useSelector((state) => state.plan);
  const { createCustomer, loading } = useCreateCustomer();

  return (
    <Formik
      initialValues={{
        name: '',
        mobile: '',
        email: '',
        address: '',
        planId: '',
        advanceAmount: 0,
        remainingBalance: 0,
        isGstCustomer: false,
        companyName: '',
        gstin: '',
        billingAddress: '',
        hsnSac: '998422',
        gstRate: 18,
      }}
      validationSchema={customerSchema}
      onSubmit={async (values, { resetForm }) => {
        const ok = await createCustomer(values, () => {
          resetForm();
          onClose?.();
        });
        if (!ok) return;
      }}
    >
      {({ values, errors, touched, handleBlur, handleSubmit, handleChange, setFieldValue }) => (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cust-name" className="block text-sm font-medium text-[#2A3331] mb-1">
                Customer Name *
              </label>
              <input
                id="cust-name"
                type="text"
                name="name"
                placeholder="Full name or subscriber ID"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.name && touched.name ? 'border-rose-400' : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="cust-mobile" className="block text-sm font-medium text-[#2A3331] mb-1">
                Mobile Number *
              </label>
              <input
                id="cust-mobile"
                type="tel"
                name="mobile"
                maxLength={10}
                placeholder="9876543210"
                value={values.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.mobile && touched.mobile ? 'border-rose-400' : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {errors.mobile && touched.mobile && (
                <p className="mt-1 text-xs text-rose-600">{errors.mobile}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="cust-plan" className="block text-sm font-medium text-[#2A3331] mb-1">
              Internet Plan *
            </label>
            <select
              id="cust-plan"
              name="planId"
              value={values.planId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                errors.planId && touched.planId ? 'border-rose-400' : 'border-[#C3D2CF] focus:border-brand-500'
              }`}
            >
              <option value="">Select a plan</option>
              {Array.isArray(plan) &&
                plan.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {item.speed} Mbps ({formatCurrency(item.amount)}/mo)
                  </option>
                ))}
            </select>
            {errors.planId && touched.planId && (
              <p className="mt-1 text-xs text-rose-600">{errors.planId}</p>
            )}
          </div>

          <div>
            <label htmlFor="cust-address" className="block text-sm font-medium text-[#2A3331] mb-1">
              Installation Address *
            </label>
            <textarea
              id="cust-address"
              name="address"
              rows={2}
              placeholder="Door no, street, locality, landmark"
              value={values.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                errors.address && touched.address ? 'border-rose-400' : 'border-[#C3D2CF] focus:border-brand-500'
              }`}
            />
            {errors.address && touched.address && (
              <p className="mt-1 text-xs text-rose-600">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cust-advance" className="block text-sm font-medium text-[#2A3331] mb-1">
                Advance Amount (₹)
              </label>
              <input
                id="cust-advance"
                type="number"
                min="0"
                name="advanceAmount"
                value={values.advanceAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
              />
            </div>

            <div>
              <label htmlFor="cust-due" className="block text-sm font-medium text-[#2A3331] mb-1">
                Opening Pending Due (₹)
              </label>
              <input
                id="cust-due"
                type="number"
                min="0"
                name="remainingBalance"
                value={values.remainingBalance}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
              />
            </div>
          </div>

          {/* GST Customer Toggle & Profile */}
          <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-200 space-y-3">
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-brand-900">GST Billing Customer</p>
                <p className="text-xs text-brand-700">
                  Auto-generates sequential Tax Invoices with CGST/SGST or IGST every month
                </p>
              </div>
              <input
                type="checkbox"
                checked={values.isGstCustomer}
                onChange={(e) => setFieldValue('isGstCustomer', e.target.checked)}
                className="toggle toggle-primary toggle-sm"
              />
            </label>

            {values.isGstCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-brand-200/70">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                    Buyer Company / Legal Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="e.g., VIVA COMMUNICATIONS PRIVATE LIMITED"
                    value={values.companyName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C3D2CF] bg-white"
                  />
                  {errors.companyName && touched.companyName && (
                    <p className="mt-1 text-xs text-rose-600">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3331] mb-1">GSTIN *</label>
                  <input
                    type="text"
                    name="gstin"
                    maxLength={15}
                    placeholder="33AACCM8380N1Z1"
                    value={values.gstin}
                    onChange={(e) => setFieldValue('gstin', e.target.value.toUpperCase())}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C3D2CF] bg-white font-mono uppercase"
                  />
                  {errors.gstin && touched.gstin && (
                    <p className="mt-1 text-xs text-rose-600">{errors.gstin}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                      HSN/SAC
                    </label>
                    <input
                      type="text"
                      name="hsnSac"
                      value={values.hsnSac}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-[#C3D2CF] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                      GST %
                    </label>
                    <input
                      type="number"
                      name="gstRate"
                      min="0"
                      max="28"
                      value={values.gstRate}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-[#C3D2CF] bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#2A3331] mb-1">
                    Registered Billing Address (defaults to Installation Address)
                  </label>
                  <textarea
                    rows={2}
                    name="billingAddress"
                    placeholder="Corporate billing address for Tax Invoice"
                    value={values.billingAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#C3D2CF] bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {loading && <span className="loading loading-spinner loading-xs" />}
              <span>{loading ? 'Adding...' : 'Add Customer'}</span>
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
}

export default CreateCustomer;
