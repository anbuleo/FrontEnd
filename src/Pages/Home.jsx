import React, { useEffect, useMemo } from 'react'
import Layout from '../Components/Layout'
import UseReloadHook from '../Hooks/UseReloadHook'
import { useSelector } from 'react-redux'

function Home() {

    let {customerReload,reloadCollectionreports} = UseReloadHook()
    let {customer} = useSelector(state=>state.customer)
    // const memoizedCustomer = useMemo(() => customer, [customer]);

    // console.log(customer)
    let {monthwise,planwise} = useSelector(state=>state.collection)
    // console.log(monthwise,planwise)
    

    useEffect(()=>{
       customerReload()
       reloadCollectionreports()
    },[])

  return (
    <Layout>

<main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

          {/* Stats Cards */}
          {monthwise && monthwise?.map((e,i)=>{
            return <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white shadow rounded text-center">
              <p className="text-xl font-bold">{e._id.month}<sup>rd</sup> </p>
              <p className="text-gray-600">Month</p>
           
              <p className="text-xl font-bold">₹{e.totalPending}</p>
              <p className="text-gray-600">Pending Payments</p>
            </div>
           
          </div>
          })}
          

          {/* Recent Collections */}
          <h3 className="text-lg font-bold mt-6">Recent Payments</h3>
          <table className="w-full bg-white shadow-md rounded mt-4">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-2">Customer</th>
                <th className="p-2">Date</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <td className="p-2">John Doe</td>
                <td className="p-2">March 10, 2025</td>
                <td className="p-2">₹2,000</td>
                <td className="p-2 text-green-500">Paid</td>
              </tr>
              <tr className="text-center">
                <td className="p-2">Jane Smith</td>
                <td className="p-2">March 12, 2025</td>
                <td className="p-2">₹1,500</td>
                <td className="p-2 text-red-500">Pending</td>
              </tr>
            </tbody>
          </table>
        </main>
    </Layout>
  )
}

export default Home