import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../Components/Layout';
import CreatePlan from '../Components/SubComponents/CreatePlan';
import PlanCard from '../Components/SubComponents/PlanCard';
import Modal from '../Common/Modal';
import UseReloadHook from '../Hooks/UseReloadHook';
import { getStoredUser } from '../Common/authUtils';
import { FiPlus } from 'react-icons/fi';

function Plan() {
  const { ReloadPlan, customerReload } = UseReloadHook();
  const { plan = [] } = useSelector((state) => state.plan);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isAdmin = getStoredUser()?.role === 'admin';

  useEffect(() => {
    ReloadPlan();
    customerReload();
  }, [ReloadPlan, customerReload]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#D6E1DF]">
          <div>
            <h2 className="text-lg font-bold text-[#141918]">Broadband Packages</h2>
            <p className="text-sm text-[#4A5452]">
              {plan.length} active {plan.length === 1 ? 'plan' : 'plans'} available for subscriber assignment
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          )}
        </div>

        <PlanCard />

        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Internet Plan"
          subtitle="Add a new speed tier and monthly pricing package"
        >
          <CreatePlan onClose={() => setIsCreateOpen(false)} />
        </Modal>
      </div>
    </Layout>
  );
}

export default Plan;
