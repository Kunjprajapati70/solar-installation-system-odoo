import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Sun, CheckCircle2, ShieldCheck, FileText, Clock } from 'lucide-react';
import Button from '../ui/Button';

const formatInr = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const labelize = (value, fallback = 'N/A') => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value).replace(/_/g, ' ');
};

export const PrintDocumentModal = ({
  isOpen,
  onClose,
  documentType = 'quotation',
  data: initialData = {},
  documentData,
  title
}) => {
  const data = documentData || initialData || {};
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-ready');
    } else {
      document.body.classList.remove('printing-ready', 'printing-active');
    }
    return () => {
      document.body.classList.remove('printing-ready', 'printing-active');
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-active');
    const done = () => {
      document.body.classList.remove('printing-active');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  };

  const company = {
    name: 'SunPower Solutions Pvt. Ltd.',
    tagline: 'MNRE Certified Tier-1 Rooftop Solar Engineering & EPC',
    gstin: '24AAACS1234F1Z5',
    cin: 'U40106GJ2020PTC112345',
    pan: 'AAACS1234F',
    address: 'Block A, 4th Floor, Solar Innovation Center, S.G. Highway, Ahmedabad, Gujarat - 380015',
    phone: '+91 79 4800 2026 / +91 98765 43210',
    email: 'support@sunpowersolutions.com | billing@sunpowersolutions.com',
    web: 'www.sunpowersolutions.com'
  };

  const nestedOrder = asObject(data.order);
  const sourceOrder = nestedOrder.orderNumber ? nestedOrder : (data.orderNumber ? data : {});
  const quotation = asObject(data.quotation?.pricing ? data.quotation : sourceOrder.quotation);
  const customer = asObject(data.customer || sourceOrder.customer);
  const address = asObject(customer.installationAddress || data.address || data.installationAddress);
  const pricing = asObject(data.pricing || quotation.pricing);
  const bom = Array.isArray(data.bom) && data.bom.length
    ? data.bom
    : (Array.isArray(quotation.bom) ? quotation.bom : []);

  const totalAmount = Number(
    data.totalAmount ??
    sourceOrder.totalAmount ??
    pricing.netPayable ??
    pricing.grossTotal ??
    0
  );
  const amountReceived = Number(data.advancePaid ?? sourceOrder.advancePaid ?? 0);
  const balanceAmount = Number(
    data.balanceAmount ??
    sourceOrder.balanceAmount ??
    Math.max(totalAmount - amountReceived, 0)
  );
  const receiptAmount = Number(data.amount ?? 0);
  const transactionReference = data.transactionReference || data.utr || data.txnRef || '';
  const paymentMethod = data.paymentMethod || sourceOrder.paymentMethod || '';
  const paymentType = data.paymentType || 'milestone';
  const paymentStatus = String(data.status || data.paymentStatus || sourceOrder.paymentStatus || 'pending').toLowerCase();
  const paidStatuses = ['completed', 'fully_paid', 'paid', 'advance_paid', 'partially_paid'];
  const invoiceSettled = paidStatuses.includes(paymentStatus) && amountReceived > 0;
  const receiptSettled = paymentStatus === 'completed' || receiptAmount > 0;
  const isDemo = Boolean(data.isDemo || String(paymentMethod).startsWith('demo_'));

  const documentId =
    title ||
    data.quotationNumber ||
    data.receiptNumber ||
    data.orderNumber ||
    sourceOrder.orderNumber ||
    data.certificateNumber ||
    data.surveyNumber ||
    data.ticketNumber ||
    'DOC-2026-001';

  const invoiceNumber = data.receiptNumber || (sourceOrder.orderNumber ? `INV-${sourceOrder.orderNumber}` : documentId);

  return createPortal(
    <div className="print-modal-shell fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="no-print px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="w-5 h-5 text-solar-400 shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              Official Document Print Preview:{' '}
              <span className="text-solar-400 font-mono">{documentId}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Button variant="primary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print / Save as PDF
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="print-preview-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-slate-900/50">
          <div
            id="printable-document"
            className="printable-document-container bg-white text-slate-900 w-full max-w-3xl mx-auto p-8 sm:p-10 shadow-lg rounded-xl border border-slate-200 text-xs sm:text-sm font-sans"
          >
            {isDemo && (
              <div className="mb-4 p-2.5 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 text-amber-900 text-center font-bold uppercase tracking-wider text-xs">
                DEMO PAYMENT RECEIPT — NOT A REAL BANK TRANSACTION — FOR SYSTEM DEMONSTRATION ONLY
              </div>
            )}

            <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-solar-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                  <Sun className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {company.name}
                  </h1>
                  <p className="text-[11px] font-semibold text-solar-700 tracking-wide uppercase">
                    {company.tagline}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    GSTIN: <span className="font-mono font-bold text-slate-700">{company.gstin}</span> | CIN: {company.cin}
                  </p>
                </div>
              </div>

              <div className="text-right w-full sm:w-auto">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
                  {documentType.toUpperCase()}
                </span>
                <p className="font-mono font-black text-base text-slate-900 mt-1">
                  #{documentType === 'invoice' ? invoiceNumber : documentId}
                </p>
                <p className="text-[11px] text-slate-600">
                  Date: <span className="font-semibold">{new Date(data.paidAt || data.createdAt || data.scheduledDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Billed / Issued To</p>
                <p className="font-bold text-slate-900 text-sm">{customer.name || data.customerName || 'Valued Solar Client'}</p>
                <p className="text-slate-600 text-xs">Customer Code: <span className="font-mono font-semibold">{customer.customerCode || 'CUST-REG'}</span></p>
                <p className="text-slate-600 text-xs">Phone: {customer.phone || data.phone || 'N/A'}</p>
                <p className="text-slate-600 text-xs">Email: {customer.email || data.email || 'N/A'}</p>
                <p className="text-slate-600 text-xs mt-1">
                  Address: {address.street || 'Site Rooftop Address'}, {address.city || 'Ahmedabad'}, {address.state || 'Gujarat'} - {address.pincode || '380015'}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Issuing Authority</p>
                <p className="font-semibold text-slate-800 text-xs">{company.name}</p>
                <p className="text-slate-600 text-xs">Headquarters: {company.address}</p>
                <p className="text-slate-600 text-xs mt-1">Direct Helpline: {company.phone}</p>
                <p className="text-slate-600 text-xs">Email: {company.email}</p>
                <p className="text-slate-600 text-xs">Web: {company.web}</p>
              </div>
            </div>

            {documentType === 'quotation' && (
              <div>
                <div className="mb-4 flex justify-between items-center bg-solar-50 border border-solar-200 p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-solar-800 font-bold">Proposed Solar Capacity: </span>
                    <span className="font-mono font-black text-solar-900">{data.systemCapacityKw || 3} kW</span>
                  </div>
                  <div>
                    <span className="text-xs text-solar-800 font-bold">System Topology: </span>
                    <span className="font-mono font-black text-solar-900 uppercase">{(data.systemType || 'on_grid').replace('_', '-')}</span>
                  </div>
                  <div>
                    <span className="text-xs text-solar-800 font-bold">Quotation Status: </span>
                    <span className="font-mono font-bold text-emerald-700 uppercase">{data.status || 'APPROVED'}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Itemized Bill of Materials (BOM)</h3>
                <table className="w-full text-left border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase text-slate-700">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Item Description & Specifications</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Rate (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {(data.bom || []).map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-500">{index + 1}</td>
                        <td className="p-2.5 font-semibold capitalize text-slate-800">{item.category}</td>
                        <td className="p-2.5 font-medium text-slate-900">
                          {item.itemName || item.name}
                          {item.specs && <span className="block text-[10px] text-slate-500 font-mono">{item.specs}</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono">{item.quantity} {item.unit || 'pcs'}</td>
                        <td className="p-2.5 text-right font-mono">{formatInr(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{formatInr(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-6">
                  <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Equipment Subtotal:</span>
                      <span className="font-mono">{formatInr(pricing.equipmentTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Installation & Commissioning:</span>
                      <span className="font-mono">{formatInr(pricing.installationLabour || pricing.laborCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Transport & Discom Liaison:</span>
                      <span className="font-mono">{formatInr(pricing.transportAndLiaison || 5000)}</span>
                    </div>
                    <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900">
                      <span>Gross EPC Total:</span>
                      <span className="font-mono">{formatInr(pricing.grossTotal)}</span>
                    </div>
                    {pricing.estimatedSubsidy > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>PM Surya Ghar Subsidy:</span>
                        <span className="font-mono">-{formatInr(pricing.estimatedSubsidy)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-sm text-slate-900">
                      <span>Net Payable Amount:</span>
                      <span className="font-mono text-base text-solar-600">{formatInr(pricing.netPayable || pricing.grossTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {documentType === 'invoice' && (
              <div className="mb-6">
                <div className={`p-5 rounded-xl border mb-6 ${invoiceSettled ? 'border-emerald-300 bg-emerald-50/60' : 'border-amber-300 bg-amber-50/70'}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    {invoiceSettled ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {invoiceSettled ? 'Tax Invoice — Collections Recorded' : 'Tax Invoice — Payment Outstanding'}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Linked Order: <span className="font-mono font-bold">{sourceOrder.orderNumber || data.orderNumber || 'N/A'}</span>
                        {quotation.quotationNumber ? (
                          <> · Quotation: <span className="font-mono font-bold">{quotation.quotationNumber}</span></>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">System</span>
                      <span className="font-bold font-mono">{data.systemCapacityKw || sourceOrder.systemCapacityKw || quotation.systemCapacityKw || 3} kW {(data.systemType || sourceOrder.systemType || quotation.systemType || 'on_grid').replace('_', '-')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Order Status</span>
                      <span className="font-bold capitalize">{labelize(sourceOrder.orderStatus || data.orderStatus, 'Confirmed')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Status</span>
                      <span className={`font-bold uppercase font-mono ${invoiceSettled ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {labelize(data.paymentStatus || sourceOrder.paymentStatus, 'Pending')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Invoice Value</span>
                      <span className="font-bold font-mono text-base text-slate-900">{formatInr(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Bill of Quantities</h3>
                <table className="w-full text-left border border-slate-300 rounded-lg overflow-hidden mb-4">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase text-slate-700">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {bom.length > 0 ? bom.map((item, index) => (
                      <tr key={index}>
                        <td className="p-2.5 font-mono text-slate-500">{index + 1}</td>
                        <td className="p-2.5 font-medium text-slate-900">
                          <span className="capitalize">{item.category ? `${item.category} · ` : ''}</span>
                          {item.itemName || item.name || 'Solar equipment'}
                          {item.specs && <span className="block text-[10px] text-slate-500 font-mono">{item.specs}</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono">{item.quantity || 1} {item.unit || 'pcs'}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{formatInr(item.totalPrice || item.unitPrice)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="p-2.5 font-mono text-slate-500">1</td>
                        <td className="p-2.5 font-medium text-slate-900">
                          Rooftop solar EPC package ({data.systemCapacityKw || sourceOrder.systemCapacityKw || 3} kW)
                        </td>
                        <td className="p-2.5 text-center font-mono">1 lot</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{formatInr(totalAmount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 mb-4">
                  <h4 className="font-bold text-slate-900 mb-1">Financial Snapshot</h4>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gross / Net Project Value:</span>
                    <span className="font-mono font-bold">{formatInr(totalAmount)}</span>
                  </div>
                  {sourceOrder.advanceRequired > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Advance Required:</span>
                      <span className="font-mono">{formatInr(sourceOrder.advanceRequired)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount Received to Date:</span>
                    <span className="font-mono text-emerald-700 font-bold">{formatInr(amountReceived)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-900 font-bold">Outstanding Balance:</span>
                    <span className={`font-mono font-black ${balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatInr(balanceAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {documentType === 'receipt' && (
              <div className="mb-6">
                <div className={`p-5 rounded-xl border mb-6 ${receiptSettled ? 'border-emerald-300 bg-emerald-50/60' : 'border-amber-300 bg-amber-50/70'}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    {receiptSettled ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {receiptSettled ? 'Payment Confirmed & Verified' : 'Payment Receipt — Settlement Pending'}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Transaction Reference:{' '}
                        <span className="font-mono font-bold">
                          {transactionReference || data.receiptNumber || 'Not issued'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Mode</span>
                      <span className="font-bold uppercase font-mono">{labelize(paymentMethod, 'UPI')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Stage</span>
                      <span className="font-bold capitalize">{labelize(paymentType, 'Milestone')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Status</span>
                      <span className={`font-bold uppercase font-mono ${receiptSettled ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {labelize(data.status, receiptSettled ? 'Completed' : 'Pending')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Amount Paid</span>
                      <span className="font-bold font-mono text-base text-emerald-700">{formatInr(receiptAmount)}</span>
                    </div>
                  </div>
                </div>

                {(sourceOrder.orderNumber || sourceOrder.totalAmount) && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 mb-4">
                    <h4 className="font-bold text-slate-900 mb-1">Linked Order Financial Snapshot</h4>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Number:</span>
                      <span className="font-mono font-bold">{sourceOrder.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Project Value:</span>
                      <span className="font-mono">{formatInr(sourceOrder.totalAmount || totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Amount Received to Date:</span>
                      <span className="font-mono text-emerald-700 font-bold">{formatInr(sourceOrder.advancePaid ?? amountReceived)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="text-slate-900 font-bold">Remaining Outstanding Balance:</span>
                      <span className="font-mono font-black text-rose-600">{formatInr(sourceOrder.balanceAmount ?? balanceAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {documentType === 'warranty' && (
              <div className="warranty-sheet avoid-break mb-6 border-2 border-amber-500 rounded-xl overflow-hidden">
                <div className="text-center px-5 py-5 bg-amber-50 border-b border-amber-200">
                  <ShieldCheck className="w-11 h-11 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">
                    Official Solar Equipment Warranty Certificate
                  </h3>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    Certificate #{data.certificateNumber}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-xs bg-white">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Equipment Category</span>
                    <span className="font-bold uppercase text-slate-900">{data.category || 'Equipment'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Serial Number</span>
                    <span className="font-mono font-bold text-slate-900">{data.serialNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Brand & Model</span>
                    <span className="font-semibold text-slate-900">{[data.brand, data.model].filter(Boolean).join(' ') || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Warranty Period</span>
                    <span className="font-bold text-emerald-700">{data.durationYears || 5} Years Full Coverage</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Commencement Date</span>
                    <span className="font-mono text-slate-900">{new Date(data.startDate || Date.now()).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Valid Until</span>
                    <span className="font-mono font-bold text-amber-800">{new Date(data.expiryDate || Date.now()).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed px-5 pb-5 bg-white">
                  {data.coverageDetails || 'Manufacturer-backed comprehensive warranty covering component defects and rated power performance as per MNRE standards. In-warranty service is provided at ₹0 customer payable when the serial remains active in the SunPower registry.'}
                </p>
              </div>
            )}

            {['survey', 'installation', 'service', 'subsidy'].includes(documentType) && (
              <div className="mb-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider">Technical Observations & Verification Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">System Capacity</span>
                      <span className="font-bold font-mono">{data.systemCapacityKw || data.capacityKw || 3} kW</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Status</span>
                      <span className="font-bold font-mono uppercase text-emerald-700">{data.status || 'VERIFIED'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lead Engineer / Technician</span>
                      <span className="font-semibold">{data.surveyor?.name || data.leadTechnician?.name || data.assignedTechnician?.name || 'Authorized Engineer'}</span>
                    </div>
                  </div>

                  {data.surveyorNotes && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Survey Findings</span>
                      <p className="text-slate-700 mt-0.5">{data.surveyorNotes}</p>
                    </div>
                  )}

                  {data.testingResults && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                      <div><span className="text-[10px] text-slate-400 block">Voc (Volts)</span>{data.testingResults.vocVolts} V</div>
                      <div><span className="text-[10px] text-slate-400 block">Isc (Amps)</span>{data.testingResults.iscAmperes} A</div>
                      <div><span className="text-[10px] text-slate-400 block">Earthing (Ω)</span>{data.testingResults.earthingResistanceOhms} Ω</div>
                      <div><span className="text-[10px] text-slate-400 block">Grid Inverter Sync</span>{data.testingResults.inverterSyncStatus}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-6 mt-8">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="pt-8 border-t border-slate-400">
                  <p className="font-bold text-slate-900">{customer.name || 'Customer'}</p>
                  <p className="text-[10px] text-slate-500">Customer Signature & Acceptance</p>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <p className="font-bold text-slate-900">{company.name}</p>
                  <p className="text-[10px] text-slate-500">Authorized Signatory / QA Engineer</p>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100">
              This document is an official electronically generated record from SunPower Solutions Enterprise Solar Management Architecture.
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrintDocumentModal;
