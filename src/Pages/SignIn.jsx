import React from 'react'
import logo from "../assets/skycommlogo.png"
import { Formik } from 'formik'
import * as Yup from 'yup';
import {toast} from 'react-toastify'
import UseSignInHook from "../Hooks/UseSignInHook.jsx"
import { Link } from 'react-router-dom';

function SignIn() {

    let {loading,signIn} = UseSignInHook();

    const UserSchema = Yup.object().shape({
  
    
        email:Yup.string().email('* Invalid Email').required('* Required'),
      
        password:Yup.string().required('* Required')
      })
    const handleSubmitValues = async(values)=>{
        try {
          // console.log(values)
          await signIn(values)
          
        } catch (error) {
          toast.error('Erorr ocured')
          // console.log(error)
        }
      }
  return <>
  <div className="flex h-screen">
    {/* left */}
    <div className="w-2/4 my-auto mx-auto hidden md:block">
        <div className="">
            <h2 className='text-3xl font-bold text-center text-[#064E89]'>
                Welcome to SKY COMMUNICATIONS
            </h2>
            <p className='text-xl font-bold text-center text-[#064E89]'>
                Collection Moniter App
            </p>
        </div>
    </div>
    {/* right */}
    <div className="w-full md:w-2/4 bg-[#064E89] flex justify-center items-center p-4 ">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
            {/* banner */}
            <div className="card  w-full shadow-sm bg-transparent mx-auto items-center">
                    <figure className="rounded-lg max-w-64">

                       
                        <img src={logo} sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' alt="logo" />

                    </figure>
                    <div className="">
                    <div className="form w-full px-4 sm:px-6">
        <Formik
          initialValues={{
           
            email:"",
            password:"",
           
            

          }}
          validationSchema={UserSchema}
          onSubmit={(values)=>handleSubmitValues(values)}
        >
          {({ errors,touched,handleBlur,handleSubmit,handleChange})=>(
            <form onSubmit={handleSubmit} >
           
    
              
              <h1 className=" text-xl py-2 text-amber-50 underline">SignIn</h1>
            
              <div className="">
                <label className='text-white'>Email</label>
                <input className='input input-bordered w-full text-black' type="email" name='email' placeholder="Enter email"  onBlur={handleBlur} onChange={handleChange}/>
                {errors.email && touched.email ? <div style={{color:"red"}}>{errors.email}</div>:null}
              </div>
    
              
    
              <div className="">
                <label className='text-white'>Password</label>
                <input className='input input-bordered w-full text-black' type="password" name='password' placeholder="Enter password" onBlur={handleBlur} onChange={handleChange}/>
                {errors.password && touched.password ? <div style={{color:"red"}}>{errors.password}</div>:null}
              </div>
    
              <button className='mt-4 btn btn-outline w-full rounded-lg bg-slate-100 text-blue-950' type='submit'>
               {loading ? <span className="loading loading-dots loading-lg"></span>:'submit'}
              </button>
            </form>
          )}
        </Formik>
        <div className="mt-4 text-sm text-right"><p className=' text-blue-100'>Doesn't have an account? <span className='cursor-pointer text-blue-200 text-xl hover:underline hover:text-blue-50'><Link to={'/signup'}>Sign Up</Link></span> </p></div>
        </div>
                    </div>

            </div>
        </div>
    
    </div>
    
    
    </div>   
  
  </>
}

export default SignIn