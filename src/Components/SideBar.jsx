import { useState } from 'react';
import {
  FiX,
  FiHome,
  FiUsers,
  FiCreditCard,
  FiLayers,
  FiFileText,
  FiCalendar,
  FiShield,
  FiLogOut,
  FiKey,
  FiTool,
  FiFile,
} from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from '../assets/skycommlogo1.png';
import AxiosService from '../Common/AxiosService';
import Modal from '../Common/Modal';
import { clearAuthSession, getStoredUser } from '../Common/authUtils';

const NAV_ITEMS = [
  { to: '/home', label: 'Dashboard', icon: FiHome },
  { to: '/customer', label: 'Customers', icon: FiUsers },
  { to: '/collection', label: 'Collections', icon: FiCreditCard },
  { to: '/services', label: 'Services', icon: FiTool },
  { to: '/gst', label: 'GST Invoices', icon: FiFile },
  { to: '/plan', label: 'Internet Plans', icon: FiLayers },
  { to: '/expense', label: 'Expenses', icon: FiFileText },
  { to: '/dailycollection', label: 'Daily Settlement', icon: FiCalendar },
];

function SideBar({ isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';

  const [isPwdOpen, setIsPwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const handleSignOut = () => {
    clearAuthSession();
    toast.success('Signed out successfully');
    navigate('/', { replace: true });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 6) {
      return toast.error('Enter your current password and a new password (min 6 chars)');
    }
    setSavingPwd(true);
    try {
      const res = await AxiosService.put('/user/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(res?.data?.message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setIsPwdOpen(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#101E1D] text-[#E6ECEA] flex flex-col border-r border-[#1E3230] transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#1E3230] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt="Sky Communications"
              className="w-9 h-9 rounded-lg object-contain bg-white p-1 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-[#F1F5F4] tracking-tight truncate">
                Sky Communications
              </p>
              <p className="text-xs text-[#9CC7C2] font-medium truncate">
                Broadband Ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-[#A8BDB9] hover:text-white hover:bg-[#1A2E2C] transition-colors cursor-pointer"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[#8AA5A1]">
            Operations
          </p>

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-[#C8D8D5] hover:bg-[#192D2B] hover:text-white'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <div className="pt-5 mt-3 border-t border-[#1E3230]">
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[#8AA5A1]">
                Administration
              </p>
              <NavLink
                to="/admin"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'text-[#C8D8D5] hover:bg-[#192D2B] hover:text-white'
                  }`
                }
              >
                <FiShield className="w-[18px] h-[18px] shrink-0" />
                <span>Admin &amp; Reports</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Bottom user profile, password & sign out */}
        <div className="p-3.5 border-t border-[#1E3230] shrink-0 space-y-2.5">
          <div className="px-2.5 py-2 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1A2F2D] text-[#B7DDD8] border border-[#2B4744] flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {user?.userName?.slice(0, 2) || 'SC'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#F1F5F4] truncate">
                {user?.userName || 'Staff Member'}
              </p>
              <p className="text-xs text-[#9AB3AF] capitalize truncate">
                {user?.role || 'staff'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPwdOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#D4E2DF] hover:text-white bg-[#182B29] hover:bg-[#213A37] border border-[#28423F] transition cursor-pointer"
            >
              <FiKey className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#F7C5C2] hover:text-white bg-[#3A1D1D] hover:bg-[#8E2626] border border-[#5B2B2B] transition cursor-pointer"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <Modal
        isOpen={isPwdOpen}
        onClose={() => !savingPwd && setIsPwdOpen(false)}
        title="Change Password"
        subtitle="Update your account sign-in password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918] focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2A3331] mb-1.5">
              New Password (min 6 characters) *
            </label>
            <input
              type="password"
              minLength={6}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#C3D2CF] bg-white text-[#141918] focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D6E1DF]">
            <button
              type="button"
              onClick={() => setIsPwdOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#E5ECEB] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPwd}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
            >
              {savingPwd ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default SideBar;
