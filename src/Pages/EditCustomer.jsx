import { Formik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import UseCreateCustomer from '../Hooks/UseCreateCustomer';
import { formatCurrency } from '../Common/authUtils';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const editCustomerSchema = Yup.object().shape({
  name: Yup.string().trim().required('Customer name is required'),
  mobile: Yup.string()
    .trim()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit mobile number')
    .required('Mobile number is required'),
  address: Yup.string()
    .trim()
    .min(3, 'Address must be at least 3 characters')
    .required('Address is required'),
  status: Yup.string().oneOf(['active', 'suspended', 'disconnected']),
  planId: Yup.string().required('Please select a plan'),
  advanceAmount: Yup.number().typeError('Must be a valid number').min(0, 'Cannot be negative'),
  remainingBalance: Yup.number().typeError('Must be a valid number').min(0, 'Cannot be negative'),
  isGstCustomer: Yup.boolean(),
  companyName: Yup.string().when('isGstCustomer', ([isGst], schema) =>
    isGst ? schema.trim().required('Company name is required for GST customer') : schema.notRequired()
  ),
  gstin: Yup.string().when('isGstCustomer', ([isGst], schema) =>
    isGst
      ? schema
          .trim()
          .uppercase()
          .matches(GSTIN_REGEX, 'Enter a valid 15-character GSTIN')
          .required('GSTIN is required')
      : schema.notRequired()
  ),
});

function EditCustomer({ onClose }) {
  const { plan = [] } = useSelector((state) => state.plan);
  const { customer = [], selectedCustomer } = useSelector((state) => state.customer);
  const { editCustomerPlan, loading } = UseCreateCustomer();

  const dt = Array.isArray(customer)
    ? customer.find((item) => item._id === selectedCustomer)
    : null;

  if (!dt) {
    return <div className="py-6 text-center text-sm text-[#4A5452]">No customer selected.</div>;
  }

  const currentPlanId =
    typeof dt.planId === 'object' && dt.planId !== null ? dt.planId._id : dt.planId || '';

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: dt.name || '',
        mobile: dt.mobile || '',
        email: dt.email || '',
        address: dt.address || '',
        status: dt.status || 'active',
        planId: currentPlanId,
        advanceAmount: dt.advanceAmount ?? 0,
        remainingBalance: dt.remainingBalance ?? 0,
        isGstCustomer: Boolean(dt.isGstCustomer),
        companyName: dt.companyName || '',
        gstin: dt.gstin || '',
        billingAddress: dt.billingAddress || '',
        hsnSac: dt.hsnSac || '998422',
        gstRate: dt.gstRate ?? 18,
      }}
      validationSchema={editCustomerSchema}
      onSubmit={async (values) => {
        await editCustomerPlan(selectedCustomer, values, () => {
          onClose?.();
        });
      }}
    >
      {({ values, errors, touched, handleBlur, handleSubmit, handleChange, setFieldValue }) => (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-cust-name" className="block text-sm font-medium text-[#2A3331] mb-1">
                Customer Name
              </label>
              <input
                id="edit-cust-name"
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-cust-mobile" className="block text-sm font-medium text-[#2A3331] mb-1">
                Mobile Number
              </label>
              <input
                id="edit-cust-mobile"
                type="tel"
                name="mobile"
                maxLength={10}
                value={values.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
              />
              {errors.mobile && touched.mobile && (
                <p className="mt-1 text-xs text-rose-600">{errors.mobile}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-cust-plan" className="block text-sm font-medium text-[#2A3331] mb-1">
                Subscribed Plan
              </label>
              <select
                id="edit-cust-plan"
                name="planId"
                value={values.planId}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
              >
                <option value="">Select a plan</option>
                {Array.isArray(plan) &&
                  plan.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} — {item.speed} Mbps ({formatCurrency(item.amount)}/mo)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-cust-status" className="block text-sm font-medium text-[#2A3331] mb-1">
                Connection Status
              </label>
              <select
                id="edit-cust-status"
                name="status"
                value={values.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
              >
                <option value="active">Active (Billed Monthly)</option>
                <option value="suspended">Suspended (Billing Paused)</option>
                <option value="disconnected">Disconnected (Billing Stopped)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-cust-address" className="block text-sm font-medium text-[#2A3331] mb-1">
              Installation Address
            </label>
            <textarea
              id="edit-cust-address"
              name="address"
              rows={2}
              value={values.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1">
                Advance Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                name="advanceAmount"
                value={values.advanceAmount}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1">
                Pending Due (₹)
              </label>
              <input
                type="number"
                min="0"
                name="remainingBalance"
                value={values.remainingBalance}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white"
              />
            </div>
          </div>

          {/* GST Profile */}
          <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-200 space-y-3">
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-brand-900">GST Billing Customer</p>
                <p className="text-xs text-brand-700">Enable sequential Tax Invoice billing</p>
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
                    Company / Legal Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
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
                    <label className="block text-xs font-semibold text-[#2A3331] mb-1">HSN/SAC</label>
                    <input
                      type="text"
                      name="hsnSac"
                      value={values.hsnSac}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 text-sm rounded-lg border border-[#C3D2CF] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2A3331] mb-1">GST %</label>
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
                    Billing Address
                  </label>
                  <textarea
                    rows={2}
                    name="billingAddress"
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
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
}

export default EditCustomer;
