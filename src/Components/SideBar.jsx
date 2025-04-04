import React from 'react'
import { FiX, FiHome, FiSettings, FiUser } from "react-icons/fi";
import { NavLink, useNavigate } from 'react-router-dom';
import { TfiAgenda  } from "react-icons/tfi";
import { BsCashCoin } from "react-icons/bs";
import { toast } from 'react-toastify';
import logo from "../assets/skycommlogo1.png"
import { GiExpense, GiNotebook } from 'react-icons/gi';

function SideBar({ isOpen, toggleSidebar }) {
  let navigate = useNavigate()
  let isAdmin = JSON.parse(localStorage.getItem('data')).role
  return (
    <div
      className={`fixed z-50  inset-y-0 left-0 bg-[#2a2544]  text-white  w-64 p-5 transform  ${
        isOpen ? "translate-x-0 " : "-translate-x-full"
      }  transition-transform duration-300 ease-in-out`}
    >
      {/* Close Button on Mobile */}
      <button className="absolute top-4 right-4  text-2xl" onClick={toggleSidebar}>
        <FiX />
      </button>

      {/* Sidebar Content */}
      <h2 className="text-2xl font-bold mb-6 flex my-auto" > <div className=""><img  src={logo} alt="logo" style={{ width: "50px", height: "50px" }} /></div></h2>
      <ul className="space-y-4">
        <li>

       
        <NavLink to="/home" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <FiHome /> <span>Home</span>
        </NavLink>
        </li>
        <li>

        <NavLink to="/customer" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <FiUser /> <span>Customer</span>
        </NavLink>
        </li>
        <li>

        <NavLink to="/collection" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <BsCashCoin /> <span>Collections</span>
        </NavLink>
        </li>
        <li>

        <NavLink to="/plan" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <TfiAgenda  /> <span>plan</span>
        </NavLink>
        </li>
        <li>

        <NavLink to="/expense" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <GiExpense  /> <span>Expense</span>
        </NavLink>
        </li>
        <li>

        <NavLink to="/dailycollection" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <GiNotebook  /> <span>Daily collection</span>
        </NavLink>
        </li>
        {isAdmin==='admin'?<><li className="">
        <NavLink to="/admin" className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded transition ${
              isActive ? "bg-blue-600 font-bold !flex" : "hover:bg-blue-700"
            }`
          }>
          <TfiAgenda  /> <span>Admin</span>
        </NavLink>
        </li></>:<></>}
        <li className='btn btn-error  text-orange-200'><p onClick={()=>{
        sessionStorage.clear()
        localStorage.clear()
        toast.success('log out success')
        // /localStorage.removeItem('persist:root')
        navigate('/')
      }}>Sign Out</p></li>
      </ul>
    </div>
  );
}

export default SideBar