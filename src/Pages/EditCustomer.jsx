import { Formik } from 'formik'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import UseCreateCustomer from '../Hooks/UseCreateCustomer';
// import UseReloadHook from '../Hooks/UseReloadHook';
function editCustomer() {
    let {plan} = useSelector(state => state.plan)
    let {customer,selectedCustomer} = useSelector(state => state.customer)
    let {editCustomerPlan,loading} = UseCreateCustomer()
   
    // let [data,setData] = useState([])
    // console.log(id)

    let details = customer?.filter((a,b)=>a._id === selectedCustomer)
   let dt = details[0]
 

    const editcustomerSchema = Yup.object().shape({
        name : Yup.string().required('Customer Name Required'),
        mobile : Yup.string().required('Mobile Number Required').max(10,'maximum 10 digit').min(10,'Enter valid 10 digit'),
        address : Yup.string().required("Address required").min(2,'Minimum 3 characters'),
        planId: Yup.string().required("* Select their plan"),
        advanceAmount: Yup.number(),
        remainingBalance: Yup.number()
        
      })
      const handleCreate = async (val) =>{
        // console.log(val)
        try {
         await editCustomerPlan(selectedCustomer,val.planId)
        } catch (error) {
          console.log(error)
          toast.error('Error occur')
        }
      }
  return <>
  
  
  <div className=''>
           {loading ? <div className="place-content-center mx-auto"><span className="loading loading-bars loading-lg"></span></div>:<> <div className="  text-2xl   rounded-lg shadow sm:p-6 md:p-8  ">
              <p className="text-center text-orange-100">change Customer plan</p>
             
            </div>
            <div className="divider divider-[#AA3AA5]"></div>
            {/* <p className="btn  border-t-indigo-500 hover:bg-indigo-500 btn-outline float-right" onClick={()=>navigate('/home')}>{'<--- back'}</p> */}
            <div className="   w-3/4 mx-auto  opacity-95 border border-[#d60bc5] animate-border rounded-lg shadow-2xl  sm:p-6 md:p-8 ">
              <Formik
              enableReinitialize
                  initialValues={{
                    name :dt?.name,
                    mobile:dt?.mobile,
                    address:dt?.address,
                    planId:dt?.planId,
                    advanceAmount:dt?.advanceAmount,
                    remainingBalance:dt?.remainingBalance


                  }}
                  onSubmit={(values)=>handleCreate(values)}
                  validationSchema={editcustomerSchema}


              >
                {({values,errors,touched,handleBlur,handleSubmit,handleChange})=>(
                  <form onSubmit={handleSubmit}>
                    <div className="">
                <label className="text-orange-100">Name</label>
                <input value={values.name} disabled className='input input-bordered w-full text-black' type="text" name='name' placeholder="Enter customer name"  onBlur={handleBlur} onChange={handleChange}/>
                {errors.name && touched.name ? <div style={{color:"red"}}>{errors.name}</div>:null}
              </div>
              <div className="">
                <label className="text-orange-100">Mobile</label>
                <input value={values.mobile} disabled className='input input-bordered w-full text-black' type="tel" name='mobile' placeholder="9876543210"  onBlur={handleBlur} onChange={handleChange}/>
                {errors.mobile && touched.mobile ? <div style={{color:"red"}}>{errors.mobile}</div>:null}
              </div>
              <div className="">
                <label className="text-orange-100">Select plan</label>
                <select value={values.planId}  className='input input-bordered w-full text-black' type="text" name='planId' placeholder="select plan"  onBlur={handleBlur} onChange={handleChange}>
                <option value="" defaultChecked >select</option>
                 {plan && plan.map((e,i)=>{
                    return <option key={i} value={e._id}>{e.name} { e.amount}</option>
                 })}
                 
                  {/* <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Recommended">Recommended</option>
                  <option value="Pro">Pro</option>
                  <option value="Family">Family</option>
                  <option value="Mega">Mega</option>
                  <option value="Giga">Giga</option>
                  <option value="Tera">Tera</option>
                  <option value=""></option>
                  <option value=""></option> */}

                </select>
                {errors.planId && touched.planId ? <div style={{color:"red"}}>{errors.planId}</div>:null}
              </div>
              <div className="pb-2">
                <label  className="text-orange-100"> Address</label>
              <textarea value={values.address} disabled className="textarea textarea-warning  w-full text-black" placeholder="Enter address" name='address'   onBlur={handleBlur} onChange={handleChange}></textarea>
                {errors.address && touched.address ? <div style={{color:"red"}}>{errors.address}</div>:null}
              </div>
              <div className="">
                <label className="text-orange-100">Advance Amount</label>
                <input value={values.advanceAmount} disabled className='input input-bordered w-full text-black' type="number" name='advanceAmount' placeholder="enter if only had"  onBlur={handleBlur} onChange={handleChange}/>
                {errors.advanceAmount && touched.advanceAmount ? <div style={{color:"red"}}>{errors.advanceAmount}</div>:null}
              </div>
              <div className="">
                <label className="text-orange-100">Remaining balance or pending</label>
                <input value={values.remainingBalance} disabled className='input input-bordered w-full text-black' type="number" name='remainingBalance' placeholder="enter if only had"  onBlur={handleBlur} onChange={handleChange}/>
                {errors.remainingBalance && touched.remainingBalance ? <div style={{color:"red"}}>{errors.remainingBalance}</div>:null}
              </div>
                  <div className="btn btn-primary  w-full py-2 "  onClick={handleSubmit}>Change Plan</div>
                  </form>
                )}

              </Formik>
            </div></>}
  </div>
  </>
}

export default editCustomer