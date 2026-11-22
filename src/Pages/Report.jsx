import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../Components/Layout';
import MonthlyBillingConsole from '../Components/MonthlyBillingConsole';
import { useSelector } from 'react-redux';
import { saveAs } from 'file-saver';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import UseReloadHook from '../Hooks/UseReloadHook';
import Modal from '../Common/Modal';
import { formatCurrency, formatDate, getMonthName, getStoredUser } from '../Common/authUtils';
import {
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiUserCheck,
  FiUserX,
  FiBarChart2,
  FiShield,
  FiCalendar,
  FiKey,
  FiTrash2,
  FiRepeat,
} from 'react-icons/fi';

function Report() {
  const { monthwise = [], planwise = [], userwise = [] } = useSelector(
    (state) => state.collection
  );
  const {
    getAllCollection,
    reloadCollectionreports,
    collectionReload,
    customerReload,
    cardData,
    adminData,
  } = UseReloadHook();

  const [activeTab, setActiveTab] = useState('analytics');
  const [userData, setUserData] = useState([]);
  const [serviceCatRows, setServiceCatRows] = useState([]);
  const [serviceCatMonths, setServiceCatMonths] = useState([]);
  const [serviceCatTotals, setServiceCatTotals] = useState({
    totalCount: 0,
    totalBilled: 0,
    totalCollected: 0,
    totalPending: 0,
  });
  const [serviceMonthFilter, setServiceMonthFilter] = useState('all');
  const [loadingServiceCat, setLoadingServiceCat] = useState(true);
  const [downloadingCollection, setDownloadingCollection] = useState(false);
  const [downloadingAdmin, setDownloadingAdmin] = useState(false);
  const [receivingId, setReceivingId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const currentUser = getStoredUser();

  const loadServiceCategoryReport = useCallback(async (monthKey = 'all') => {
    setLoadingServiceCat(true);
    try {
      const params = {};
      if (monthKey && monthKey !== 'all') {
        const [yr, mo] = monthKey.split('-').map(Number);
        if (yr && mo) {
          params.year = yr;
          params.month = mo;
        }
      }
      const res = await AxiosService.get('/service/monthly-category-report', { params });
      if (res.status === 200) {
        setServiceCatRows(res.data.rows || []);
        setServiceCatMonths(res.data.availableMonths || []);
        setServiceCatTotals(
          res.data.totals || {
            totalCount: 0,
            totalBilled: 0,
            totalCollected: 0,
            totalPending: 0,
          }
        );
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load service category report');
      }
    } finally {
      setLoadingServiceCat(false);
    }
  }, []);

  const getUsers = useCallback(async () => {
    try {
      const res = await AxiosService.get('/user/getalluser');
      if (res.status === 200) {
        setUserData(res?.data?.user || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load staff accounts');
      }
    }
  }, []);

  useEffect(() => {
    getUsers();
    getAllCollection(true);
    reloadCollectionreports();
  }, [getUsers, getAllCollection, reloadCollectionreports]);

  useEffect(() => {
    loadServiceCategoryReport(serviceMonthFilter);
  }, [loadServiceCategoryReport, serviceMonthFilter]);

  const pendingSettlementCount = useMemo(
    () => (Array.isArray(adminData) ? adminData.filter((a) => a.status === 'Pending').length : 0),
    [adminData]
  );

  const pendingUserCount = useMemo(
    () =>
      Array.isArray(userData)
        ? userData.filter((u) => !u.approved && u.role !== 'admin').length
        : 0,
    [userData]
  );

  const handleDownloadCollectionExcel = async () => {
    setDownloadingCollection(true);
    try {
      const response = await AxiosService.get('/collection/download-excel', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Collection_Report.xlsx');
      toast.success('Collection report downloaded');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No collection data available to export');
    } finally {
      setDownloadingCollection(false);
    }
  };

  const handleAdminExcelDownload = async () => {
    setDownloadingAdmin(true);
    try {
      const res = await AxiosService.get('/collection/download-admin-excel', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Admin_Settlement_Report.xlsx');
      toast.success('Settlement report downloaded');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No settlement records available to export');
    } finally {
      setDownloadingAdmin(false);
    }
  };

  const handleBillingCompleted = useCallback(async () => {
    await Promise.allSettled([
      collectionReload(),
      customerReload(),
      reloadCollectionreports(),
    ]);
  }, [collectionReload, customerReload, reloadCollectionreports]);

  const handleToggleApproval = async (userId, approve) => {
    setUpdatingUserId(userId);
    try {
      const res = await AxiosService.put(`/user/add/${userId}`, { approved: approve });
      if (res.status === 200) {
        toast.success(
          res?.data?.message || (approve ? 'Staff account approved' : 'Staff approval revoked')
        );
        await getUsers();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update staff status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleRole = async (u) => {
    const nextRole = u.role === 'admin' ? 'staff' : 'admin';
    setUpdatingUserId(u._id);
    try {
      const res = await AxiosService.put(`/user/role/${u._id}`, { role: nextRole });
      if (res.status === 200) {
        toast.success(res?.data?.message || `Role updated to ${nextRole}`);
        await getUsers();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (resetPasswordVal.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setResettingPwd(true);
    try {
      const res = await AxiosService.put(`/user/reset-password/${resetTarget._id}`, {
        newPassword: resetPasswordVal,
      });
      toast.success(res?.data?.message || 'Password reset successfully');
      setResetTarget(null);
      setResetPasswordVal('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPwd(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const res = await AxiosService.delete(`/user/${userToDelete._id}`);
      toast.success(res?.data?.message || 'User deleted');
      setUserToDelete(null);
      await getUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleReceiveMoney = async (id) => {
    setReceivingId(id);
    try {
      const res = await AxiosService.put(`/collection/receive/${id}`);
      if (res.status === 200) {
        toast.success(res?.data?.message || 'Settlement marked as received');
        await getAllCollection(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update settlement status');
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#E5ECEB] text-[#4A5452] hover:bg-[#D6E1DF]'
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
              <span>Analytics & Reports</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#E5ECEB] text-[#4A5452] hover:bg-[#D6E1DF]'
              }`}
            >
              <FiRepeat className="w-4 h-4" />
              <span>Monthly Billing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settlements')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'settlements'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#E5ECEB] text-[#4A5452] hover:bg-[#D6E1DF]'
              }`}
            >
              <FiCalendar className="w-4 h-4" />
              <span>Daily Settlements</span>
              {pendingSettlementCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'settlements'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {pendingSettlementCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#E5ECEB] text-[#4A5452] hover:bg-[#D6E1DF]'
              }`}
            >
              <FiShield className="w-4 h-4" />
              <span>Staff Management</span>
              {pendingUserCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'staff'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {pendingUserCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Run Monthly Billing</span>
            </button>

            <button
              type="button"
              disabled={downloadingCollection}
              onClick={handleDownloadCollectionExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#C3D2CF] bg-white hover:bg-[#F7FAFA] disabled:opacity-60 text-[#2A3331] text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <FiDownload className="w-4 h-4" />
              <span>{downloadingCollection ? 'Exporting...' : 'Collections Excel'}</span>
            </button>

            <button
              type="button"
              disabled={downloadingAdmin}
              onClick={handleAdminExcelDownload}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <FiDownload className="w-4 h-4" />
              <span>{downloadingAdmin ? 'Exporting...' : 'Settlements Excel'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#141918]">
                Month-Wise Revenue (Subscription &amp; Service Split)
              </h3>
              {monthwise.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#D6E1DF] p-8 text-center text-sm text-[#4A5452]">
                  No monthly billing records available yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {monthwise.map((m, idx) => {
                    const paid = Number(m.totalAmountPaid) || 0;
                    const pending = Number(m.totalPending ?? m.totalAmountDue) || 0;
                    const subPaid = Number(m.subscriptionPaid ?? paid) || 0;
                    const subPending = Number(m.subscriptionPending ?? pending) || 0;
                    const svcPaid = Number(m.servicePaid) || 0;
                    const svcPending = Number(m.servicePending) || 0;
                    const expected = paid + pending;
                    const pct = expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : 0;
                    return (
                      <div
                        key={`${m._id?.year}-${m._id?.month}-${idx}`}
                        className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[#141918]">
                            {getMonthName(m._id?.month, m._id?.year)}
                          </p>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 tabular-nums">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#E5ECEB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#4A5452]">Monthly Bills</span>
                            <span className="font-semibold text-[#157347] tabular-nums">
                              {formatCurrency(subPaid)}{' '}
                              <span className="text-[#B91C1C]">
                                ({formatCurrency(subPending)} due)
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#4A5452]">Service Bills</span>
                            <span className="font-semibold text-brand-700 tabular-nums">
                              {formatCurrency(svcPaid)}{' '}
                              <span className="text-[#B45309]">
                                ({formatCurrency(svcPending)} due)
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-[#E5ECEB]">
                            <span className="text-[#4A5452] font-medium">Total Collected</span>
                            <span className="font-bold text-[#141918] tabular-nums">
                              {formatCurrency(paid)} / {formatCurrency(expected)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Month-Wise Service Category Collected Amount */}
            <section className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
              <div className="p-5 border-b border-[#E5ECEB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#141918]">
                    Service Category Collection (Month-Wise)
                  </h3>
                  <p className="text-xs text-[#4A5452] mt-0.5">
                    Collected &amp; pending revenue broken down by each service category per month.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceMonthFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      serviceMonthFilter === 'all'
                        ? 'bg-brand-600 text-white'
                        : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
                    }`}
                  >
                    All Months
                  </button>
                  {serviceCatMonths.slice(0, 6).map((m) => {
                    const key = `${m.year}-${m.month}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setServiceMonthFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          serviceMonthFilter === key
                            ? 'bg-brand-600 text-white'
                            : 'bg-[#E5ECEB] text-[#2A3331] hover:bg-[#D6E1DF]'
                        }`}
                      >
                        {getMonthName(m.month, m.year)}
                      </button>
                    );
                  })}
                  {serviceCatMonths.length > 6 && (
                    <select
                      value={serviceMonthFilter}
                      onChange={(e) => setServiceMonthFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#C3D2CF] bg-white text-[#2A3331]"
                    >
                      <option value="all">All Months</option>
                      {serviceCatMonths.map((m) => (
                        <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                          {getMonthName(m.month, m.year)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Service Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5ECEB] border-b border-[#E5ECEB] bg-[#F7FAFA] text-xs">
                <div className="px-5 py-3">
                  <p className="text-[#4A5452]">Total Service Jobs</p>
                  <p className="font-display text-lg font-extrabold text-[#141918] tabular-nums">
                    {serviceCatTotals.totalCount}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[#4A5452]">Total Billed</p>
                  <p className="font-display text-lg font-extrabold text-[#141918] tabular-nums">
                    {formatCurrency(serviceCatTotals.totalBilled)}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[#4A5452]">Service Collected</p>
                  <p className="font-display text-lg font-extrabold text-[#157347] tabular-nums">
                    {formatCurrency(serviceCatTotals.totalCollected)}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[#4A5452]">Pending Service Due</p>
                  <p className="font-display text-lg font-extrabold text-[#B91C1C] tabular-nums">
                    {formatCurrency(serviceCatTotals.totalPending)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Service Category</th>
                      <th className="py-3 px-4 text-right">Jobs</th>
                      <th className="py-3 px-4 text-right">Total Billed</th>
                      <th className="py-3 px-4 text-right">Collected</th>
                      <th className="py-3 px-4 text-right">Pending</th>
                      <th className="py-3 px-4 w-36">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECEB] text-sm">
                    {loadingServiceCat ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#596361]">
                          <span className="loading loading-spinner loading-md text-brand-600" />
                        </td>
                      </tr>
                    ) : serviceCatRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#4A5452]">
                          No service charges recorded for this period yet.
                        </td>
                      </tr>
                    ) : (
                      serviceCatRows.map((row, idx) => {
                        const pct =
                          row.totalBilled > 0
                            ? Math.min(100, Math.round((row.totalCollected / row.totalBilled) * 100))
                            : 0;
                        return (
                          <tr
                            key={`${row.year}-${row.month}-${row.serviceName}-${idx}`}
                            className="hover:bg-[#F7FAFA]"
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-[#4A5452]">
                              {getMonthName(row.month, row.year)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#141918]">
                                {row.serviceName}
                              </span>
                              {row.gstCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                                  {row.gstCount} GST
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#2A3331]">
                              {row.count}
                            </td>
                            <td className="py-3 px-4 text-right font-medium tabular-nums text-[#2A3331]">
                              {formatCurrency(row.totalBilled)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold tabular-nums text-[#157347]">
                              {formatCurrency(row.totalCollected)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#B91C1C]">
                              {formatCurrency(row.totalPending)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-[#E5ECEB] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-brand-600 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-[#2A3331] tabular-nums w-9 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#141918]">Plan-Wise Performance</h3>
              {planwise.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#D6E1DF] p-8 text-center text-sm text-[#4A5452]">
                  No plan-level billing data available yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {planwise.map((p, idx) => (
                    <div
                      key={p.planId || idx}
                      className="bg-white rounded-2xl border border-[#D6E1DF] p-5 space-y-3"
                    >
                      <p className="text-sm font-bold text-[#141918] truncate">
                        {p.planName || 'Unassigned Plan'}
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#4A5452]">Collected</span>
                          <span className="font-semibold text-emerald-600 tabular-nums">
                            {formatCurrency(p.totalCollected)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4A5452]">Pending</span>
                          <span className="font-semibold text-rose-600 tabular-nums">
                            {formatCurrency(p.totalPending)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5ECEB]">
                <h3 className="text-base font-bold text-[#141918]">
                  Monthly Collection by Staff
                </h3>
                <p className="text-xs text-[#4A5452]">
                  Accurately reflects individual partial payments, advances, and reversals per staff.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Billing Period</th>
                      <th className="py-3 px-4 text-right">Total Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECEB] text-sm">
                    {userwise.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-[#4A5452]">
                          No staff monthly collections recorded yet.
                        </td>
                      </tr>
                    ) : (
                      userwise.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F7FAFA]">
                          <td className="py-3 px-4 text-[#596361] tabular-nums">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-[#141918]">
                            {row.userName || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-[#4A5452]">
                            {getMonthName(row.month, row.year)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-emerald-600">
                            {formatCurrency(row.totalCollected)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#141918]">
                Current Month Day-Wise Staff Breakdown
              </h3>
              {cardData.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#D6E1DF] p-8 text-center text-sm text-[#4A5452]">
                  No staff collections logged yet this month.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cardData.map((item, idx) => (
                    <div
                      key={`${item.day}-${item.type}-${idx}`}
                      className="bg-white rounded-2xl border border-[#D6E1DF] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-600">Day {item.day}</p>
                        <p className="text-sm font-bold text-[#141918] truncate">
                          {item.collectedBy?.userName || 'Unknown'}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                            item.type === 'service'
                              ? 'bg-brand-50 text-brand-700 border-brand-200'
                              : item.type === 'advance'
                                ? 'bg-[#EDF6FC] text-[#0369A1] border-[#BAE0F5]'
                                : 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]'
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p
                        className={`text-lg font-bold tabular-nums shrink-0 ${
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
            </section>
          </div>
        )}

        {/* TAB 2: MONTHLY BILLING CONSOLE */}
        {activeTab === 'billing' && (
          <MonthlyBillingConsole onBillingCompleted={handleBillingCompleted} />
        )}

        {/* TAB 3: DAILY SETTLEMENTS */}
        {activeTab === 'settlements' && (
          <div className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5ECEB] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#141918]">
                  Staff Daily Collection Settlements (Subscription &amp; Service Split)
                </h3>
                <p className="text-xs text-[#4A5452]">
                  Verify monthly bill collections, service bill collections, and attached itemized
                  expenses per staff handover.
                </p>
              </div>
              <span className="text-xs font-medium text-[#4A5452]">
                {adminData.length} record(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Monthly Bills</th>
                    <th className="py-3 px-4 text-right">Service Bills</th>
                    <th className="py-3 px-4 text-right">Total Collected</th>
                    <th className="py-3 px-4 text-right">Expense</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-right">Net Received</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEB] text-sm">
                  {adminData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-[#4A5452]">
                        No daily settlements submitted yet.
                      </td>
                    </tr>
                  ) : (
                    adminData.map((item, idx) => {
                      const isPending = item.status === 'Pending';
                      const expenseTotal =
                        Number(item.totalExpenseAmount ?? item?.expenseId?.amount) || 0;
                      const remarksText =
                        item.combinedRemarks || item?.expenseId?.remarks || '—';
                      const subAmt = Number(item.subscriptionAmount) || 0;
                      const svcAmt = Number(item.serviceAmount) || 0;
                      const expectedNet = Math.max(
                        0,
                        (Number(item.collectionAmount) || 0) - expenseTotal
                      );
                      return (
                        <tr key={item._id} className="hover:bg-[#F7FAFA]">
                          <td className="py-3.5 px-4 text-[#596361] tabular-nums">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-semibold text-[#141918]">
                            {item?.userId?.userName || '—'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#4A5452]">
                            {formatDate(item?.collectionDate)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[#141918]">
                            {formatCurrency(subAmt)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-brand-700">
                            {formatCurrency(svcAmt)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#141918]">
                            {formatCurrency(item.collectionAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-[#B45309] font-medium">
                            {formatCurrency(expenseTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#4A5452] max-w-[200px] break-words">
                            {remarksText}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#157347]">
                            {isPending
                              ? formatCurrency(expectedNet)
                              : formatCurrency(item.recievedAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                isPending
                                  ? 'bg-[#FEF6E7] text-[#B45309] border-[#F2D59B]'
                                  : 'bg-[#EAF6EF] text-[#157347] border-[#BBE2CC]'
                              }`}
                            >
                              {isPending ? 'Pending' : 'Received'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <button
                                type="button"
                                disabled={receivingId === item._id}
                                onClick={() => handleReceiveMoney(item._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#157347] hover:bg-[#115E3A] disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer"
                              >
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                <span>
                                  {receivingId === item._id ? 'Saving...' : 'Mark Received'}
                                </span>
                              </button>
                            ) : (
                              <span className="text-xs text-[#596361] font-medium">Verified</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5ECEB]">
              <h3 className="text-base font-bold text-[#141918]">Staff Accounts & Roles</h3>
              <p className="text-xs text-[#4A5452]">
                Approve staff, promote/demote roles, reset passwords, or delete rejected accounts.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7FAFA] border-b border-[#D6E1DF] text-xs font-semibold uppercase tracking-wider text-[#4A5452]">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEB] text-sm">
                  {userData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#4A5452]">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    userData.map((u, idx) => {
                      const isSelf = u._id === currentUser?._id;
                      const isTargetAdmin = u.role === 'admin';
                      const isBusy = updatingUserId === u._id;

                      return (
                        <tr key={u._id} className="hover:bg-[#F7FAFA]">
                          <td className="py-3.5 px-4 text-[#596361] tabular-nums">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#141918]">
                              {u.userName} {isSelf && <span className="text-xs text-brand-600">(You)</span>}
                            </p>
                            <p className="text-xs text-[#4A5452]">{u.email}</p>
                          </td>
                          <td className="py-3.5 px-4 text-[#2A3331] tabular-nums">{u.mobile}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                                isTargetAdmin
                                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                                  : 'bg-[#E5ECEB] text-[#4A5452] border-[#D6E1DF]'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                u.approved || isTargetAdmin
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {u.approved || isTargetAdmin ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {!isSelf && !isTargetAdmin && (
                                !u.approved ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleToggleApproval(u._id, true)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer"
                                  >
                                    <FiUserCheck className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleToggleApproval(u._id, false)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-60 text-amber-700 text-xs font-semibold transition cursor-pointer"
                                  >
                                    <FiUserX className="w-3.5 h-3.5" />
                                    <span>Revoke</span>
                                  </button>
                                )
                              )}

                              {!isSelf && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleToggleRole(u)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#D6E1DF] bg-[#F7FAFA] hover:bg-[#E5ECEB] text-[#2A3331] text-xs font-semibold transition cursor-pointer"
                                >
                                  {isTargetAdmin ? 'Make Staff' : 'Make Admin'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setResetTarget(u);
                                  setResetPasswordVal('');
                                }}
                                title="Reset password"
                                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-200 transition cursor-pointer"
                              >
                                <FiKey className="w-4 h-4" />
                              </button>

                              {!isSelf && !isTargetAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(u)}
                                  title="Delete user"
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
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
        )}

        {/* Admin Reset User Password Modal */}
        <Modal
          isOpen={Boolean(resetTarget)}
          onClose={() => !resettingPwd && setResetTarget(null)}
          title="Reset Staff Password"
          subtitle={`Set a new password for ${resetTarget?.userName || ''} (${resetTarget?.email || ''})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2A3331] mb-1">
                New Password (min 6 characters) *
              </label>
              <input
                type="password"
                minLength={6}
                required
                placeholder="Enter new temporary password"
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918] focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resettingPwd}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
              >
                {resettingPwd ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
          isOpen={Boolean(userToDelete)}
          onClose={() => !deletingUser && setUserToDelete(null)}
          title="Delete Staff Account"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-[#4A5452]">
              Are you sure you want to delete the account for{' '}
              <span className="font-semibold text-[#141918]">{userToDelete?.userName}</span> (
              {userToDelete?.email})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
              >
                {deletingUser ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

export default Report;
