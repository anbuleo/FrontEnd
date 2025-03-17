import React, { useState } from 'react'
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function UseSignUpHook() {
  
     
      let [loading,setLoading] = useState(false);

      let navigate = useNavigate()
  
      let signUp = async({userName,email,password,mobile})=>{
          setLoading(true)
          try {
            //   console.log(data)
            let res = await AxiosService.post('/user/signup',{userName,email,password,mobile})
            if(res.status === 201){
                toast.success("User Craated success")
                navigate('/')

            }
        } catch (error) {
            if(error?.response?.status==401){
                toast.error("mobile number and name")
                return
            }
            toast.error('Error occurs')
              
          }finally{
              setLoading(false)
          }
  
      }
    
    
      return {loading,signUp}



}

export default UseSignUpHook