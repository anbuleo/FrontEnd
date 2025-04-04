import React, { useState } from 'react'
import NavBar from './NavBar';
import SideBar from './SideBar';
import Footer from './Footer';


function Layout({children}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setSidebarOpen(!isSidebarOpen);
    };
  
  return (
    <div className="flex h-screen bg-slate-200 flex-col">
      {/* Sidebar */}
      <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-100  ${
          isSidebarOpen ? "blur-sm pointer-events-none" : ""
        }`}>
        {/* Navbar */}
        <NavBar  toggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="pt-18 md:pt-24 ">{children}</main>
      </div>
        <Footer className="items-end" />
    </div>
  )
}

export default Layout