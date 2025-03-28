import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../Components/Layout'
import UseReloadHook from '../Hooks/UseReloadHook'
import { useSelector } from 'react-redux'
import banner from '../assets/banner.jpg'
import { toast } from 'react-toastify'
import AxiosService from '../Common/AxiosService'

function Home() {

    let {customerReload,reloadCollectionreports,ReloadPlan,collectionReload} = UseReloadHook()
    let {customer} = useSelector(state=>state.customer)
    let [tableData,setTableData] = useState([])


    const getTranction = async()=>{
      try {
        let res = await AxiosService.get('/customer/get20')
        if(res.status ==200){
          setTableData(res?.data?.transactions)
        }
      } catch (error) {
        toast.error('error in tranaction')
      }

    }
    // const memoizedCustomer = useMemo(() => customer, [customer]);

    // console.log(customer)
    let {monthwise,planwise} = useSelector(state=>state.collection)
    // console.log(monthwise,planwise)
    
// console.log(tableData)
    useEffect(()=>{
       customerReload()
       reloadCollectionreports()
       ReloadPlan()
       collectionReload()
       getTranction()
    },[])
    // console.log(tableData)

  return (
    <Layout>

<main className="flex-1  ">

          <div className="min-w-screen flex shadow-2xl relative" >
                          <div className="md:w-1/2 bg-[#251047]  flex flex-col gap-2 items-center justify-center">
                            <h1 className="text-white font-bold text-xl text-center">🚀 <span className="text-2xl bg-gradient-to-br  from-sky-600 to-fuchsia-600 bg-clip-text text-transparent">Sky Communications</span>  - Connecting You to the World!</h1>
                            <p className="text-white  font-bold text-xl text-center">📡 High-Speed Internet | Reliable Service | Unlimited Possibilities</p>
                            <p className="text-sm text-white font-semibold text-center">Stay ahead with blazing-fast connectivity and unmatched customer support.
                            Join Sky Communications today and experience the future of the internet!</p>
                          </div>
                          <div className="md:w-1/2 hidden md:block relative"><img src={banner} className='' alt="banner" /><div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#251047]"></div></div>      
          </div>
        <div className="px-4">
        <h2 className="text-2xl font-bold mb-4 ">Recent Transactions</h2>

        {
          tableData && <div className="overflow-x-auto h-auto max-w-full">
            <table className="table table-zebra  rounded-lg w-full shadow-2xl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
              {tableData && tableData?.map((e,i)=>{
          return <tr key={i}>
                  <td>{e?.customerName}</td>
                  <td className=" "><p>{e?.date?.split("T")[0]?.split("-").join(" ").slice(5)}</p><p>{e?.date?.split("T")[1]?.split(".")[0]}</p></td>
                  <td>{e?.type}</td>
                  <td>{e?.amount}</td>
                  <td>{e?.collectedBy?.userName}</td>
          </tr>
        })}
              </tbody>
            </table>
          </div>
        }

{/* Stats Cards */}
{monthwise && monthwise?.map((e,i)=>{
  return <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="p-4 bg-gradient-to-br from-sky-600 to-violet-900 text-orange-100 shadow rounded text-center">
    <p className="text-xl font-bold">{e._id.month}<sup>rd</sup> </p>
    <p className="text-gray-50">Month</p>
 
    <p className="text-xl font-bold">₹{e.totalPending}</p>
    <p className="text-gray-50">Pending Payments</p>
  </div>
 
</div>
})}


{/* Recent Collections */}
<div className="pt-4 w-fit ">
  <div className="font-bold text-xl bg-gradient-to-br p-2 from-sky-600 ">Total Customer: {customer.length}</div>
</div>


        </div>
        </main>
    </Layout>
  )
}

export default Home