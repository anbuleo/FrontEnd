import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import WaittingForApproval from '../Pages/WaittingForApproval';
import { getStoredUser } from './authUtils';

function AdminControl({ children }) {
  const data = getStoredUser();
  const isApproved = data?.approved === true || data?.role === 'admin';
  const isAdmin = data?.role === 'admin';

  useEffect(() => {
    if (data && isApproved && !isAdmin) {
      toast.warning('Admin access required', { toastId: 'admin-only-warning' });
    }
  }, [data, isApproved, isAdmin]);

  if (!data) {
    return <Navigate to="/" replace />;
  }

  if (!isApproved) {
    return <WaittingForApproval />;
  }

  return isAdmin ? children : <Navigate to="/home" replace />;
}

export default AdminControl;
