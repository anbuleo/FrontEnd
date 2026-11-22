import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedPlan } from '../../Redux/Reducer/PlanReducer';
import EditPlan from './EditPlan';
import UseCreatePlan from '../../Hooks/UseCreatePlan';
import Modal from '../../Common/Modal';
import { formatCurrency, getStoredUser } from '../../Common/authUtils';
import { FiCheck, FiEdit2, FiTrash2, FiWifi, FiUsers, FiLayers } from 'react-icons/fi';

function PlanCard() {
  const { plan = [] } = useSelector((state) => state.plan);
  const { customer = [] } = useSelector((state) => state.customer);
  const dispatch = useDispatch();
  const { deletePlan, loading } = UseCreatePlan();
  const isAdmin = getStoredUser()?.role === 'admin';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const subscriberCountByPlan = useMemo(() => {
    const counts = {};
    if (Array.isArray(customer)) {
      customer.forEach((c) => {
        const pId = typeof c.planId === 'object' ? c.planId?._id : c.planId;
        if (pId) {
          counts[pId] = (counts[pId] || 0) + 1;
        }
      });
    }
    return counts;
  }, [customer]);

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    await deletePlan(planToDelete._id, () => {
      setPlanToDelete(null);
    });
  };

  if (!Array.isArray(plan) || plan.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#D6E1DF] p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E5ECEB] text-[#596361] flex items-center justify-center mx-auto mb-3">
          <FiLayers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#141918]">No internet plans configured</h3>
        <p className="text-sm text-[#4A5452] mt-1">
          {isAdmin
            ? 'Click "Create Plan" above to add your first broadband package.'
            : 'No plans have been published by the administrator yet.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plan.map((item) => {
          const subscribers = subscriberCountByPlan[item._id] || 0;
          return (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-[#D6E1DF] hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              {/* Top Deep Pine tariff header */}
              <div className="p-6 bg-[#101E1D] text-white border-b border-[#1E3230]">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1B3331] text-[#A3CBC6] border border-[#2C4F4B]">
                    <FiWifi className="w-3.5 h-3.5" />
                    {item.speed} Mbps
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#C7D5D3]">
                    <FiUsers className="w-3.5 h-3.5 text-[#9AB3AF]" />
                    {subscribers} active
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold tracking-tight truncate text-white">
                  {item.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold tabular-nums text-white">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-xs text-[#A8BDB9]">/ month</span>
                </div>
              </div>

              {/* Plan features & actions */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <ul className="space-y-2.5 text-sm text-[#4A5452] mb-6">
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>Up to {item.speed} Mbps high-speed fiber</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>Unlimited data usage</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>Zero activation fee</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>Flexible 1 / 3 / 6 / 12 month billing</span>
                  </li>
                </ul>

                {isAdmin && (
                  <div className="pt-4 border-t border-[#E5ECEB] flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(setSelectedPlan(item._id));
                        setIsEditOpen(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#D6E1DF] hover:border-brand-200 hover:bg-brand-50 text-[#2A3331] hover:text-brand-700 text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanToDelete(item)}
                      className="py-2 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Single state-controlled Edit Plan Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Internet Plan"
        subtitle="Update package name, speed limit, or monthly tariff"
      >
        <EditPlan onClose={() => setIsEditOpen(false)} />
      </Modal>

      {/* Delete Plan Confirmation Modal */}
      <Modal
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        title="Delete Internet Plan"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#4A5452]">
            Are you sure you want to delete the plan{' '}
            <span className="font-semibold text-[#141918]">{planToDelete?.name}</span> (
            {formatCurrency(planToDelete?.amount)}/mo)? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={() => setPlanToDelete(null)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {loading && <span className="loading loading-spinner loading-xs" />}
              <span>{loading ? 'Deleting...' : 'Delete Plan'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default PlanCard;
