import { useState } from 'react';
import NavBar from './NavBar';
import SideBar from './SideBar';
import Footer from './Footer';

function Layout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#F1F5F4] text-[#141918] flex">
      {/* Persistent desktop sidebar & mobile drawer */}
      <SideBar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#101E1D]/60 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main application workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <NavBar toggleSidebar={toggleSidebar} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default Layout;
