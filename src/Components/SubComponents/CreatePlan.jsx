import { Formik } from 'formik'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup';
import UseCreatePlan from '../../Hooks/UseCreatePlan'

function createPlan() {

    let {createPlan,loading} = UseCreatePlan()
    let isAdmin = JSON.parse(localStorage.getItem('data'))?.role
    let planSchema = Yup.object().shape({
         name : Yup.string().required('Plan Name Required'),
         amount : Yup.number().required('* enter amount'),
         speed:Yup.number().required('* Enter speed limit')
    })
     const handleCreate = async (val) =>{
            try {
              // console.log(val)
             await createPlan(val)
            } catch (error) {
              console.log(error)
              toast.error('Error occur')
            }
          }
    


  return <>
  
           {isAdmin =='admin'? <><div className=''>
                     {loading ? <div className="place-content-center mx-auto"><span className="loading loading-bars loading-lg"></span></div>:<> <div className="  text-2xl   rounded-lg shadow sm:p-6 md:p-8  ">
                        <p className="text-center text-orange-100">Create Plan </p>
                       
                      </div>
                      <div className="divider divider-[#AA3AA5]"></div>
                      {/* <p className="btn  border-t-indigo-500 hover:bg-indigo-500 btn-outline float-right" onClick={()=>navigate('/home')}>{'<--- back'}</p> */}
                      <div className="   w-3/4 mx-auto  opacity-95 border border-[#d60bc5]  rounded-lg shadow-2xl  sm:p-6 md:p-8 ">
                        <Formik
                            initialValues={{
                              name : "",
                             amount:0,
                             speed:0
          
                            }}
                            onSubmit={(values)=>handleCreate(values)}
                            validationSchema={planSchema}
          
          
                        >
                          {({errors,touched,handleBlur,handleSubmit,handleChange})=>(
                            <form onSubmit={handleSubmit}>
                              <div className="">
                          <label className="text-orange-100">Name</label>
                          <input className='input input-bordered w-full text-black' type="text" name='name' placeholder="plan name"  onBlur={handleBlur} onChange={handleChange}/>
                          {errors.name && touched.name ? <div style={{color:"red"}}>{errors.name}</div>:null}
                        </div>
                        <div className="">
                          <label className="text-orange-100">Speed</label>
                          <input className='input input-bordered w-full text-black' type="number" name='speed' placeholder="enter plan speed"  onBlur={handleBlur} onChange={handleChange}/>
                          {errors.speed && touched.speed ? <div style={{color:"red"}}>{errors.speed}</div>:null}
                        </div>
                       
                        <div className="">
                          <label className="text-orange-100">Amount</label>
                          <input className='input input-bordered w-full text-black' type="number" name='amount' placeholder="enter plan amount"  onBlur={handleBlur} onChange={handleChange}/>
                          {errors.amount && touched.amount ? <div style={{color:"red"}}>{errors.amount}</div>:null}
                        </div>
                       
                        
                            <div className="btn btn-primary  w-full py-2 " onClick={handleSubmit}>Create</div>
                            </form>
                          )}
          
                        </Formik>
                      </div></>}
            </div></>:<><p>Admin only</p></>}
              
  </>
}

export default createPlan