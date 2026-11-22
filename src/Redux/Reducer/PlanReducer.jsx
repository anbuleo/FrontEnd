import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plan: [],
  selectedPlanId: null,
};

export const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    addAllPlans: (state, action) => {
      state.plan = Array.isArray(action.payload) ? action.payload : [];
    },
    editPlan: (state, action) => {
      const planIndex = state.plan.findIndex((t) => t._id === action.payload?._id);
      if (planIndex !== -1) {
        state.plan[planIndex] = action.payload;
      }
    },
    deletePlan: (state, action) => {
      const planIndex = state.plan.findIndex((t) => t._id === action.payload);
      if (planIndex !== -1) {
        state.plan.splice(planIndex, 1);
      }
    },
    setSelectedPlan: (state, action) => {
      state.selectedPlanId = action.payload;
    },
  },
});

export const { addAllPlans, editPlan, deletePlan, setSelectedPlan } = planSlice.actions;
export default planSlice.reducer;
