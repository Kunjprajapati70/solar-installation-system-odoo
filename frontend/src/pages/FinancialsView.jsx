import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Layers,
  X
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';

const FinancialsView = () => {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const [payPage, setPayPage] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);
  const [expPage, setExpPage] = useState(1);
  const [expPageSize, setExpPageSize] = useState(10);

  // New Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'equipment_procurement',
    payee: '',
    amount: 15000,
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, expRes] = await Promise.all([
        api.get('/payments'),
        api.get('/expenses')
      ]);

      if (payRes.success) setPayments(payRes.data);
      if (expRes.success) setExpenses(expRes.data);
    } catch (err) {
      console.error('Fetch financials error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses', expenseForm);
      if (res.success) {
        alert('Expense recorded successfully!');
        setShowExpenseModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Expense logging failed: ${err.message}`);
    }
  };

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Commercial Accounts & Cash Flow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Payments <span className="gradient-solar-text">& Operating Expenses</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Customer milestone collections, hardware procurement expenses, technician labour, and net margin.
          </p>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold text-xs shadow-glow-solar"
        >
          <Plus className="w-4 h-4" />
          <span>Log Operating Expense</span>
        </button>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-card border-l-4 border-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Total Revenue Collected</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-400 font-medium">Customer Project Receipts</span>
        </div>

        <div className="p-4 rounded-xl glass-card border-l-4 border-rose-500">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Operating & Hardware Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">₹{totalExpenses.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-400">Procurement + Labour + Freight</span>
        </div>

        <div className="p-4 rounded-xl glass-card border-l-4 border-solar-500">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase font-semibold">Estimated Net Operating Margin</span>
            <DollarSign className="w-4 h-4 text-solar-400" />
          </div>
          <p className="text-2xl font-bold text-solar-400 font-mono">₹{netProfit.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-400">~{((netProfit / (totalRevenue || 1)) * 100).toFixed(1)}% Net Margin</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 border-b-2 transition ${
            activeTab === 'payments' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Payment Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 border-b-2 transition ${
            activeTab === 'expenses' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Operating Expenses Log ({expenses.length})
        </button>
      </div>

      {activeTab === 'payments' ? (
        <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Receipt #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Milestone Type</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {payments.slice((payPage - 1) * payPageSize, payPage * payPageSize).map((p) => (
                <tr key={p._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{p.receiptNumber}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{p.customer?.name}</td>
                  <td className="py-2.5 px-3 capitalize text-slate-300">{p.paymentType}</td>
                  <td className="py-2.5 px-3 uppercase text-slate-400 font-mono">{p.paymentMethod}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    ₹{p.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400 font-bold uppercase text-[10px]">Verified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length > payPageSize && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={payPage}
                totalPages={Math.ceil(payments.length / payPageSize) || 1}
                onPageChange={(p) => setPayPage(p)}
                totalItems={payments.length}
                pageSize={payPageSize}
                onPageSizeChange={(newSize) => {
                  setPayPageSize(newSize);
                  setPayPage(1);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Expense #</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Payee / Vendor</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {expenses.slice((expPage - 1) * expPageSize, expPage * expPageSize).map((e) => (
                <tr key={e._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{e.expenseNumber}</td>
                  <td className="py-2.5 px-3 capitalize text-slate-300">{e.category?.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{e.payee}</td>
                  <td className="py-2.5 px-3 text-slate-400">{e.description}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                    ₹{e.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(e.expenseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length > expPageSize && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={expPage}
                totalPages={Math.ceil(expenses.length / expPageSize) || 1}
                onPageChange={(p) => setExpPage(p)}
                totalItems={expenses.length}
                pageSize={expPageSize}
                onPageSizeChange={(newSize) => {
                  setExpPageSize(newSize);
                  setExpPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-solar-400" />
                <span>Log Operating Expense</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="equipment_procurement">Equipment Hardware Procurement</option>
                  <option value="technician_labour">Technician Installation Labour</option>
                  <option value="transportation_logistics">Transportation & Freight</option>
                  <option value="permits_and_liaison">Discom Liaison & Net Meter Permits</option>
                  <option value="tools_and_safety_gear">Tools & Rooftop Safety Gear</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payee / Vendor Name</label>
                <input
                  type="text"
                  value={expenseForm.payee}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold rounded-lg shadow-glow-solar"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsView;
