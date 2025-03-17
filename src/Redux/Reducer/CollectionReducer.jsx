import {createSlice} from "@reduxjs/toolkit"


const initialState ={
    collection : [],
    monthwise:[],
    planwise:[],
    userwise:[],



}

export const collectionSlice = createSlice({
    name:'collection',
    initialState,
    reducers : {
        addAllCollections : (state,action)=>{
            state.collection = Array.isArray(action.payload) ? action.payload : [];
        },
        addAllmonthwise:(state,action)=>{
            state.monthwise = Array.isArray(action.payload)? action.payload : [];

        },
        addAllPlanwise : (state,action)=>{
            state.planwise = Array.isArray(action.payload) ? action.payload :[];
        },
        addAllDataforadmin : (state,action)=>{
            state.userwise = Array.isArray(action.payload) ? action.payload :[];
        }
    }
})

export const {addAllCollections,addAllPlanwise,addAllmonthwise,addAllDataforadmin} = collectionSlice.actions

export default collectionSlice.reducer