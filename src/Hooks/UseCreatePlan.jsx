import { useState } from 'react';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import UseReloadHook from './UseReloadHook';

function UseCreatePlan() {
  const [loading, setLoading] = useState(false);
  const { selectedPlanId } = useSelector((state) => state.plan);
  const { ReloadPlan } = UseReloadHook();

  const createPlan = async ({ name, amount, speed }, onSuccess) => {
    setLoading(true);
    try {
      const res = await AxiosService.post('/plan/createplan', {
        name: name.trim(),
        amount: Number(amount),
        speed: Number(speed),
      });

      if (res.status === 201) {
        toast.success(res?.data?.message || 'Plan created successfully');
        await ReloadPlan();
        onSuccess?.();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create plan');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const editPlan = async ({ name, amount, speed }, onSuccess) => {
    if (!selectedPlanId) {
      toast.error('No plan selected to edit');
      return false;
    }
    setLoading(true);
    try {
      const res = await AxiosService.put(`/plan/editplan/${selectedPlanId}`, {
        name: name?.trim(),
        amount: Number(amount),
        speed: Number(speed),
      });

      if (res.status === 200) {
        toast.success(res?.data?.message || 'Plan updated successfully');
        await ReloadPlan();
        onSuccess?.();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update plan');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id, onSuccess) => {
    setLoading(true);
    try {
      const res = await AxiosService.delete(`/plan/deleteplan/${id}`);
      if (res.status === 200) {
        toast.success(res?.data?.message || 'Plan deleted successfully');
        await ReloadPlan();
        onSuccess?.();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete plan');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, createPlan, editPlan, deletePlan };
}

export default UseCreatePlan;
