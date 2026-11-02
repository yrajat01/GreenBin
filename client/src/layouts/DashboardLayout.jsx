import React from 'react';
import Navbar from '../components/common/Navbar';

export const DashboardLayout = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      <Navbar />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

