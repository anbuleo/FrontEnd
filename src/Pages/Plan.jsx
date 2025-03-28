import React, { useEffect } from 'react'
import Layout from '../Components/Layout'
import CustomerTable from '../Components/SubComponents/CustomerTable'
import CreatePlan from '../Components/SubComponents/CreatePlan'
import { AiOutlineUserAdd } from 'react-icons/ai'
import PlanCard from '../Components/SubComponents/PlanCard'
import { AiOutlineSisternode } from "react-icons/ai";
import UseReloadHook from '../Hooks/UseReloadHook'
import AOS from "aos";
import "aos/dist/aos.css";
// import { AiOutlineSisternode } from "react-icons/ai";
function Plan() {
    let {ReloadPlan} = UseReloadHook()
    useEffect(()=>{
      AOS.init({ duration: 800, easing: "ease-in-out", once: true });
        ReloadPlan()
    },[])
  return <>
 
    <Layout>
        <div className="">
          <div className="flex justify-end">
            <button
              className="btn btn-success"
              onClick={() => document.getElementById("my_modal_5").showModal()}
            >
             Create Plan <AiOutlineSisternode />
            </button>
            <dialog id="my_modal_5" className="modal ">
              <div className="modal-box bg-gradient-to-br from-sky-600 to-fuchsia-600">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
                {/* <h3 className="font-bold text-lg">Hello!</h3> */}
               <CreatePlan />
              </div>
            </dialog>
          </div>
        </div>
        <div className="py-2">
          <PlanCard />
        </div>
      </Layout>
   
  </>
}

export default Plan