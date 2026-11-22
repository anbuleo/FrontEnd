import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import WaittingForApproval from '../Pages/WaittingForApproval';
import { clearAuthSession, getAuthToken, getStoredUser } from './authUtils';

function ProdectedRoute({ children }) {
  const token = getAuthToken();
  const data = getStoredUser();

  useEffect(() => {
    if (!token || !data) {
      clearAuthSession();
    }
  }, [token, data]);

  if (!token || !data) {
    return <Navigate to="/" replace />;
  }

  const isApproved = data.approved === true || data.role === 'admin';
  return isApproved ? children : <WaittingForApproval />;
}

export default ProdectedRoute;
