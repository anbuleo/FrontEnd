import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Layout from '../Components/Layout'
import { useSelector } from "react-redux";
import AxiosService from "../Common/AxiosService";
import UseReloadHook from "../Hooks/UseReloadHook";
import { toast } from "react-toastify";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

function Expense() {
     const [isLoading, setIsLoading] = useState(false);
        const [message, setMessage] = useState("");
        const {collectionReload} = UseReloadHook()
            let {collection} = useSelector(state => state.collection)
            // console.log(collection)
            let navigate =useNavigate()
    
            useEffect(()=>{
                collectionReload()
            },[])
        const formik = useFormik({
            initialValues: {
             
              amount: "",
              remarks: "",
              
            }, validationSchema: Yup.object({
                
                amount: Yup.number()
                  .positive("Amount must be positive")
                  .required("Amount is required"),
                remarks: Yup.string().required('Enter expense query'),
                
              }), onSubmit: async (values, { resetForm }) => {
                setIsLoading(true);
                setMessage("");
          
                try {
                    // console.log(values)
                  const res = await AxiosService.post("/collection/expense", values);
                  setMessage(res.data.message);
                  await collectionReload()
                  resetForm({ values: {  amount: "", remarks: "" } });
                  toast.success('Expense Entry Success')
                  navigate('/home')
                  
                } catch (error) {
                  // console.log(error)
                  setMessage(error.response?.data?.message || "expense failed");
                }
          
                setIsLoading(false);
              },
            });
      
           
      
  return <>
    <Layout>
        <main className="">
            <div className="pt-20">
                 <div className="">
                    <div className="max-w-lg mx-auto p-6 bg-white border-1   animate-border shadow-lg rounded-lg">
                      <h2 className="text-2xl font-bold text-center mb-4">Add Today Expense</h2>
                
                      {message && <p className="text-center text-red-500">{message}</p>}
                
                      <form  onSubmit={formik.handleSubmit} className="space-y-4">
                        {/* Expense Selection */}
                       
                
                <div>
                            
                          </div>
                        {/* Amount Input */}
                        <div>
                          <label className="block font-medium">Enter Amount Paid (₹)</label>
                          <input
                            type="number"
                            name="amount"
                            className="w-full p-2 border rounded"
                            value={formik.values.amount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          {formik.touched.amount && formik.errors.amount && (
                            <p className="text-red-500 text-sm">{formik.errors.amount}</p>
                          )}
                        </div>
                
                        {/* Payment Mode Selection */}
                        <div>
                          <label className="block font-medium">Remarks</label>
                          <textarea
                            name="remarks"
                            className="w-full p-2 border rounded"
                            value={formik.values.remarks}
                            onChange={formik.handleChange}
                          >
                            
                          </textarea>
                        </div>
                        {formik.touched.remarks && formik.errors.remarks && (
                            <p className="text-red-500 text-sm">{formik.errors.remarks}</p>
                          )}
                
                        {/* Transaction ID (only for online payments) */}
                       
                
                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                          disabled={isLoading}
                        >
                          {isLoading ? "Processing..." : "Collect Payment"}
                        </button>
                      </form>
                    </div>
                    </div>
            </div>
        </main>
    </Layout>
  </>
}

export default Expense