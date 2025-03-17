import {createSlice} from "@reduxjs/toolkit"



const initialState = {
    plan:[],
    selectedPlanId: null,
}

export const planSlice = createSlice({
    name:'plan',
    initialState,
    reducers : {
        addAllPlans : (state,action)=>{
            state.plan  = action.payload
        },
        editPlan : (state,action)=>{
            const plans = state.plan;
            const planIndex = plans.findIndex(t=>t._id === action.payload._id);
            let newPlan = action.payload;
            plans[planIndex] = newPlan;
        },
        deletePlan : (state,action)=>{
            let planIndex = state.plan.findIndex(t=>t._id === action.payload)
            if(planIndex){
                state.plan.splice(planIndex,1)
            }
        },
        setSelectedPlan: (state, action) => {
            state.selectedPlanId = action.payload; // ✅ Store selected plan ID
        },
        
    }
})

export const {addAllPlans,editPlan,deletePlan,setSelectedPlan} = planSlice.actions
export default planSlice.reducer