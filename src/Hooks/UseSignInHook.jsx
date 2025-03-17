import React, { useState } from 'react'
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import UseReloadHook from './UseReloadHook';
import { useNavigate } from 'react-router-dom';

function UseSignInHook() {
    
    let [loading,setLoading] = useState(false);
    let {ReloadPlan,customerReload,collectionReload,reloadCollectionreports} = UseReloadHook()
    let navigate = useNavigate()
    

    let signIn = async({email,password})=>{
        setLoading(true)
        try {
            let res = await AxiosService.post('/user/signin',{email,password})
            // console.log(res)

            if(res.status===200){
                sessionStorage.setItem('token',res?.data?.token)
                localStorage.setItem('data',JSON.stringify(res?.data?.rest))
                toast.success('Login Success')
                await ReloadPlan()
                await customerReload()
                await collectionReload()
                await reloadCollectionreports()
                navigate('/home')
            }
            
        } catch (error) {
            if(error?.response?.status==401){
                toast.error("Check password")
                return
            }
            toast.error('Error occurs')
            // console.error("Error in signIn:", error);
            
        }finally{
            setLoading(false)
        }

    }
  
  
    return {loading,signIn}
}

export default UseSignInHook