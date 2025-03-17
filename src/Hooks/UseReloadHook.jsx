import React from 'react'
import { toast } from 'react-toastify'
import AxiosService from '../Common/AxiosService'
import { useDispatch } from 'react-redux'
import {addAllPlans} from "../Redux/Reducer/PlanReducer"
import { addAllCustomer } from '../Redux/Reducer/CustomerReducer'
import { addAllCollections, addAllDataforadmin, addAllmonthwise, addAllPlanwise } from '../Redux/Reducer/CollectionReducer'

function UseReloadHook() {

    let dispatch = useDispatch()


    const ReloadPlan= async()=>{
        try {
            let res = await AxiosService.get('/plan/getallplan')

            if(res.status ===200){
                toast.success('Plan loaded')
                dispatch(addAllPlans(res?.data?.plan))

            }
            
        } catch (error) {
            toast.error('Error in plan')
        }
    }

    const customerReload =async ()=>{
        try {
            let res = await AxiosService.get('/customer/getallcustomer')
            if(res.status === 200){
                dispatch(addAllCustomer(res?.data?.customer))
            }
            
        } catch (error) {
            toast.error('Error in customer')
        }
    }

    const collectionReload = async()=>{
        try {
            let res = await AxiosService.get('/collection/getcurrentmonth')
            if(res.status === 200){
                dispatch(addAllCollections(res?.data?.collection))
            }
        } catch (error) {
            console.log(error)
            toast.error('Error in collection')
        }
    }
    const reloadCollectionreports = async()=>{
        try {   
            let res = await AxiosService.get('/collection/getmonthwisereport')
            if(res.status === 200){
                dispatch(addAllmonthwise(res?.data?.report))
            }
            let res1 = await AxiosService.get('/collection/gettotalbyplan')
            // console.log(res1)
            if(res1.status === 200){
                dispatch(addAllPlanwise(res1?.data?.result))
            }
            let res2 =await AxiosService.get('/collection/getmonthlycollectionbyuser')
            if(res2.status === 200){
                dispatch(addAllDataforadmin(res2?.data?.result))
            }
            
        } catch (error) {
            console.log(error)
            toast.error('Error in report')
        }
    }





  return {ReloadPlan,customerReload,collectionReload,reloadCollectionreports}
}

export default UseReloadHook