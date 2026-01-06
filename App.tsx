
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import CustomerManagement from './components/CustomerManagement.tsx';
import { Customer, Transaction, BusinessStats, TransactionType } from './types.ts';
import { v4 as uuidv4 } from 'uuid';
import { syncToGoogleSheets, fetchFromGoogleSheets } from './services/sheetsService.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'settings'>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('slp_sheet_url') || '');
  const [upiId, setUpiId] = useState<string>(localStorage.getItem('slp_upi_id') || '7046550870@ybl');
  const [businessName, setBusinessName] = useState<string>(localStorage.getItem('slp_biz_name') || 'NITINBHAI MEGHARAJBHAI CHAUDHARI');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(localStorage.getItem('slp_last_sync') || 'Never');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    const savedCustomers = localStorage.getItem('slp_customers');
    const savedTransactions = localStorage.getItem('slp_transactions');
    if (savedCustomers) {
      const parsed = JSON.parse(savedCustomers);
      setCustomers(parsed.map((c: any) => ({ ...c, isActive: c.isActive !== undefined ? c.isActive : true })));
    }
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url');
    if (sharedUrl) {
      setSheetUrl(sharedUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('slp_customers', JSON.stringify(customers));
    localStorage.setItem('slp_transactions', JSON.stringify(transactions));
    localStorage.setItem('slp_sheet_url', sheetUrl);
    localStorage.setItem('slp_upi_id', upiId);
    localStorage.setItem('slp_biz_name', businessName);
    localStorage.setItem('slp_last_sync', lastSync);
  }, [customers, transactions, sheetUrl, upiId, businessName, lastSync]);

  const handleCloudPull = useCallback(async (silent = false) => {
    if (!sheetUrl) return;
    if (!silent) setIsSyncing(true);
    try {
      const data = await fetchFromGoogleSheets(sheetUrl);
      if (data && data.customers && data.transactions) {
        setCustomers(prev => {
          const cloudIds = new Set(data.customers.map((c: any) => c.id));
          const localOnly = prev.filter(c => !cloudIds.has(c.id));
          return [...data.customers, ...localOnly].sort((a, b) => 
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
          );
        });
        setTransactions(prev => {
          const cloudIds = new Set(data.transactions.map((t: any) => t.id));
          const localOnly = prev.filter(t => !cloudIds.has(t.id));
          return [...data.transactions, ...localOnly].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (!silent) alert("Data Refreshed!");
      }
    } catch (e) {
      if (!silent) alert("Sync failed.");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [sheetUrl]);

  const stats = useMemo(() => {
    const getStats = (list: Transaction[]) => {
      const sales = list.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.amount, 0);
      const payments = list.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + t.amount, 0);
      return { sales, payments };
    };
    const allStats = getStats(transactions);
    return {
      totalSales: allStats.sales,
      totalPaid: allStats.payments,
      totalDue: allStats.sales - allStats.payments,
      dailySales: getStats(transactions.filter(t => new Date(t.date) >= new Date(new Date().setHours(0,0,0,0)))).sales,
      weeklySales: getStats(transactions.filter(t => new Date(t.date) >= new Date(new Date().setDate(new Date().getDate() - 7)))).sales,
      monthlySales: getStats(transactions.filter(t => new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))).sales,
      dailyPayments: 0, weeklyPayments: 0, monthlyPayments: 0,
      sheetUrl
    };
  }, [transactions, sheetUrl]);

  const addCustomer = async (name: string, phone: string) => {
    const cleanPhone = phone.trim();
    if (customers.some(c => c.phone.includes(cleanPhone))) { alert("Phone number already exists!"); return; }
    const newCustomer: Customer = { id: uuidv4(), name, phone: cleanPhone.startsWith('+') ? cleanPhone : '+91'+cleanPhone, totalSales: 0, totalPaid: 0, due: 0, lastActivity: new Date().toISOString(), isActive: true };
    setCustomers(prev => [newCustomer, ...prev]);
    if (sheetUrl) syncToGoogleSheets(sheetUrl, { action: 'ADD_CUSTOMER', customer: newCustomer });
  };

  const updateCustomer = async (id: string, name: string, phone: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, name, phone } : c));
    if (sheetUrl) {
      const target = customers.find(c => c.id === id);
      if (target) syncToGoogleSheets(sheetUrl, { action: 'ADD_CUSTOMER', customer: { ...target, name, phone } });
    }
  };

  const toggleCustomerStatus = async (id: string) => {
    const target = customers.find(c => c.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    setCustomers(prev => prev.map(c => c.id === id ? updated : c));
    if (sheetUrl) syncToGoogleSheets(sheetUrl, { action: 'ADD_CUSTOMER', customer: updated });
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    setTransactions(prev => prev.filter(t => t.customerId !== id));
    if (sheetUrl) syncToGoogleSheets(sheetUrl, { action: 'DELETE_CUSTOMER', customerId: id });
  };

  const addTransaction = async (customerId: string, type: TransactionType, amount: number, description: string) => {
    const timestamp = new Date().toISOString();
    const newTx: Transaction = { id: uuidv4(), customerId, type, amount, description, date: timestamp };
    setTransactions(prev => [newTx, ...prev]);
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const nS = type === 'SALE' ? c.totalSales + amount : c.totalSales;
        const nP = type === 'PAYMENT' ? c.totalPaid + amount : c.totalPaid;
        return { ...c, totalSales: nS, totalPaid: nP, due: nS - nP, lastActivity: timestamp };
      }
      return c;
    }));
    if (sheetUrl) syncToGoogleSheets(sheetUrl, { action: 'ADD_TRANSACTION', transaction: newTx });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0">
           <div className="flex items-center space-x-3 md:hidden">
            <div className="bg-orange-600 p-1.5 rounded-lg"><i className="fas fa-cow text-white text-xs"></i></div>
            <span className="font-black text-slate-800 text-sm">Momai Ledger</span>
          </div>
          <div className="flex items-center space-x-3">
            {sheetUrl && (
              <button onClick={() => handleCloudPull()} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border border-indigo-100 flex items-center">
                <i className={`fas fa-sync-alt mr-2 ${isSyncing ? 'fa-spin' : ''}`}></i> {isSyncing ? 'Syncing...' : `Synced ${lastSync}`}
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' ? (
            <Dashboard stats={stats} customers={customers} transactions={transactions} isSyncing={isSyncing} handleRefresh={() => handleCloudPull()} />
          ) : activeTab === 'customers' ? (
            <CustomerManagement 
              customers={customers} 
              addCustomer={addCustomer} 
              updateCustomer={updateCustomer} 
              toggleCustomerStatus={toggleCustomerStatus} 
              deleteCustomer={deleteCustomer} 
              addTransaction={addTransaction} 
              transactions={transactions} 
              upiId={upiId}
              businessName={businessName}
            />
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center"><i className="fas fa-id-card mr-3 text-orange-600"></i> Business Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Business Name</label>
                    <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="NITINBHAI MEGHARAJBHAI CHAUDHARI" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">UPI ID for Payments</label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="7046550870@ybl" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 font-mono text-sm" />
                    <p className="text-[10px] text-slate-400 mt-2">Example: 7046550870@ybl or store@upi</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center"><i className="fas fa-cloud mr-3 text-indigo-600"></i> Cloud Setup</h2>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mr-3">1</span> Web App URL</h4>
                  <input type="url" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="Paste Apps Script URL here" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono text-xs" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex md:hidden items-center justify-around px-4 z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center justify-center w-20 h-full ${activeTab === 'dashboard' ? 'text-orange-600' : 'text-slate-400'}`}>
          <i className="fas fa-home text-lg"></i><span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => setActiveTab('customers')} className={`flex flex-col items-center justify-center w-20 h-full ${activeTab === 'customers' ? 'text-orange-600' : 'text-slate-400'}`}>
          <i className="fas fa-book text-lg"></i><span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Ledger</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center w-20 h-full ${activeTab === 'settings' ? 'text-orange-600' : 'text-slate-400'}`}>
          <i className="fas fa-cog text-lg"></i><span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Setup</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
