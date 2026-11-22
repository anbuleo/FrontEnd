import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import EditCustomer from '../../Pages/EditCustomer';
import { selectCustomerForEdit } from '../../Redux/Reducer/CustomerReducer';
import UseReloadHook from '../../Hooks/UseReloadHook';
import { toast } from 'react-toastify';
import AxiosService from '../../Common/AxiosService';
import Modal from '../../Common/Modal';
import { formatCurrency, formatDate, formatTime, getStoredUser } from '../../Common/authUtils';
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'gst', label: 'GST Buyers' },
  { key: 'due', label: 'Due Pending' },
  { key: 'advance', label: 'Advance Credit' },
  { key: 'settled', label: 'Settled' },
  { key: 'inactive', label: 'Paused / Disconnected' },
];

const TXN_BADGE_STYLES = {
  payment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  advance: 'bg-sky-50 text-sky-700 border-sky-200',
  due: 'bg-amber-50 text-amber-700 border-amber-200',
  remainbalance: 'bg-brand-50 text-brand-800 border-brand-200',
  reversal: 'bg-rose-50 text-rose-700 border-rose-200',
  service: 'bg-brand-50 text-brand-700 border-brand-200',
};

function CustomerTable() {
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(50);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const { customer = [] } = useSelector((state) => state.customer);
  const { plan = [] } = useSelector((state) => state.plan);
  const isAdmin = getStoredUser()?.role === 'admin';
  const { customerReload, ReloadPlan } = UseReloadHook();
  const dispatch = useDispatch();

  useEffect(() => {
    customerReload();
    ReloadPlan();
  }, [customerReload, ReloadPlan]);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, statusFilter]);

  const planLookup = useMemo(() => {
    const map = {};
    if (Array.isArray(plan)) {
      plan.forEach((p) => {
        map[p._id] = p;
      });
    }
    return map;
  }, [plan]);

  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customer)) return [];
    const q = searchQuery.trim().toLowerCase();

    return customer.filter((c) => {
      const name = String(c?.name || '').toLowerCase();
      const company = String(c?.companyName || '').toLowerCase();
      const gstin = String(c?.gstin || '').toLowerCase();
      const mobile = String(c?.mobile || '').toLowerCase();
      const address = String(c?.address || '').toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        company.includes(q) ||
        gstin.includes(q) ||
        mobile.includes(q) ||
        address.includes(q);
      if (!matchesSearch) return false;

      if (statusFilter === 'gst') return Boolean(c.isGstCustomer);
      if (statusFilter === 'due') return Number(c.remainingBalance) > 0;
      if (statusFilter === 'advance') return Number(c.advanceAmount) > 0 && Number(c.remainingBalance) <= 0;
      if (statusFilter === 'settled') return Number(c.remainingBalance) <= 0 && Number(c.advanceAmount) <= 0;
      if (statusFilter === 'inactive') return c.status === 'suspended' || c.status === 'disconnected';
      return true;
    });
  }, [customer, searchQuery, statusFilter]);

  const visibleCustomers = filteredCustomers.slice(0, visibleCount);

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      const res = await AxiosService.delete(`/customer/deletecustomer/${customerToDelete._id}`);
      if (res.status === 200) {
        toast.success(res?.data?.message || 'Customer deleted successfully');
        setCustomerToDelete(null);
        await customerReload();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const getPlanInfo = (c) => {
    if (c.planId && typeof c.planId === 'object') return c.planId;
    return planLookup[c.planId] || null;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[#E5ECEB] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="w-4 h-4 text-[#596361] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, mobile, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[#D6E1DF] bg-[#F7FAFA] focus:bg-white text-[#141918] placeholder:text-[#596361] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
              <th className="py-3.5 px-4 w-12">#</th>
              <th className="py-3.5 px-4">Subscriber</th>
              <th className="py-3.5 px-4">Plan</th>
              <th className="py-3.5 px-4 text-right">Advance</th>
              <th className="py-3.5 px-4 text-right">Due</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5ECEB] text-sm">
            {visibleCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center text-[#596361]">
                    <FiUsers className="w-8 h-8 mb-2" />
                    <p className="text-sm font-medium text-[#4A5452]">No customers match your filter</p>
                    <p className="text-xs text-[#596361] mt-0.5">
                      Try clearing the search box or switching status filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleCustomers.map((c, index) => {
                const planInfo = getPlanInfo(c);
                const isExpanded = expandedCustomerId === c._id;
                const due = Number(c.remainingBalance) || 0;
                const advance = Number(c.advanceAmount) || 0;

                const statusBadge =
                  due > 0
                    ? { label: 'Due Pending', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
                    : advance > 0
                      ? { label: 'Advance', cls: 'bg-sky-50 text-sky-700 border-sky-200' }
                      : { label: 'Settled', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

                return (
                  <React.Fragment key={c._id}>
                    <tr className="hover:bg-[#F7FAFA] transition-colors">
                      <td className="py-3.5 px-4 text-[#596361] tabular-nums">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-[#141918]">
                            {c.isGstCustomer && c.companyName ? c.companyName : c.name}
                          </p>
                          {c.isGstCustomer && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-brand-100 text-brand-700 border border-brand-200">
                              GST
                            </span>
                          )}
                          {c.status && c.status !== 'active' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-[#2A3331]">
                              {c.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4A5452] tabular-nums">
                          {c.mobile}
                          {c.gstin ? ` • ${c.gstin}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        {planInfo ? (
                          <div>
                            <p className="font-medium text-[#1E2524]">{planInfo.name}</p>
                            <p className="text-xs text-[#4A5452] tabular-nums">
                              {formatCurrency(planInfo.amount)}/mo
                              {planInfo.speed ? ` • ${planInfo.speed} Mbps` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#596361]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium tabular-nums text-sky-700">
                        {formatCurrency(advance)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-rose-600">
                        {formatCurrency(due)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/services?customerId=${c._id}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition"
                          >
                            + Service
                          </Link>
                          <button
                            type="button"
                            onClick={() => setExpandedCustomerId(isExpanded ? null : c._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#E5ECEB] hover:bg-[#D6E1DF] text-[#2A3331] transition cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'History'}</span>
                            {isExpanded ? (
                              <FiChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <FiChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  dispatch(selectCustomerForEdit(c._id));
                                  setIsEditOpen(true);
                                }}
                                title="Edit customer"
                                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-200 transition cursor-pointer"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomerToDelete(c)}
                                title="Delete customer"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#F7FAFA]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D6E1DF]">
                              <div className="flex items-center gap-2 text-xs text-[#4A5452]">
                                <FiMapPin className="w-4 h-4 text-[#596361] shrink-0" />
                                <span className="font-medium text-[#1E2524]">Address:</span>
                                <span>{c.address || 'Not provided'}</span>
                              </div>
                              <span className="text-xs font-medium text-[#4A5452]">
                                {c.transactions?.length || 0} transaction record(s)
                              </span>
                            </div>

                            {c.transactions?.length > 0 ? (
                              <div className="overflow-x-auto rounded-xl border border-[#D6E1DF] bg-white">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-[#4A5452] uppercase tracking-wider">
                                      <th className="py-2.5 px-4">Date & Time</th>
                                      <th className="py-2.5 px-4">Type</th>
                                      <th className="py-2.5 px-4 text-right">Amount</th>
                                      <th className="py-2.5 px-4">Recorded By</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#E5ECEB]">
                                    {[...c.transactions].reverse().map((t, idx) => (
                                      <tr key={t._id || idx} className="hover:bg-[#F7FAFA]">
                                        <td className="py-2.5 px-4 text-[#2A3331] whitespace-nowrap">
                                          {formatDate(t.date)}{' '}
                                          <span className="text-[#596361]">{formatTime(t.date)}</span>
                                        </td>
                                        <td className="py-2.5 px-4">
                                          <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                                              TXN_BADGE_STYLES[t.type] ||
                                              'bg-[#E5ECEB] text-[#4A5452] border-[#D6E1DF]'
                                            }`}
                                          >
                                            {t.type}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-[#141918]">
                                          {formatCurrency(t.amount)}
                                        </td>
                                        <td className="py-2.5 px-4 text-[#4A5452]">
                                          <p>{t.collectedBy?.userName || 'System'}</p>
                                          {t.note && (
                                            <p className="text-xs text-rose-600 mt-0.5">{t.note}</p>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-[#4A5452] text-center py-3">
                                No transaction history recorded yet for this subscriber.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Load More pagination */}
      {filteredCustomers.length > 0 && (
        <div className="px-5 py-3.5 border-t border-[#E5ECEB] bg-[#F7FAFA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4A5452]">
          <p>
            Showing <span className="font-semibold text-[#1E2524]">{visibleCustomers.length}</span>{' '}
            of <span className="font-semibold text-[#1E2524]">{filteredCustomers.length}</span>{' '}
            subscribers
          </p>
          {visibleCount < filteredCustomers.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#C3D2CF] hover:bg-[#E5ECEB] text-[#2A3331] font-semibold transition cursor-pointer"
            >
              Load More ({filteredCustomers.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer Details"
        subtitle="Update subscriber profile, plan assignment, or balances"
      >
        <EditCustomer onClose={() => setIsEditOpen(false)} />
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        title="Delete Customer"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#4A5452]">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-[#141918]">{customerToDelete?.name}</span> (
            {customerToDelete?.mobile})? All associated monthly collection records for this customer
            will also be removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
            <button
              type="button"
              onClick={() => setCustomerToDelete(null)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {deleting && <span className="loading loading-spinner loading-xs" />}
              <span>{deleting ? 'Deleting...' : 'Delete Customer'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CustomerTable;
