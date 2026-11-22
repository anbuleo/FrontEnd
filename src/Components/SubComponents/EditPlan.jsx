import { Formik } from 'formik';
import * as Yup from 'yup';
import UseCreatePlan from '../../Hooks/UseCreatePlan';
import { useSelector } from 'react-redux';

const planSchema = Yup.object().shape({
  name: Yup.string().trim().required('Plan name is required'),
  speed: Yup.number()
    .typeError('Enter a valid speed')
    .positive('Speed must be greater than 0')
    .required('Speed is required'),
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
});

function EditPlan({ onClose }) {
  const { loading, editPlan } = UseCreatePlan();
  const { plan = [], selectedPlanId } = useSelector((state) => state.plan);

  const currentPlan = Array.isArray(plan)
    ? plan.find((item) => item._id === selectedPlanId)
    : null;

  if (!currentPlan) {
    return (
      <div className="py-6 text-center text-sm text-[#4A5452]">
        No plan selected for editing.
      </div>
    );
  }

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: currentPlan.name || '',
        speed: currentPlan.speed ?? '',
        amount: currentPlan.amount ?? '',
      }}
      validationSchema={planSchema}
      onSubmit={async (values) => {
        await editPlan(values, () => {
          onClose?.();
        });
      }}
    >
      {({ values, errors, touched, handleBlur, handleSubmit, handleChange }) => (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="edit-plan-name" className="block text-sm font-medium text-[#2A3331] mb-1">
              Plan Name
            </label>
            <input
              id="edit-plan-name"
              type="text"
              name="name"
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
              <label htmlFor="edit-plan-speed" className="block text-sm font-medium text-[#2A3331] mb-1">
                Speed (Mbps)
              </label>
              <input
                id="edit-plan-speed"
                type="number"
                min="1"
                name="speed"
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
              <label htmlFor="edit-plan-amount" className="block text-sm font-medium text-[#2A3331] mb-1">
                Monthly Price (₹)
              </label>
              <input
                id="edit-plan-amount"
                type="number"
                min="1"
                name="amount"
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
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
}

export default EditPlan;
