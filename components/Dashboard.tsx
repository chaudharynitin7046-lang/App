
import React, { useState, useEffect } from 'react';
import { BusinessStats, Customer, Transaction, AIInsight } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { getBusinessInsights } from '../services/geminiService.ts';

interface DashboardProps {
  stats: BusinessStats;
  customers: Customer[];
  transactions: Transaction[];
  isSyncing?: boolean;
  handleRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, customers, transactions, isSyncing, handleRefresh }) => {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingAI(true);
      const result = await getBusinessInsights(customers, transactions, stats);
      setInsights(result);
      setLoadingAI(false);
    };
    if (customers.length > 0) fetchInsights();
  }, [customers.length, transactions.length, stats]);

  const barData = [
    { name: 'Today', sales: stats.dailySales, payments: stats.dailyPayments },
    { name: 'This Week', sales: stats.weeklySales, payments: stats.weeklyPayments },
    { name: 'This Month', sales: stats.monthlySales, payments: stats.monthlyPayments },
  ];

  const pieData = [
    { name: 'Collected', value: stats.totalPaid, color: '#10b981' },
    { name: 'Outstanding', value: stats.totalDue, color: '#f43f5e' },
  ];

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-800">Business Summary</h2>
        {handleRefresh && stats.sheetUrl && (
          <button 
            onClick={handleRefresh}
            className="text-xs font-bold text-indigo-600 flex items-center bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <i className={`fas fa-sync-alt mr-2 ${isSyncing ? 'fa-spin' : ''}`}></i>
            Sync Now
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-4 text-blue-600">
            <div className="bg-blue-50 p-2 rounded-lg"><i className="fas fa-shopping-cart"></i></div>
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Sales</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalSales)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-4 text-emerald-600">
            <div className="bg-emerald-50 p-2 rounded-lg"><i className="fas fa-hand-holding-usd"></i></div>
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Received</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalPaid)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 ring-2 ring-rose-500/10">
          <div className="flex items-center space-x-3 mb-4 text-rose-600">
            <div className="bg-rose-50 p-2 rounded-lg"><i className="fas fa-clock"></i></div>
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Due</h3>
          </div>
          <p className="text-3xl font-black text-rose-600">{formatCurrency(stats.totalDue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Growth Trends (₹)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Sales" />
                <Bar dataKey="payments" fill="#10b981" radius={[6, 6, 0, 0]} name="Payments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-2 w-full text-left">Portfolio Status</h3>
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Due Ratio</span>
               <span className="text-lg font-black text-rose-500">
                {stats.totalSales > 0 ? Math.round((stats.totalDue / stats.totalSales) * 100) : 0}%
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <i className="fas fa-brain text-8xl"></i>
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-600 p-2 rounded-lg">
              <i className="fas fa-bolt text-white"></i>
            </div>
            <h3 className="text-xl font-bold">Smart Business Insight</h3>
          </div>
          
          {loadingAI ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-slate-300 leading-relaxed text-lg italic">
                  "{insights?.summary || "Great job keeping records! Add more transactions for automated suggestions."}"
                </p>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-4">Recommended Actions</h4>
                <ul className="space-y-3">
                  {insights?.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-sm">
                      <i className="fas fa-check-circle text-emerald-400 mt-1"></i>
                      <span>{item}</span>
                    </li>
                  ))}
                  {(!insights || insights.actionItems.length === 0) && (
                    <li className="text-slate-500 text-xs italic">Awaiting data...</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
