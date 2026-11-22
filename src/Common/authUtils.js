export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('data');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user && typeof user === 'object') {
    localStorage.setItem('data', JSON.stringify(user));
  }
};

export const getAuthToken = () => {
  const localToken = localStorage.getItem('token');
  if (localToken && localToken !== 'undefined' && localToken !== 'null') {
    return localToken;
  }
  const legacySessionToken = sessionStorage.getItem('token');
  if (legacySessionToken && legacySessionToken !== 'undefined' && legacySessionToken !== 'null') {
    localStorage.setItem('token', legacySessionToken);
    sessionStorage.removeItem('token');
    return legacySessionToken;
  }
  return null;
};

export const setAuthToken = (token) => {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('token', token);
    sessionStorage.removeItem('token');
  }
};

let logoutHandler = null;

export const registerLogoutHandler = (fn) => {
  logoutHandler = fn;
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('data');
  localStorage.removeItem('persist:root');
  if (typeof logoutHandler === 'function') {
    logoutHandler();
  }
};

export const formatCurrency = (amount) => {
  const num = Number(amount);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const getMonthName = (monthNum, year) => {
  const idx = Number(monthNum) - 1;
  const monthLabel = MONTH_NAMES[idx] || `Month ${monthNum}`;
  return year ? `${monthLabel} ${year}` : monthLabel;
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
