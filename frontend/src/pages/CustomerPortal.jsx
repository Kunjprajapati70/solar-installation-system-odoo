import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Zap,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Send,
  Sparkles,
  QrCode,
  Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../components/ui/Button';
import DemoPaymentModal from '../components/common/DemoPaymentModal';
import PrintDocumentModal from '../components/common/PrintDocumentModal';

const CustomerPortal = () => {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, equipment, payments, tickets

  // Service Complaint Form State
  const [showRaiseTicketModal, setShowRaiseTicketModal] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState({ isOpen: false, order: null });
  const [printModalState, setPrintModalState] = useState({ isOpen: false, document: null, type: 'invoice' });
  const [ticketForm, setTicketForm] = useState({
    equipmentSerialNumber: '',
    issueCategory: 'inverter_fault',
    priority: 'medium',
    title: '',
    description: ''
  });

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      // If customer role, get customer summary
      const custRes = await api.get('/customers');
      if (custRes.success && custRes.data.length > 0) {
        const primaryCust = custRes.data[0];
        const summaryRes = await api.get(`/customers/${primaryCust._id}/summary`);
        if (summaryRes.success) {
          setCustomerData(summaryRes.data);
          if (summaryRes.data.warranties?.length > 0) {
            setTicketForm(prev => ({
              ...prev,
              equipmentSerialNumber: summaryRes.data.warranties[0].serialNumber
            }));
          }
        }
      }
    } catch (err) {
      console.error('Fetch customer portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [user]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/service-tickets', {
        ...ticketForm,
        customerId: customerData?.customer?._id
      });
      if (res.success) {
        alert(res.message);
        setShowRaiseTicketModal(false);
        fetchCustomerProfile();
      }
    } catch (err) {
      alert(`Failed to raise ticket: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-solar-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cust = customerData?.customer || {};
  const orders = customerData?.orders || [];
  const primaryOrder = orders[0] || {};
  const installations = customerData?.installations || [];
  const activeInstall = installations[0] || {};
  const warranties = customerData?.warranties || [];
  const payments = customerData?.payments || [];
  const tickets = customerData?.tickets || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Welcome Header */}
      <div className="p-6 rounded-2xl glass-card border border-solar-500/20 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Home className="w-4 h-4" />
            <span>Feature 5 • Dedicated Customer Tracking Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, <span className="gradient-solar-text">{cust.name || 'Valued Customer'}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Rooftop Solar Site: <span className="text-slate-200">{cust.installationAddress?.street}, {cust.installationAddress?.city}</span>
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-solar-400 border border-slate-700">
            Consumer No: {cust.consumerNumber || 'BESCOM-8923412'} • Sanctioned Load: {cust.sanctionedLoadKw || 5} kW
          </span>
        </div>

        <button
          onClick={() => setShowRaiseTicketModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-solar-500 hover:bg-solar-400 text-midnight-950 text-xs font-bold shadow-glow-solar transition self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Service Complaint</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Rooftop Tracker & Milestones', icon: Zap },
          { id: 'equipment', label: 'My Equipment & Serials', icon: QrCode },
          { id: 'warranties', label: 'Warranty Certificates', icon: ShieldCheck },
          { id: 'payments', label: 'Billing & Invoices', icon: CreditCard },
          { id: 'tickets', label: 'Service Tickets', icon: LifeBuoy }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 border-b-2 transition ${
                isActive
                  ? 'border-solar-500 text-solar-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Rooftop Tracker & Milestones */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Live Progress Card */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-solar-400">Project Order: {primaryOrder.orderNumber || 'ORD-2026-0001'}</span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {primaryOrder.systemCapacityKw || 5} kW {primaryOrder.systemType?.toUpperCase() || 'ON-GRID'} Solar Installation
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {primaryOrder.orderStatus?.replace('_', ' ') || 'IN PROGRESS'}
              </span>
            </div>

            {/* Stepped Timeline */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Installation Lifecycle Milestones
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { title: '1. Advance Paid & Confirmed', desc: 'Site survey approved and order locked.', status: 'completed' },
                  { title: '2. Equipment Serialization', desc: 'Hardware checked and assigned serials.', status: 'completed' },
                  { title: '3. Rooftop Mounting & Wiring', desc: 'Panels mounted and inverter synced.', status: 'completed' },
                  { title: '4. Delivery Handover & Warranty', desc: 'Warranty active and net meter ready.', status: primaryOrder.deliveryConfirmedAt ? 'completed' : 'in_progress' }
                ].map((step, idx) => {
                  const isDone = step.status === 'completed';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span className="font-bold text-white">{step.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technician Info */}
            {activeInstall.leadTechnician && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Lead Solar Technician</span>
                  <p className="font-bold text-white">{activeInstall.leadTechnician.name}</p>
                </div>
                <span className="font-mono text-sky-400">{activeInstall.leadTechnician.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Equipment & Serial Numbers */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            All solar assets deployed on your rooftop are uniquely serialized with tamper-proof QR code badges for lifetime service tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl glass-card border border-slate-800 flex items-start space-x-4">
                <div className="p-2 bg-white rounded-lg shrink-0">
                  <QRCodeSVG value={item.serialNumber} size={64} />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-mono font-bold text-solar-400 block">{item.serialNumber}</span>
                  <p className="font-bold text-white capitalize">{item.category} Module</p>
                  <p className="text-slate-400">{item.brand} - {item.model}</p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold">
                    ✓ Valid Under {item.durationYears} Year Warranty
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Warranty Certificates */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map((w) => (
              <div key={w._id} className="p-4 rounded-xl glass-card border border-emerald-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono text-solar-400 font-bold">{w.certificateNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active & Covered
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white capitalize">{w.category} ({w.durationYears} Years Coverage)</p>
                  <p className="font-mono text-slate-300">Serial: {w.serialNumber}</p>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-mono">
                    <span>Valid From: {new Date(w.startDate).toLocaleDateString()}</span>
                    <span className="text-emerald-400">Expires: {new Date(w.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                  ✓ Eligible for ₹0 repair charge on all manufacturer defects and power degradation.
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => setPrintModalState({ isOpen: true, document: w, type: 'warranty' })}
                  >
                    Print Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {orders.length > 0 && orders[0].balanceAmount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Outstanding Balance Due</span>
                <p className="text-xl font-bold font-mono text-white mt-0.5">
                  ₹{orders[0].balanceAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-amber-300/80">Order #{orders[0].orderNumber} • Milestone Payment Pending</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={CreditCard}
                  onClick={() => setPaymentModalState({ isOpen: true, order: orders[0] })}
                >
                  Pay Now (Demo)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Printer}
                  onClick={() => setPrintModalState({ isOpen: true, document: orders[0], type: 'invoice' })}
                >
                  View Invoice
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl glass-card overflow-hidden border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-solar-400">{p.receiptNumber}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">{p.paymentType}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 uppercase text-slate-400 font-mono">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 font-bold uppercase text-[10px]">Completed</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Printer}
                        onClick={() => setPrintModalState({ isOpen: true, document: p, type: 'receipt' })}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Service Complaints */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Your Raised Complaints ({tickets.length})</h3>
            <button
              onClick={() => setShowRaiseTicketModal(true)}
              className="px-3 py-1.5 rounded-lg bg-solar-500 hover:bg-solar-400 text-midnight-950 text-xs font-bold"
            >
              Raise New Complaint
            </button>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t._id} className="p-4 rounded-xl glass-card border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-solar-400 font-bold">{t.ticketNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">{t.title}</h4>
                <p className="text-slate-400">{t.description}</p>
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">
                    Serial: <strong className="text-white font-mono">{t.equipmentSerialNumber}</strong>
                  </span>
                  <span className="font-bold text-emerald-400">
                    Billed to Customer: ₹{t.charges?.totalCustomerPayable || 0} (Under Warranty)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showRaiseTicketModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <LifeBuoy className="w-5 h-5 text-solar-400" />
                <span>Raise Solar Service Complaint</span>
              </h3>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Equipment Serial Number</label>
                <input
                  type="text"
                  value={ticketForm.equipmentSerialNumber}
                  onChange={(e) => setTicketForm({ ...ticketForm, equipmentSerialNumber: e.target.value })}
                  placeholder="e.g. SP-INV-2026-00001"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Issue Category</label>
                <select
                  value={ticketForm.issueCategory}
                  onChange={(e) => setTicketForm({ ...ticketForm, issueCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="inverter_fault">Inverter Fault / Error Code</option>
                  <option value="generation_drop">Power Generation Drop</option>
                  <option value="grid_sync_issue">Grid Sync Tripping</option>
                  <option value="routine_maintenance">Routine Cleaning & Health Check</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Complaint Title</label>
                <input
                  type="text"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder="Brief summary of the problem"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  rows="3"
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Describe when the issue occurs, error codes on display, etc."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRaiseTicketModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold rounded-lg"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demo Payment Modal */}
      {paymentModalState.isOpen && (
        <DemoPaymentModal
          isOpen={paymentModalState.isOpen}
          order={paymentModalState.order}
          onClose={() => setPaymentModalState({ isOpen: false, order: null })}
          onPaymentSuccess={() => {
            fetchCustomerProfile();
          }}
        />
      )}

      {/* Printable Document Modal */}
      {printModalState.isOpen && (
        <PrintDocumentModal
          isOpen={printModalState.isOpen}
          documentData={printModalState.document}
          documentType={printModalState.type}
          onClose={() => setPrintModalState({ isOpen: false, document: null, type: 'invoice' })}
        />
      )}
    </div>
  );
};

export default CustomerPortal;
