import React, { useEffect, useState } from 'react'
import Layout from '../Components/Layout'
import UseReloadHook from '../Hooks/UseReloadHook'
import { toast } from 'react-toastify';
import AxiosService from '../Common/AxiosService';
import { Formik } from 'formik';

function DailyCollection() {
    let {cardData,getAllCollection} = UseReloadHook()
    let [exData,setExData] = useState([]);
    let [reportData,setReportData] = useState([]);
    let user = JSON.parse(localStorage.getItem('data'))?.userName
    let colData = cardData?.filter(item => {
        const today = new Date().getDate(); // Get today's day number (e.g., 4)
        return item.day === today && item.collectedBy.userName === user;
    })
    // let expense 
    useEffect(()=>{
        getAllCollection()
        getExpense()
        getreport()
    },[])

    const getreport =async()=>{
        try{
            let res = await AxiosService.get('/collection/getreport')
            if(res.status ===200){
                setReportData(res?.data?.report)
            }

        }catch(error){
            toast.error('error ocurs')
        }
    }

    const getExpense = async()=>{
        try{
            let res  = await AxiosService.get('/collection/getexpense')
            if(res.status === 200){
                setExData(res?.data?.todayExpense)
            }

        }catch(error){
            // console.log(error)
            toast.error('Error in expense data')
        }
    }
  return <>
  <Layout>
    <section className="">
      <div className="">
        <div className="flex justify-end p-4">
            <div className="btn btn-outline btn-secondary"  onClick={() => document.getElementById("my_modal_sub").showModal()}>submit Today Collection</div>
        </div>
         <dialog id="my_modal_sub" className="modal ">
                      <div className="modal-box bg-[#2a2544]">
                        <form method="dialog">
                          {/* if there is a button in form, it will close the modal */}
                          <button className="btn btn-sm text-orange-100 btn-circle btn-ghost absolute right-2 top-2">
                            ✕
                          </button>
                        </form>
                        <h3 className="text-white text-lg font-bold mb-4">Submit Today's Collection</h3>

    <Formik
    enableReinitialize={true}
      initialValues={{
        collectionAmount: colData[0]?.totalCollected || 0,
        collectionDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
        recievedAmount: 0,
        status: "Pending",
        expenseId: '',
      }}
      onSubmit={async (values, { resetForm }) => {
        try {
            console.log(values)
          const res = await AxiosService.post("/collection/submitreport", values);
          if (res.status === 201) {
            toast.success("Collection submitted!");
            resetForm();
            document.getElementById("my_modal_sub").close();
            getAllCollection();
            getreport()
          }
        } catch (err) {
        //   console.log(err?.response?.data?.message);
          toast.error(err?.response?.data?.message || "Failed to submit collection.");
          document.getElementById("my_modal_sub").close();
        }
      }}
    >
      {({ handleChange, handleSubmit, values }) => (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
          <div>
            <label className="block text-sm">Collection Amount</label>
            <input
              type="number"
              name="collectionAmount"
              value={values.collectionAmount}
              onChange={handleChange}
              className="input input-bordered w-full text-black"
              required
            />
          </div>

          {/* <div>
            <label className="block text-sm">Received Amount</label>
            <input
              type="number"
              name="recievedAmount"
              value={values.recievedAmount}
              onChange={handleChange}
              className="input input-bordered w-full text-black"
              required
            />
          </div> */}

          <div>
          <label className="block text-sm">Expense</label>
            <select
              name="expenseId"
              value={values.expenseId}
              onChange={handleChange}
              className="select select-bordered w-full text-black"
            >
               <option value="">Select an expense</option>
    {exData?.map((e, i) => (
      <option key={e._id} value={e._id}>
        {e.remarks} - Day {new Date(e.date).getDate()} - ₹{e.amount}
      </option>
    ))}
            </select>
          </div>

          {/* <div>
            <label className="block text-sm">Status</label>
            <select
              name="status"
              value={values.status}
              onChange={handleChange}
              className="select select-bordered w-full text-black"
            >
              <option value="Pending">Pending</option>
              <option value="Recieved">Recieved</option>
            </select>
          </div> */}

          <div className="flex justify-end">
            <button type="submit" className="btn btn-success text-white">Submit</button>
          </div>
        </form>
      )}
    </Formik>
                       
                      </div>
                    </dialog>
        
      <div className="text-center-font-bold text-sm  md:text-2xl">
    collections
  </div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 bg-gray-100 gap-4 p-4">
{cardData?.length === 0 ? (
    <p className="text-center text-gray-500">No data available</p>
) : (
    cardData
        ?.filter(item => {
            const today = new Date().getDate(); // Get today's day number (e.g., 4)
            return item.day === today && item.collectedBy.userName === user;
        })
        .map((item, index) => (
            <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body text-center">
                    <h2 className="card-title text-primary">Day {item.day}</h2>
                    <p className="text-gray-600 font-semibold">{item.collectedBy.userName}</p>
                    <p className={`text-lg font-bold ${item.type === "advance" ? "text-blue-500" : "text-green-500"}`}>
                        {item.type.toUpperCase()}: ₹{item.totalCollected}
                    </p>
                </div>
            </div>
        ))
)}

    {exData?.length ==0 ?(<p className="text-center text-gray-500">No data available</p>):( exData?.map((item,index)=>(
        <div key={index} className="card bg-base-100 shadow-xl">
        <div className="card-body text-center">
        <h1 className="text-center font-bold text-2xl">Expense</h1>
            <h2 className="card-title text-primary">Day {new Date(item?.date).getDate()}</h2>
            <p className="text-gray-600 font-semibold">{item.remarks}</p>
            <p className={`text-lg font-bold ${item.status === "unclaimed" ? "text-blue-500" : "text-green-500"}`}>
                {item.status.toUpperCase()}: ₹{item.amount}
            </p>
        </div>
    </div>
    ))) }

        </div>
</div>  
<h1 className="text-2xl font-bold p-4">Submited Data</h1>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-200">
  {reportData && reportData.map((item, index) => {
    const submitted = item?.collectionAmount - (item?.expenseId?.amount || 0);
    const isReceived = item?.status;

    return (
      <div
        key={index}
        className="card bg-base-100 shadow-xl hover:scale-[1.02] transition-all"
      >
        <div className="card-body text-center">
          <h2 className="text-lg text-gray-700">
            <span className="font-semibold">User:</span>{" "}
            {item?.userId?.userName || "N/A"}
          </h2>

          <h2 className="text-lg text-gray-700">
            <span className="font-semibold">Collected:</span>{" "}
            {item?.collectionAmount || "N/A"}
          </h2>

          <p className="text-gray-600">
            <span className="font-semibold">Remarks:</span>{" "}
            {item?.expenseId?.remarks || "No remarks"}
          </p>

          <p className="text-xl font-bold text-green-600">
            ₹{item?.expenseId?.amount || 0}
          </p>

          <h2 className="text-lg text-gray-700">
            <span className="font-semibold">Submitted:</span> {submitted}
          </h2>

          {/* ✅ Received Status */}
          <p
            className={`font-semibold ${
              isReceived === 'Recieved' ? "text-green-600" : "text-red-500"
            }`}
          >
            {isReceived ==='Recieved' ? "✅ Received" : "❌ Not Received"}
          </p>

          <p className="text-sm text-gray-500">
            Date: {new Date(item?.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  })}
</div>

    </section>
  </Layout>
  </>
}

export default DailyCollection