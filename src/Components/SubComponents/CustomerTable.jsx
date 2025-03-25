import React, { useEffect, useState } from 'react'
import { useSelector,useDispatch } from 'react-redux'
import EditCustomer from '../../Pages/EditCustomer'
import { selectCustomerForEdit } from '../../Redux/Reducer/CustomerReducer'
import UseReloadHook from '../../Hooks/UseReloadHook'
import { toast } from 'react-toastify'
import AxiosService from '../../Common/AxiosService'

function CustomerTable() {
    let [loading,setLoading] = useState(false)
    let {customer,selectedCustomer} = useSelector(state=>state.customer)
    // console.log(customer)
    const [searchQuery, setSearchQuery] = useState("");
    let {customerReload} = UseReloadHook()
    
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
    useEffect(()=>{
        customerReload()
    },[])
    let dispatch = useDispatch()
    const filteredCustomers = customer?.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.mobile.includes(searchQuery)
    );

    const handleDelete = async(id)=>{
        setLoading(true)
        try{
            let res = await AxiosService.delete(`/customer/deletecustomer/${id}`)
            if(res.status ==200){
                toast.success('Delete Success')
                customerReload()
            }

        }catch(error){
            toast.error('Error in delete')
        }finally{
            setLoading(false)
        }
    }

  return <>
        <div className="overflow-x-auto  rounded-box border border-base-content/5 bg-base-100">
        <input
                    type="text"
                    placeholder="Search by name or mobile..."
                    className="input input-bordered w-full  mb-4"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            <table className="table  ">
                <thead>
                    <tr className='text-center'>
                        <th>#</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Advance</th>
                        <th>Due</th>
                        <th>Change plan</th>
                    </tr>
                </thead>
                <tbody>
                    {customer && filteredCustomers?.map((e,i)=>{
                        return  <React.Fragment key={i}><tr className={`${e.remainingBalance >0 ? 'bg-red-200  rounded-2xl ':e.advanceAmount >0 ? 'bg-blue-600 text-amber-100':'bg-green-300 ' } hover:opacity-80 text-center`} key={i} >
                            <td>{i+1}</td>
                            <td>{e.name}</td>
                            <td>{e.mobile}</td>
                            <td>{e.advanceAmount}</td>
                            <td>{e.remainingBalance}</td>
                            <td className='flex gap-2 justify-center items-center' >
                            <button className="btn btn-info" onClick={() =>{
                                
                                setExpandedCustomerId(
                                    expandedCustomerId === e._id ? null : e._id
                                  )}}> {expandedCustomerId === e._id ? "Hide" : "View"}</button>
                                <p  className="btn btn-success mx-auto"
              onClick={() => {
                dispatch(selectCustomerForEdit(e._id))
                document.getElementById("my_modal_5").showModal()}}>edit</p> <button className="btn btn-error"  disabled={loading} onClick={()=>handleDelete(e._id)}>Delete</button></td>
                            
                        </tr>
                        {expandedCustomerId === e._id && (
                  <tr className="bg-gray-200">
                    <td colSpan="6">
                      <div className="p-4">
                        <h3 className="font-bold text-lg">
                          Transactions for {e.name}
                        </h3>
                        {e.transactions?.length > 0 ? (
                          <table className="table w-full mt-3">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Collected By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {e.transactions.map((t, index) => (
                                <tr key={index}>
                                  <td>{new Date(t.date).toLocaleDateString()}</td>
                                  <td>{t.type}</td>
                                  <td>₹{t.amount}</td>
                                  <td>{t.collectedBy?.userName || "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-center mt-3">No transactions found.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                        </React.Fragment>
                    })}

                  

                </tbody>
            </table>
            <div className="">
           
            <dialog id="my_modal_5" className="modal ">
                              <div className="modal-box  bg-[#2a2544]">
                                <form method="dialog">
                                  {/* if there is a button in form, it will close the modal */}
                                  <button className="btn btn-sm btn-circle text-orange-50 btn-ghost absolute right-2 top-2">
                                    ✕
                                  </button>
                                </form>
                                {/* <h3 className="font-bold text-lg">Hello!</h3> */}
                               <EditCustomer />
                              </div>
                            </dialog>
            </div>
         
        </div>
  </>
}

export default CustomerTable