import React from 'react'
import { AiOutlineUserAdd } from 'react-icons/ai'
import {useSelector,useDispatch} from 'react-redux'
// import CreatePlan from "./CreatePlan"
import {setSelectedPlan} from "../../Redux/Reducer/PlanReducer"
import EditPlan from './EditPlan'
import UseCreatePlan from '../../Hooks/UseCreatePlan'
import { AiFillEdit } from "react-icons/ai";

function PlanCard() {

    let {plan,selectedPlanId} = useSelector(state=>state.plan)
    let dispatch = useDispatch()
    let {deletePlan} = UseCreatePlan()

    let isAdmin = JSON.parse(localStorage.getItem('data'))?.role

    // console.log(isAdmin)



    

    let handleDelete=async(id)=>{
        try {
            await deletePlan(id)
            
        } catch (error) {
            toast.error('error occurs')
        }
    }

    // console.log(plan,selectedPlanId)

  return <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
        {plan && plan?.map((e,i)=>{
            return <div key={i} className="card    bg-gradient-to-br from-sky-600 to-fuchsia-600 text-white  shadow-sm">
            <div className="card-body">
              <span className="badge badge-xs badge-warning">Most Popular</span>
              <div className="flex justify-between">
                <h2 className="text-3xl font-bold">{e.name}</h2>
                <span className="text-xl">₹{e.amount}/mo</span>
              </div>
              <ul className="mt-6 flex flex-col gap-2 text-xs">
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 me-2 inline-block text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>Speed : {e.speed}<sub>/mbps</sub>
                  </span>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 me-2 inline-block text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>Unlimited data</span>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 me-2 inline-block text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>No activation fee</span>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 me-2 inline-block text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>3/6/12 months subscription</span>
                
                </li>
               
               
              </ul>
              {isAdmin =='admin'?<><div className="mt-6 flex justify-between">
                 <div className="">
                            <button
                              className="btn btn-success"
                              onClick={() => {
                                dispatch(setSelectedPlan(e._id))
                                document.getElementById("my_modal_15").showModal()}
                            }
                            >
                             Edit <AiFillEdit />
                            </button>
                            <dialog id="my_modal_15" className="modal ">
                              <div className="modal-box bg-gradient-to-br from-sky-600 to-fuchsia-600">
                                <form method="dialog">
                                  {/* if there is a button in form, it will close the modal */}
                                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                    ✕
                                  </button>
                                </form>
                                {/* <h3 className="font-bold text-lg">Hello!</h3> */}
                               <EditPlan />
                              </div>
                            </dialog>
                          </div>
                <button className="btn btn-error " onClick={()=>handleDelete(e._id)}>Delete</button>
              </div></>:<></>}
            </div>
          </div>
        })}
    </div>
  </>
}

export default PlanCard