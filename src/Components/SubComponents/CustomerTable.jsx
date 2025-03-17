import React, { useEffect, useState } from 'react'
import { useSelector,useDispatch } from 'react-redux'
import EditCustomer from '../../Pages/editCustomer'
import { selectCustomerForEdit } from '../../Redux/Reducer/CustomerReducer'
import UseReloadHook from '../../Hooks/UseReloadHook'

function CustomerTable() {
    let {customer,selectedCustomer} = useSelector(state=>state.customer)
    const [searchQuery, setSearchQuery] = useState("");
    let {customerReload} = UseReloadHook()
    useEffect(()=>{
        customerReload()
    },[])
    let dispatch = useDispatch()
    const filteredCustomers = customer?.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.mobile.includes(searchQuery)
    );

  return <>
        <div className="overflow-x-auto  rounded-box border border-base-content/5 bg-base-100">
        <input
                    type="text"
                    placeholder="Search by name or mobile..."
                    className="input input-bordered w-full  mb-4"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            <table className="table ">
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
                        return <tr className={`${e.remainingBalance >0 ? 'bg-red-500 rounded-2xl text-amber-100':e.advanceAmount >0 ? 'bg-green-600 text-amber-100':'bg-amber-100' } hover:opacity-80 text-center`} key={i} >
                            <td>{i+1}</td>
                            <td>{e.name}</td>
                            <td>{e.mobile}</td>
                            <td>{e.advanceAmount}</td>
                            <td>{e.remainingBalance}</td>
                            <td  className="btn btn-success mx-auto"
              onClick={() => {
                dispatch(selectCustomerForEdit(e._id))
                document.getElementById("my_modal_5").showModal()}}>edit</td>
                            
                        </tr>
                    })}

                </tbody>
            </table>
            <div className="">
            <dialog id="my_modal_5" className="modal ">
                              <div className="modal-box bg-gradient-to-br from-sky-600 to-fuchsia-600">
                                <form method="dialog">
                                  {/* if there is a button in form, it will close the modal */}
                                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
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