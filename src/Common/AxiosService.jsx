import axios from 'axios';
import { toast } from 'react-toastify';
import { clearAuthSession, getAuthToken, setAuthToken, setStoredUser } from './authUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AxiosService = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let activeRefreshPromise = null;

const attemptSilentRefresh = async () => {
  const currentToken = getAuthToken();
  if (!currentToken) return null;

  if (!activeRefreshPromise) {
    activeRefreshPromise = axios
      .post(
        `${API_BASE}/user/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${currentToken}` },
          timeout: 15000,
        }
      )
      .then((res) => {
        const freshToken = res?.data?.token;
        const freshUser = res?.data?.user;
        if (freshToken) {
          setAuthToken(freshToken);
          if (freshUser) setStoredUser(freshUser);
          return freshToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        activeRefreshPromise = null;
      });
  }

  return activeRefreshPromise;
};

AxiosService.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

AxiosService.interceptors.response.use(
  (response) => {
    const refreshed = response?.headers?.['x-refreshed-token'];
    if (refreshed) {
      setAuthToken(refreshed);
    }
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const originalConfig = error?.config;
    const requestUrl = originalConfig?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/user/signin') ||
      requestUrl.includes('/user/signup') ||
      requestUrl.includes('/user/refresh');

    if (status === 401 && !isAuthEndpoint && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;
      const freshToken = await attemptSilentRefresh();
      if (freshToken) {
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers.Authorization = `Bearer ${freshToken}`;
        return AxiosService(originalConfig);
      }

      clearAuthSession();
      toast.error(
        error?.response?.data?.message || 'Session expired. Please sign in again.',
        { toastId: 'session-expired' }
      );
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosService;
