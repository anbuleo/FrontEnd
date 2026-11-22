import { useState } from 'react';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function UseSignUpHook() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signUp = async ({ userName, email, password, mobile }) => {
    setLoading(true);
    try {
      const res = await AxiosService.post('/user/signup', {
        userName: userName.trim(),
        email: email.trim(),
        password,
        mobile: String(mobile).trim(),
      });

      if (res.status === 201) {
        toast.success(
          res?.data?.message || 'Account created! Please sign in once approved by admin.'
        );
        navigate('/', { replace: true });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK'
          ? 'Unable to connect to server. Please try again.'
          : 'Registration failed. Please check your details.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, signUp };
}

export default UseSignUpHook;
