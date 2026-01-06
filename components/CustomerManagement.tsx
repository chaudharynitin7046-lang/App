
import React, { useState } from 'react';
import { Customer, Transaction, TransactionType } from '../types.ts';

interface CustomerManagementProps {
  customers: Customer[];
  addCustomer: (name: string, phone: string) => void;
  updateCustomer: (id: string, name: string, phone: string) => void;
  toggleCustomerStatus: (id: string) => void;
  deleteCustomer: (id: string) => void;
  addTransaction: (customerId: string, type: TransactionType, amount: number, description: string) => void;
  transactions: Transaction[];
  upiId?: string;
  businessName?: string;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ 
  customers, 
  addCustomer, 
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
  addTransaction,
  transactions,
  upiId,
  businessName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('SALE');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesStatus = showInactive ? true : c.isActive;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const getUpiLink = (amount: number) => {
    if (!upiId) return null;
    const biz = encodeURIComponent(businessName || 'NITINBHAI MEGHARAJBHAI CHAUDHARI');
    return `upi://pay?pa=${upiId}&pn=${biz}&am=${amount}&cu=INR&tn=PaymentToMomai`;
  };

  const getQrUrl = (amount: number) => {
    const upiLink = getUpiLink(amount);
    if (!upiLink) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustName && newCustPhone) {
      addCustomer(newCustName, newCustPhone);
      setNewCustName(''); setNewCustPhone(''); setShowAddCustomer(false);
    }
  };

  const handleEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer && newCustName && newCustPhone) {
      updateCustomer(selectedCustomer.id, newCustName, newCustPhone);
      setShowEditCustomer(false);
    }
  };

  const openEditModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCustomer) {
      setNewCustName(selectedCustomer.name);
      setNewCustPhone(selectedCustomer.phone.replace('+91', ''));
      setShowEditCustomer(true);
    }
  };

  const sendWhatsApp = (customer: Customer) => {
    const upiLink = getUpiLink(customer.due);
    let message = `Namaste ${customer.name}, this is a reminder regarding your pending balance of ${formatCurrency(customer.due)} at ${businessName || 'Momai Cattelfood'}.`;
    
    if (upiLink) {
      message += `\n\nYou can pay directly using this link:\n${upiLink}\n\nThank you!`;
    } else {
      message += `\n\nPlease clear it at your earliest convenience. Thank you!`;
    }

    const encoded = encodeURIComponent(message);
    const cleanPhone = customer.phone.replace(/[^\d+]/g, '').replace('+', '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer && txAmount) {
      addTransaction(selectedCustomer.id, txType, parseFloat(txAmount), txDesc || (txType === 'PAYMENT' ? 'Payment Received' : 'Sale Entry'));
      setTxAmount(''); setTxDesc(''); setShowAddTx(false);
    }
  };

  const customerTransactions = transactions.filter(t => t.customerId === selectedCustomerId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-20 md:pb-0">
      {/* Customer List Column */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Customers</h2>
            <div className="flex space-x-2">
               <button type="button" onClick={() => setShowInactive(!showInactive)} className={`p-2.5 rounded-xl border transition-colors ${showInactive ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'}`} title="Toggle Inactive">
                <i className={`fas ${showInactive ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
              <button type="button" onClick={() => { setNewCustName(''); setNewCustPhone(''); setShowAddCustomer(true); }} className="bg-orange-600 text-white p-2.5 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-500/20">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
          <div className="relative mb-6">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredCustomers.map(customer => (
              <button key={customer.id} type="button" onClick={() => setSelectedCustomerId(customer.id)} className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedCustomerId === customer.id ? 'bg-orange-50 border-orange-100 ring-1 ring-orange-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'} ${!customer.isActive ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-800">{customer.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${customer.due > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {customer.due > 0 ? formatCurrency(customer.due) : 'Settled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{customer.phone}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Column */}
      <div className="xl:col-span-2 space-y-6">
        {selectedCustomer ? (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className={`text-2xl font-bold ${selectedCustomer.isActive ? 'text-slate-900' : 'text-slate-400'}`}>{selectedCustomer.name}</h2>
                    <button type="button" onClick={openEditModal} className="text-slate-300 hover:text-orange-600 transition-colors p-2" title="Edit Profile"><i className="fas fa-pen text-sm"></i></button>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">{selectedCustomer.phone}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.due > 0 && upiId && (
                    <button type="button" onClick={() => setShowQrModal(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-700 flex items-center space-x-2 shadow-lg shadow-indigo-600/20">
                      <i className="fas fa-qrcode"></i><span className="text-sm">Pay QR</span>
                    </button>
                  )}
                  <button type="button" onClick={() => sendWhatsApp(selectedCustomer)} disabled={!selectedCustomer.isActive} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-600/20">
                    <i className="fab fa-whatsapp text-xl"></i><span className="text-sm">WhatsApp</span>
                  </button>
                  <button type="button" onClick={() => { setTxType('SALE'); setShowAddTx(true); }} disabled={!selectedCustomer.isActive} className="bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center space-x-2 shadow-lg shadow-orange-600/20">
                    <i className="fas fa-plus"></i><span className="text-sm">Add Udhaar</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Sale</p><p className="text-xl font-bold text-slate-900">{formatCurrency(selectedCustomer.totalSales)}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-emerald-500"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Paid</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedCustomer.totalPaid)}</p></div>
                <div className="bg-rose-50 p-4 rounded-2xl border-l-4 border-rose-500"><p className="text-[10px] text-rose-500 font-bold uppercase mb-1">Remaining Due</p><p className="text-xl font-bold text-rose-600">{formatCurrency(selectedCustomer.due)}</p></div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                <button type="button" onClick={() => toggleCustomerStatus(selectedCustomer.id)} className="text-xs font-bold text-slate-600 hover:text-slate-900"><i className="fas fa-ban mr-2"></i>{selectedCustomer.isActive ? 'Deactivate' : 'Reactivate'}</button>
                <button type="button" onClick={() => deleteCustomer(selectedCustomer.id)} className="text-xs font-bold text-rose-600 hover:text-rose-800"><i className="fas fa-trash-alt mr-2"></i>Delete</button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Records</h3>
              <div className="space-y-4">
                {customerTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-xl ${tx.type === 'SALE' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <i className={`fas ${tx.type === 'SALE' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <p className={`font-black ${tx.type === 'SALE' ? 'text-slate-900' : 'text-emerald-600'}`}>{tx.type === 'SALE' ? '' : '-'}{formatCurrency(tx.amount)}</p>
                  </div>
                ))}
                {customerTransactions.length === 0 && <p className="text-center text-slate-400 py-8 italic text-sm">No entries yet.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 border-dashed">
            <div className="bg-slate-50 p-6 rounded-full mb-4"><i className="fas fa-user-tag text-6xl text-slate-200"></i></div>
            <h3 className="text-xl font-bold text-slate-800">Select Customer</h3>
            <p className="text-slate-400 text-center max-w-xs mt-2 text-sm">Choose a customer from the left list to manage ledger.</p>
          </div>
        )}
      </div>

      {/* QR Code Modal - Styled like the reference image */}
      {showQrModal && selectedCustomer && upiId && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-[#0e0e0e] w-full max-w-sm rounded-3xl p-8 shadow-2xl relative text-center border border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
            
            <div className="flex flex-col items-center justify-center space-y-4 pt-4">
              {/* PhonePe Logo area */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-[#5f259f] p-2.5 rounded-2xl">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9 16.5v-9l7 4.5-7 4.5z" fill="white"/>
                   </svg>
                </div>
                <span className="text-white text-2xl font-bold tracking-tight">PhonePe</span>
              </div>
              
              <p className="text-[#a66ee4] font-bold text-lg tracking-wide uppercase">ACCEPTED HERE</p>
              
              <p className="text-slate-400 text-sm mb-4">Scan & Pay Using PhonePe App</p>
              
              {/* The QR Code Container */}
              <div className="bg-white p-6 rounded-2xl relative">
                <img src={getQrUrl(selectedCustomer.due) || ''} alt="Payment QR" className="w-full h-auto" />
                {/* Logo in the center of QR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white p-1 rounded-full shadow-md">
                    <div className="bg-[#5f259f] w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black">पे</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 w-full">
                <p className="text-white font-bold text-sm tracking-widest uppercase break-words px-4 leading-relaxed">
                  {businessName || 'NITINBHAI MEGHARAJBHAI CHAUDHARI'}
                </p>
                <p className="text-slate-500 text-[10px] font-mono mt-2">{upiId}</p>
                <p className="text-emerald-400 font-black text-2xl mt-4">{formatCurrency(selectedCustomer.due)}</p>
              </div>

              <div className="pt-8 border-t border-slate-800 w-full">
                <p className="text-slate-600 text-[9px] font-medium leading-tight">
                  © 2026, All rights reserved, PhonePe Ltd (Formerly known as 'PhonePe Private Ltd')
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddCustomer || showEditCustomer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{showEditCustomer ? 'Edit Profile' : 'New Customer'}</h3>
              <button type="button" onClick={() => { setShowAddCustomer(false); setShowEditCustomer(false); }} className="text-slate-400 hover:text-slate-600 p-2"><i className="fas fa-times text-lg"></i></button>
            </div>
            <form onSubmit={showEditCustomer ? handleEditCustomer : handleAddCustomer} className="space-y-6">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Name</label><input autoFocus required type="text" value={newCustName} onChange={e => setNewCustName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 font-medium" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+91</div><input required type="tel" pattern="[0-9]{10}" value={newCustPhone} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 10) setNewCustPhone(val); }} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold" /></div></div>
              <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition-colors">Save Details</button>
            </form>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showAddTx && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add Entry</h3>
              <button type="button" onClick={() => setShowAddTx(false)} className="text-slate-400 hover:text-slate-600 p-2"><i className="fas fa-times text-lg"></i></button>
            </div>
            <form onSubmit={handleAddTx} className="space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button type="button" onClick={() => setTxType('SALE')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${txType === 'SALE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Udhaar (Sale)</button>
                <button type="button" onClick={() => setTxType('PAYMENT')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${txType === 'PAYMENT' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Jama (Paid)</button>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount (₹)</label><input autoFocus required type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold text-lg" placeholder="0.00" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Note (Optional)</label><textarea value={txDesc} onChange={e => setTxDesc(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 h-24 resize-none text-sm" placeholder="e.g. 5kg Feed..." /></div>
              <button type="submit" className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-colors ${txType === 'SALE' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>Confirm Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
