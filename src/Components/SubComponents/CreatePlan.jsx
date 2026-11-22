import { Formik } from 'formik';
import * as Yup from 'yup';
import UseCreatePlan from '../../Hooks/UseCreatePlan';
import { getStoredUser } from '../../Common/authUtils';

const planSchema = Yup.object().shape({
  name: Yup.string().trim().required('Plan name is required'),
  speed: Yup.number()
    .typeError('Enter a valid speed')
    .positive('Speed must be greater than 0')
    .required('Speed limit is required'),
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .positive('Amount must be greater than 0')
    .required('Monthly amount is required'),
});

function CreatePlan({ onClose }) {
  const { createPlan, loading } = UseCreatePlan();
  const isAdmin = getStoredUser()?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-4 text-center text-sm text-[#4A5452]">
        Only administrators can create internet plans.
      </div>
    );
  }

  return (
    <Formik
      initialValues={{ name: '', speed: '', amount: '' }}
      validationSchema={planSchema}
      onSubmit={async (values, { resetForm }) => {
        const ok = await createPlan(values, () => {
          resetForm();
          onClose?.();
        });
        if (!ok) return;
      }}
    >
      {({ values, errors, touched, handleBlur, handleSubmit, handleChange }) => (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="plan-name" className="block text-sm font-medium text-[#2A3331] mb-1">
              Plan Name
            </label>
            <input
              id="plan-name"
              type="text"
              name="name"
              placeholder="e.g., Fiber Pro 100"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="plan-speed" className="block text-sm font-medium text-[#2A3331] mb-1">
                Speed (Mbps)
              </label>
              <input
                id="plan-speed"
                type="number"
                min="1"
                name="speed"
                placeholder="e.g., 100"
                value={values.speed}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.speed && touched.speed ? 'border-rose-400' : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {errors.speed && touched.speed && (
                <p className="mt-1 text-xs text-rose-600">{errors.speed}</p>
              )}
            </div>

            <div>
              <label htmlFor="plan-amount" className="block text-sm font-medium text-[#2A3331] mb-1">
                Monthly Price (₹)
              </label>
              <input
                id="plan-amount"
                type="number"
                min="1"
                name="amount"
                placeholder="e.g., 599"
                value={values.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.amount && touched.amount ? 'border-rose-400' : 'border-[#C3D2CF] focus:border-brand-500'
                }`}
              />
              {errors.amount && touched.amount && (
                <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              {loading && <span className="loading loading-spinner loading-xs" />}
              <span>{loading ? 'Creating...' : 'Create Plan'}</span>
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
}

export default CreatePlan;
