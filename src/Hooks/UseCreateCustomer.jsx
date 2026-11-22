import { useState } from 'react';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import UseReloadHook from './UseReloadHook';

function UseCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const { customerReload } = UseReloadHook();

  const createCustomer = async (data, onSuccess) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        advanceAmount: Number(data.advanceAmount) || 0,
        remainingBalance: Number(data.remainingBalance) || 0,
      };
      const res = await AxiosService.post('/customer/createcustomer', payload);
      if (res.status === 201) {
        toast.success(res?.data?.message || 'Customer created successfully');
        await customerReload();
        onSuccess?.();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create customer');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const editCustomerPlan = async (id, payload, onSuccess) => {
    setLoading(true);
    try {
      const res = await AxiosService.put(`/customer/changeplan/${id}`, {
        name: payload.name,
        mobile: payload.mobile,
        address: payload.address,
        status: payload.status,
        planId: payload.planId,
        advanceAmount: Number(payload.advanceAmount) || 0,
        remainingBalance: Number(payload.remainingBalance) || 0,
        isGstCustomer: Boolean(payload.isGstCustomer),
        companyName: payload.companyName || '',
        gstin: payload.gstin || '',
        billingAddress: payload.billingAddress || '',
        gstRate: Number(payload.gstRate ?? 18),
        hsnSac: payload.hsnSac || '998422',
        email: payload.email || '',
      });

      if (res.status === 200) {
        toast.success(res?.data?.message || 'Customer updated successfully');
        await customerReload();
        onSuccess?.();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update customer');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, createCustomer, editCustomerPlan };
}

export default UseCreateCustomer;
