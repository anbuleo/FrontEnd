import { useState } from 'react';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import UseReloadHook from './UseReloadHook';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, setStoredUser } from '../Common/authUtils';

function UseSignInHook() {
  const [loading, setLoading] = useState(false);
  const { ReloadPlan, customerReload, collectionReload, reloadCollectionreports } =
    UseReloadHook();
  const navigate = useNavigate();

  const signIn = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await AxiosService.post('/user/signin', {
        email: email.trim(),
        password,
      });

      if (res.status === 200) {
        const { token, rest } = res.data;
        setAuthToken(token);
        setStoredUser(rest);
        toast.success(`Welcome back, ${rest?.userName || 'User'}!`);

        const isApproved = rest?.approved === true || rest?.role === 'admin';
        if (isApproved) {
          await Promise.allSettled([
            ReloadPlan(),
            customerReload(),
            collectionReload(),
            reloadCollectionreports(),
          ]);
        }

        navigate('/home', { replace: true });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK'
          ? 'Unable to connect to server. Please check your connection.'
          : 'Sign in failed. Please try again.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, signIn };
}

export default UseSignInHook;
