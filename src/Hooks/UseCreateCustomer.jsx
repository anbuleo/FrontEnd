import React, { useState } from 'react'
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import UseReloadHook from './UseReloadHook';

function UseCreateCustomer() {
   
     let [loading,setLoading] = useState(false);
     let navigate = useNavigate()
     let{customerReload} = UseReloadHook()
 
     let createCustomer = async(data)=>{
         setLoading(true)
        //  console.log(data)
         try {
            let res = await AxiosService.post('/customer/createcustomer',data)
            if(res.status===201){
                toast.success('Customer created Success')
                await customerReload()
                document.getElementById("my_modal_8").close()            
            }
             
         } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong");
             
         }finally{
             setLoading(false)
         }
 
     }
     let editCustomerPlan = async(id,PId,advan,remain)=>{
        try {
            let res = await AxiosService.put(`/customer/changeplan/${id}`,{planId:PId,advanceAmount:advan,remainingBalance:remain})

            if(res.status === 200){
                toast.success("Customer Edited Success")
                await customerReload()
                document.getElementById("my_modal_5").close()
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong");
        }
     }
   
   
     return {loading,createCustomer,editCustomerPlan}
}

export default UseCreateCustomer