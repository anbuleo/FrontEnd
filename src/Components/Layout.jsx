import React, { useState } from 'react'
import NavBar from './NavBar';
import SideBar from './SideBar';


function Layout({children}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setSidebarOpen(!isSidebarOpen);
    };
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <NavBar toggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}

export default Layout