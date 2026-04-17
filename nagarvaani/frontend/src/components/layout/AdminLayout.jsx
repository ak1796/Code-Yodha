import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex font-sans antialiased text-navy relative">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 w-full relative">
        {/* Persistent Tactical Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-8 left-8 z-[40] w-14 h-14 bg-navy text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95"
        >
          <Menu size={24} />
        </button>

        {children}
      </main>
    </div>
  );
}
