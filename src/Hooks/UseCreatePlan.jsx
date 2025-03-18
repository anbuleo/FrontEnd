import React, { useState } from 'react'
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import UseReloadHook from "./UseReloadHook"

function UseCreatePlan() {
    let [loading,setLoading] = useState(false);
    let navigate = useNavigate()
    let dispatch = useDispatch()
    let {selectedPlanId} = useSelector(state=>state.plan)
    let {ReloadPlan} = UseReloadHook()


    let createPlan =async({name,amount,speed})=>{
        try {
            setLoading(true)

            let res = await AxiosService.post('/plan/createplan',{name,amount,speed})

            // console.log(res)

            if(res.status === 201){
                toast.success("Plan created success")
                await ReloadPlan()
                navigate('/home')
            }
            
            
        } catch (error) {

            toast.error(error?.response?.data?.message || "Something went wrong");
            
        }finally{
            setLoading(false)
        }
    }
    let editPlan =async({amount,speed})=>{
        // console.log(val)
        try {
            setLoading(true)

            let res = await AxiosService.put(`/plan/editplan/${selectedPlanId}`,{amount,speed})
            // dispatch()
            // console.log(res)


            if(res.status === 200){
                toast.success("Plan edited success")
                await ReloadPlan()
                navigate('/home')
            }
            
        } catch (error) {
            console.log(error)
            toast.error('error occurs')
            
        }finally{
            setLoading(false)
        }
    }
    let deletePlan =async(id)=>{
        try {
            setLoading(true)

            let res = await AxiosService.delete(`/plan/deleteplan/${id}`)

            if(res.status === 200){
                toast.success("Plan deleted success")
                await ReloadPlan()
                navigate('/plan')
            }
            
        } catch (error) {
            toast.error('error occurs')
            
        }finally{
            setLoading(false)
        }
    }





  return  { loading, createPlan,editPlan,deletePlan}
}

export default UseCreatePlan