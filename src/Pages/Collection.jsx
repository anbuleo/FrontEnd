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

function Collection() {
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
          collectionId: "",
          amountPaid: "",
          paymentMode: "cash",
          transactionId: "",
        }, validationSchema: Yup.object({
            collectionId: Yup.string().required("Collection is required"),
            amountPaid: Yup.number()
              .positive("Amount must be positive")
              .required("Amount is required"),
            paymentMode: Yup.string().oneOf(["cash", "online"], "Invalid mode"),
            transactionId: Yup.string().when("paymentMode", (paymentMode, schema) => {
                return paymentMode === "online" 
                  ? schema.required("Transaction ID is required for online payments") 
                  : schema.notRequired();
              }),
          }), onSubmit: async (values, { resetForm }) => {
            setIsLoading(true);
            setMessage("");
      
            try {
                // console.log(values)
              const res = await AxiosService.put("/collection/payment", values);
              setMessage(res.data.message);
              await collectionReload()
              resetForm({ values: { collectionId: "", amountPaid: "", paymentMode: "cash", transactionId: "" } });
              toast.success('Collection Entry Success')
              navigate('/home')
              
            } catch (error) {
              // console.log(error)
              setMessage(error.response?.data?.message || "Payment failed");
            }
      
            setIsLoading(false);
          },
        });
  
        const collectionOptions =
        collection
          ?.filter((col) => col.status !== "Paid") // Exclude Paid collections
          .map((col) => ({
            value: col._id,
            label: `${col.customerId?.name} - ₹${col.amountDue} / ${col.customerId?.mobile}`,
          })) || [];
  
   
  return <>
  
  <Layout>
    <div className="">
    <div className="max-w-lg mx-auto p-6 bg-white border-1   animate-border shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Make a Payment</h2>

      {message && <p className="text-center text-red-500">{message}</p>}

      <form  onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Collection Selection */}
        {/* <div>
          <label className="block font-medium">Collection</label>
          <select
            name="collectionId"
            isSearchable={true}
            className="w-full p-2 border rounded select"
            value={formik.values.collectionId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">Select a collection</option>
            {collection&&collection?.map((col,i) => {
                return col.status !=='Paid' && (
                    <option key={col?._id} value={col?._id}>
                      {col.customerId?.name} - ₹{col?.amountDue} (Due) / {col?.customerId?.mobile}
                    </option>
                  )
            })}
          </select>
          {formik.touched.collectionId && formik.errors.collectionId && (
            <p className="text-red-500 text-sm">{formik.errors.collectionId}</p>
          )}
        </div> */}

<div>
            <label className="block font-medium">Collection</label>
            <Select
              options={collectionOptions}
              isSearchable={true} // 
              name="collectionId"
              value={collectionOptions.find(
                (option) => option.value === formik.values.collectionId
              )}
              onChange={(selectedOption) =>
                formik.setFieldValue("collectionId", selectedOption?.value)
              }
              onBlur={() => formik.setFieldTouched("collectionId", true)}
            />
            {formik.touched.collectionId && formik.errors.collectionId && (
              <p className="text-red-500 text-sm">{formik.errors.collectionId}</p>
            )}
          </div>
        {/* Amount Input */}
        <div>
          <label className="block font-medium">Amount Paid (₹)</label>
          <input
            type="number"
            name="amountPaid"
            className="w-full p-2 border rounded"
            value={formik.values.amountPaid}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.amountPaid && formik.errors.amountPaid && (
            <p className="text-red-500 text-sm">{formik.errors.amountPaid}</p>
          )}
        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="block font-medium">Payment Mode</label>
          <select
            name="paymentMode"
            className="w-full p-2 border rounded"
            value={formik.values.paymentMode}
            onChange={formik.handleChange}
          >
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
        </div>

        {/* Transaction ID (only for online payments) */}
        {formik.values.paymentMode === "online" && (
          <div>
            <label className="block font-medium">Transaction ID</label>
            <input
              type="text"
              name="transactionId"
              className="w-full p-2 border rounded"
              value={formik.values.transactionId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.transactionId && formik.errors.transactionId && (
              <p className="text-red-500 text-sm">{formik.errors.transactionId}</p>
            )}
          </div>
        )}

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

    </Layout></>
}

export default Collection