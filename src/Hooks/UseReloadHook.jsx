import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import AxiosService from '../Common/AxiosService';
import { useDispatch } from 'react-redux';
import { addAllPlans } from '../Redux/Reducer/PlanReducer';
import { addAllCustomer } from '../Redux/Reducer/CustomerReducer';
import {
  addAllCollections,
  addAllDataforadmin,
  addAllmonthwise,
  addAllPlanwise,
} from '../Redux/Reducer/CollectionReducer';
import { getStoredUser } from '../Common/authUtils';

function UseReloadHook() {
  const dispatch = useDispatch();
  const [cardData, setCardData] = useState([]);
  const [todaySplit, setTodaySplit] = useState({
    subscriptionAmount: 0,
    serviceAmount: 0,
    advanceAmount: 0,
    totalCollected: 0,
  });
  const [adminData, setAdminData] = useState([]);

  const ReloadPlan = useCallback(async () => {
    try {
      const res = await AxiosService.get('/plan/getallplan');
      if (res.status === 200) {
        dispatch(addAllPlans(res?.data?.plan || []));
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load plans', {
          toastId: 'reload-plan-error',
        });
      }
    }
  }, [dispatch]);

  const customerReload = useCallback(async () => {
    try {
      const res = await AxiosService.get('/customer/getallcustomer');
      if (res.status === 200) {
        dispatch(addAllCustomer(res?.data?.customer || []));
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load customers', {
          toastId: 'reload-customer-error',
        });
      }
    }
  }, [dispatch]);

  const collectionReload = useCallback(async () => {
    try {
      const res = await AxiosService.get('/collection/getcurrentmonth');
      if (res.status === 200) {
        dispatch(addAllCollections(res?.data?.collection || []));
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load collections', {
          toastId: 'reload-collection-error',
        });
      }
    }
  }, [dispatch]);

  const reloadCollectionreports = useCallback(async () => {
    try {
      const [res, res1, res2] = await Promise.all([
        AxiosService.get('/collection/getmonthwisereport'),
        AxiosService.get('/collection/gettotalbyplan'),
        AxiosService.get('/collection/getmonthlycollectionbyuser'),
      ]);

      if (res.status === 200) {
        dispatch(addAllmonthwise(res?.data?.report || []));
      }
      if (res1.status === 200) {
        dispatch(addAllPlanwise(res1?.data?.result || []));
      }
      if (res2.status === 200) {
        dispatch(addAllDataforadmin(res2?.data?.result || []));
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load collection reports', {
          toastId: 'reload-reports-error',
        });
      }
    }
  }, [dispatch]);

  const getAllCollection = useCallback(async (includeAdmin = false) => {
    try {
      const currentUser = getStoredUser();
      const shouldFetchAdmin = includeAdmin && currentUser?.role === 'admin';

      const requests = [AxiosService.get('/customer/getcollection')];
      if (shouldFetchAdmin) {
        requests.push(AxiosService.get('/collection/getalladmin'));
      }

      const [res1, res2] = await Promise.all(requests);
      if (res1?.status === 200) {
        setCardData(res1?.data?.data || []);
        if (res1?.data?.todaySplit) {
          setTodaySplit(res1.data.todaySplit);
        }
      }
      if (res2?.status === 200) {
        setAdminData(res2?.data?.data || []);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || 'Failed to load daily collection summary', {
          toastId: 'reload-daily-summary-error',
        });
      }
    }
  }, []);

  return {
    ReloadPlan,
    customerReload,
    collectionReload,
    reloadCollectionreports,
    getAllCollection,
    cardData,
    todaySplit,
    adminData,
  };
}

export default UseReloadHook;
