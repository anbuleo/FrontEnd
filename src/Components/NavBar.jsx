import React from 'react'
import { FiMenu } from "react-icons/fi";

function NavBar({ toggleSidebar }) {
    return (
        <nav className="bg-[#8861D7]  text-white  p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Sky Communication</h1>
          <button className="md:hidden text-2xl" onClick={toggleSidebar}>
            <FiMenu />
          </button>
        </nav>
      );

}

export default NavBar