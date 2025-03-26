import React from 'react'
import { FiMenu } from "react-icons/fi";
import logo from "../assets/skycommlogo1.png"
import { FiUser } from "react-icons/fi";

function NavBar({ toggleSidebar }) {
  let user = JSON.parse(localStorage.getItem('data'))?.userName
    return (
        <nav className="bg-[#2a2544]  text-white  p-4 flex justify-between shadow-xl items-center">
          <h1 className="text-xl font-bold flex items-center">
          <button className=" text-2xl" onClick={toggleSidebar}>
            <FiMenu />
          </button>
            <div className=" w-12 h-12 md:h-16 md:w-16"><img src={logo} alt="" /></div>
            <div className="flex flex-col items center justify-center text-sm md:text-lg  bg-gradient-to-br from-sky-600 to-fuchsia-600 bg-clip-text text-transparent">
                <p className="">Sky Communication</p>
                <p className="">Internet Services</p>
            </div>
          </h1>
          <div className="flex items-center gap-2"><div className=""><FiUser /></div>
          <div className="uppercase">{user}</div></div>

        </nav>
      );

}

export default NavBar