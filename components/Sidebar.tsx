
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'customers' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'customers' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'customers', label: 'Customer Ledger', icon: 'fa-users' },
    { id: 'settings', label: 'Cloud Sync', icon: 'fa-sync' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-orange-600 p-2 rounded-lg">
          <i className="fas fa-wallet text-xl"></i>
        </div>
        <span className="text-lg font-bold tracking-tight">SmartLedger ₹</span>
      </div>
      
      <nav className="flex-1 px-4 mt-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">System Status</p>
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-xs text-slate-300">Local DB Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
