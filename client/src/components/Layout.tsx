import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSimulator = location.pathname === '/dashboard/simulator';

  // Simulator renders fullscreen without layout chrome
  if (isSimulator) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#060913] text-[#f8fafc] overflow-hidden dashboard-theme">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in-up relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};
