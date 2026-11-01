import React, { useState } from 'react';
import { CreditCard, QrCode, Building, Banknote, ShieldAlert, CheckCircle2, AlertTriangle, Printer, X } from 'lucide-react';
import api from '../../api/client';
import Button from '../ui/Button';

export const DemoPaymentModal = ({
  isOpen,
  onClose,
  order,
  onSuccess
}) => {
  const [method, setMethod] = useState('demo_upi');
  const [scenario, setScenario] = useState('success');
  const [amount, setAmount] = useState(order?.balanceAmount || 50000);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const maxAmount = order.balanceAmount || order.totalAmount || 150000;

  const paymentMethods = [
    { id: 'demo_upi', label: 'Demo UPI', icon: QrCode, desc: 'Instant UPI QR / VPA simulation' },
    { id: 'demo_card', label: 'Demo Card', icon: CreditCard, desc: 'Simulated Visa/Mastercard test gateway' },
    { id: 'demo_netbanking', label: 'Demo Net Banking', icon: Building, desc: 'Simulated NEFT / RTGS / IMPS' },
    { id: 'demo_cash', label: 'Demo Cash Receipt', icon: Banknote, desc: 'Simulated field cash collection' }
  ];

  const scenarios = [
    { id: 'success', label: 'Approved Transaction (Simulate Instant Success)', color: 'text-emerald-400' },
    { id: 'insufficient_funds', label: 'Test Decline: Insufficient Balance', color: 'text-amber-400' },
    { id: 'network_failure', label: 'Test Timeout: Simulated Gateway Timeout', color: 'text-rose-400' },
    { id: 'card_declined', label: 'Test Card Error: Invalid / Blocked Card', color: 'text-rose-400' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      setError('Please specify a positive payment amount.');
      return;
    }
    if (payAmount > maxAmount) {
      setError(`Amount cannot exceed the remaining balance of ₹${maxAmount.toLocaleString('en-IN')}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/transactions/demo', {
        orderId: order._id,
        amount: payAmount,
        paymentMethod: method,
        demoScenario: scenario,
        notes: notes || 'Demo Hackathon Transaction'
      });

      setResult(res.data || res);
      if (onSuccess) {
        onSuccess(res.data || res);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo transaction simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Demo Payment Simulation</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Order #{order.orderNumber} • Outstanding: ₹{maxAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Alert */}
        <div className="px-5 py-3 bg-amber-950/40 border-b border-amber-500/30 flex items-start space-x-2.5 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-amber-300">DEMO PAYMENT – NOT A REAL BANK TRANSACTION.</strong> This test sandbox allows evaluating milestone payments, receipts, and order balance deductions without connecting to live banking rails.
          </p>
        </div>

        {result ? (
          /* Success Screen */
          <div className="p-6 space-y-4">
            <div className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white">Demo Transaction Successful!</h4>
              <p className="text-xs text-emerald-300 font-mono mt-1">
                Receipt #{result.payment?.receiptNumber || 'RCP-DEMO-CONFIRMED'}
              </p>
              <p className="text-2xl font-black text-white font-mono mt-3">
                ₹{Number(result.payment?.amount || amount).toLocaleString('en-IN')}
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex justify-between text-xs text-slate-300">
                <span>Updated Remaining Balance:</span>
                <span className="font-mono font-bold text-amber-400">
                  ₹{Number(result.order?.balanceAmount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  onClose();
                }}
              >
                Close Window
              </Button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Demo Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. Select Demo Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = method === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-solar-500 bg-solar-500/10 text-white ring-1 ring-solar-500'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-solar-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold">{m.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  2. Payment Amount (₹ INR)
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(maxAmount)}
                  className="text-[11px] text-solar-400 hover:underline font-mono"
                >
                  Pay Full Balance (₹{maxAmount.toLocaleString('en-IN')})
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-solar-400 focus:outline-none"
                placeholder="Enter payment amount"
                required
              />
            </div>

            {/* Scenario Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                3. Demonstration Test Scenario
              </label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-solar-400 focus:outline-none"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Choose whether the demo bank gateway approves the transaction or simulates a failure test case.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Advance rooftop installation tranche"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-solar-400 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                Simulate Demo Payment
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DemoPaymentModal;

