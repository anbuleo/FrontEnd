import React, { useEffect, useState } from 'react'
import Layout from '../Components/Layout'
import { useSelector } from 'react-redux'
import { saveAs } from "file-saver";
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';

function Report() {

  let {monthwise,planwise,userwise} = useSelector(state=>state.collection)
  const [userData,setUser]= useState([])
  const [data, setData] = useState([]);
  console.log(data)
  useEffect(()=>{
    getUser()
  },[])
  const handleDownload = async () => {
    try {
        const response = await AxiosService.get("/collection/download-excel", {
            responseType: "blob", // Important for binary data
        });

        const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, "Collection_Report.xlsx");
    } catch (error) {
        console.error("Error downloading file", error);
    }
};

const handleAddStaff = async(id)=>{
    try {
      let res = await AxiosService.put(`/user/add/${id}`,{approved:true})
      // console.log(res)
      if(res.status === 200){
        toast.success('User Added as a Staff in SKY Comm')
        getUser()

      }
    } catch (error) {
      toast.error("Error in approval")
    }
}
const getUser = async()=>{
  try {
    let res = await AxiosService.get('/user/getalluser')
    let res1 = await AxiosService.get('/customer/getcollection')
 
    if(res.status === 200 &&  JSON.stringify(res.data.user) !== JSON.stringify(userData)){
      setUser(res?.data?.user)
    }
    if(res1.status === 200){
      setData(res1?.data?.data)
    }
    // console.log(res1)
  } catch (error) {
    // console.log(error)
    toast.error('Error in user')
  }
}
  // console.log(planwise)
  return <>
  <Layout>
    <div className="">
      <div className="flex justify-end"> <button onClick={handleDownload} className="btn btn-primary">
            Download Collection Report
        </button></div>
    <p className="text-4xl font-bold underline text-rose-400 pb-2 ">Month Wise</p>
    <div  className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {monthwise && monthwise?.map((e,i)=>{
            return             <div key={i} className="p-4 bg-gradient-to-br from-sky-600 to-violet-900  text-white  shadow rounded text-center">
              <p className="text-xl font-bold">{e._id.month}<sup>rd</sup> </p>
              <p className="text-gray-100">Month {e._id.year}</p>
           
              <p className="text-xl font-bold">₹{e.totalAmountPaid}</p>
              <p className="text-gray-100">paid Payments</p>
              <p className="text-xl font-bold">₹{e.totalAmountPaid + e.totalAmountDue}</p>
              <p className="text-gray-100">Expected Payments</p>

           
          </div>
          })}
          </div>
          <p className="text-4xl font-bold underline text-rose-400 ">Plan Wise</p>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
{planwise && planwise?.map((e,i)=>{
            return     <div key={i}  className="p-4  bg-[#251047]  text-white  shadow rounded text-center">
              <p className="text-xl font-bold">Plan Name : {e.planName} </p>
              {/* <p className="text-gray-600">totalAmountDue:  ₹{e.totalAmountDue}</p> */}
           
              <p className="text-xl font-bold">totalCollected: ₹{e.totalCollected}</p>
             
              <p className="text-xl font-bold">totalPending : ₹{e.totalPending }</p>
             

           
          
          </div>
          })}
            </div>
    </div>
    
    <div className="pt-4">
      <table className='table '>
        <thead>
         <tr className='bg-violet-900 text-orange-50'> <th>#</th>
          <th>Staff name  </th>
          <th>Month Year</th>
          <th>totalCollected</th></tr>
        </thead>
        <tbody>
          {userwise && userwise?.map((e,i)=>{
            return <tr className="bg-gradient-to-br from-sky-600 to-fuchsia-600 text-white " key={i}>
              <td>{i+1}</td>
              <td>{e.userName}</td>
              <td>{e.month} , {e.year}</td>
              <td>{e.totalCollected}</td>
            </tr>
          })}
        </tbody>
      </table>
      <div className="">
        <div className="font-bold text-4xl underline text-rose-400">Approval for users</div>
        <div className="">
          <table className="table">
            <thead>
              <tr className='bg-violet-800 text-orange-100'>
                <th>#</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Approval</th>
                <th>action</th>
              </tr>
            </thead>
            <tbody>
              {userData && userData?.map((e,i)=>{
                return <tr key={i}>
                <td>{i+1}</td>
                <td>{e.userName}</td>
                <td>{e.mobile}</td>
                <td>{e.role}</td>
                <td>{e.approved ==true ? 'True' :'False'}</td>
                <td> {e.approved === false ? (
    <button className="btn btn-success" onClick={() => handleAddStaff(e._id)}>Add</button>
  ) : (
    <button className="btn btn-danger" disabled >Remove</button>
  )}</td>
              </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-gray-100 gap-4 p-4">
            {data?.length === 0 ? (
                <p className="text-center text-gray-500">No data available</p>
            ) : (
                data?.map((item, index) => (
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
        </div>
  </Layout>
  </>
}

export default Report