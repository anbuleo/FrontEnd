import React from 'react'
import Layout from '../Components/Layout'
import CustomerTable from '../Components/SubComponents/CustomerTable'
import { AiOutlineUserAdd } from "react-icons/ai";
import CreateCustomer from './CreateCustomer';


function Customer() {
  return (
    <>
      <Layout>
        <div className="">
          <div className="">
            <button
              className="btn btn-success"
              onClick={() => document.getElementById("my_modal_8").showModal()}
            >
             create Customer <AiOutlineUserAdd />
            </button>
            <dialog id="my_modal_8" className="modal ">
              <div className="modal-box bg-gradient-to-br from-sky-600 to-fuchsia-600">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
                {/* <h3 className="font-bold text-lg">Hello!</h3> */}
               <CreateCustomer />
              </div>
            </dialog>
          </div>
        </div>
        <div className="">
          <CustomerTable />
        </div>
      </Layout>
    </>
  );
}

export default Customer