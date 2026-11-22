import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiClock, FiRefreshCw, FiLogOut } from 'react-icons/fi';
import logo from '../assets/skycommlogo1.png';
import AxiosService from '../Common/AxiosService';
import { clearAuthSession, getStoredUser, setStoredUser } from '../Common/authUtils';

function WaittingForApproval() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const user = getStoredUser();

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await AxiosService.get('/user/me');
      const freshUser = res?.data?.user;
      if (freshUser) {
        setStoredUser(freshUser);
        if (freshUser.approved === true || freshUser.role === 'admin') {
          toast.success('Your account has been approved! Entering portal...');
          window.location.replace('/home');
          return;
        }
        toast.info('Your account is still pending administrator approval.');
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Unable to check status right now.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    toast.success('Signed out');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F1F5F4] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#D6E1DF] overflow-hidden">
        <div className="bg-[#101E1D] px-6 py-8 text-center border-b border-[#1E3230]">
          <img
            src={logo}
            alt="Sky Communications"
            className="w-16 h-16 mx-auto rounded-2xl object-contain bg-white p-2 mb-3"
          />
          <h1 className="font-display text-xl font-bold text-white">Sky Communications</h1>
          <p className="text-xs text-[#A3CBC6] mt-0.5">Billing &amp; Collection Portal</p>
        </div>

        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FEF6E7] border border-[#F2D59B] text-[#B45309] flex items-center justify-center mx-auto mb-4">
            <FiClock className="w-7 h-7" />
          </div>

          <h2 className="font-display text-2xl font-bold text-[#141918] mb-2">
            Approval Pending
          </h2>
          <p className="text-sm text-[#4A5452] leading-relaxed mb-6">
            Hi <span className="font-semibold text-[#141918]">{user?.userName || 'there'}</span>,
            your staff registration is currently under review. Once an administrator approves your
            account, you will gain full access to the portal.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Status'}</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="py-2.5 px-4 rounded-xl border border-[#C3D2CF] hover:bg-[#E5ECEB] text-[#2A3331] text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaittingForApproval;
