import {createSlice} from "@reduxjs/toolkit"



const initialState = {
    customer:[],    
    selectedCustomer:''
}



export const customerSlice = createSlice({
    name:'customer',
    initialState,
    reducers : {
        addAllCustomer : (state,action)=>{
            state.customer = Array.isArray(action.payload) ? action.payload : [];
        },
        deleteCustomer : (state,action) => {
            state.customer = state.customer.filter(t => t._id !== action.payload);
        },
        selectCustomerForEdit : (state,action)=>{
            state.selectedCustomer  = action.payload
        }

    }
})

export const {addAllCustomer,deleteCustomer,selectCustomerForEdit} = customerSlice.actions
export default customerSlice.reducer