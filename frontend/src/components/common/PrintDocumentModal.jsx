import React, { useEffect } from 'react';
import { Printer, X, Sun, CheckCircle2, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

export const PrintDocumentModal = ({
  isOpen,
  onClose,
  documentType = 'quotation', // 'quotation' | 'invoice' | 'receipt' | 'survey' | 'installation' | 'warranty' | 'service' | 'subsidy'
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
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-active');
    }, 500);
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

  const customer = data.customer || {};
  const isDemo = Boolean(data.isDemo || data.paymentMethod?.startsWith('demo_'));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-solar-400" />
            <span className="text-sm font-bold text-white">
              Official Document Print Preview: <span className="text-solar-400 font-mono">{title || data.quotationNumber || data.receiptNumber || data.orderNumber || data.certificateNumber || 'Document'}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print / Save as PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<X className="w-4 h-4" />}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-900/50 flex justify-center">
          <div
            id="printable-document"
            className="printable-document-container bg-white text-slate-900 w-full max-w-3xl p-8 sm:p-10 shadow-lg rounded-xl border border-slate-200 text-xs sm:text-sm font-sans"
          >
            {/* Demo Watermark Banner */}
            {isDemo && (
              <div className="mb-4 p-2.5 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 text-amber-900 text-center font-bold uppercase tracking-wider text-xs">
                ⚠️ DEMO PAYMENT RECEIPT — NOT A REAL BANK TRANSACTION — FOR SYSTEM DEMONSTRATION ONLY
              </div>
            )}

            {/* Document Header */}
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

              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
                  {documentType.toUpperCase()}
                </span>
                <p className="font-mono font-black text-base text-slate-900 mt-1">
                  #{data.quotationNumber || data.receiptNumber || data.orderNumber || data.certificateNumber || data.surveyNumber || data.ticketNumber || 'DOC-2026-001'}
                </p>
                <p className="text-[11px] text-slate-600">
                  Date: <span className="font-semibold">{new Date(data.createdAt || data.paidAt || data.scheduledDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>
            </div>

            {/* Customer & Company Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Billed / Issued To</p>
                <p className="font-bold text-slate-900 text-sm">{customer.name || data.customerName || 'Valued Solar Client'}</p>
                <p className="text-slate-600 text-xs">Customer Code: <span className="font-mono font-semibold">{customer.customerCode || 'CUST-REG'}</span></p>
                <p className="text-slate-600 text-xs">Phone: {customer.phone || data.phone || 'N/A'}</p>
                <p className="text-slate-600 text-xs">Email: {customer.email || data.email || 'N/A'}</p>
                <p className="text-slate-600 text-xs mt-1">
                  Address: {customer.installationAddress?.street || data.address?.street || 'Site Rooftop Address'}, {customer.installationAddress?.city || data.address?.city || 'Ahmedabad'}, {customer.installationAddress?.state || 'Gujarat'} - {customer.installationAddress?.pincode || '380015'}
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

            {/* Document Specific Content Rendering */}

            {/* 1. QUOTATION */}
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
                        <td className="p-2.5 text-right font-mono">₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">₹{Number(item.totalPrice || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="flex justify-end mb-6">
                  <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Equipment Subtotal:</span>
                      <span className="font-mono">₹{Number(data.pricing?.equipmentTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Installation & Commissioning:</span>
                      <span className="font-mono">₹{Number(data.pricing?.installationLabour || data.pricing?.laborCost || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Transport & Discom Liaison:</span>
                      <span className="font-mono">₹{Number(data.pricing?.transportAndLiaison || 5000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900">
                      <span>Gross EPC Total:</span>
                      <span className="font-mono">₹{Number(data.pricing?.grossTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {data.pricing?.estimatedSubsidy > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>PM Surya Ghar Subsidy:</span>
                        <span className="font-mono">-₹{Number(data.pricing.estimatedSubsidy).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-sm text-slate-900">
                      <span>Net Payable Amount:</span>
                      <span className="font-mono text-base text-solar-600">₹{Number(data.pricing?.netPayable || data.pricing?.grossTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PAYMENT RECEIPT */}
            {documentType === 'receipt' && (
              <div className="mb-6">
                <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/60 text-slate-900 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950">Payment Confirmed & Verified</h4>
                      <p className="text-xs text-emerald-800">
                        Transaction Reference: <span className="font-mono font-bold">{data.transactionReference}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-emerald-200 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Mode</span>
                      <span className="font-bold uppercase font-mono">{String(data.paymentMethod || 'UPI').replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Stage</span>
                      <span className="font-bold capitalize">{data.paymentType || 'Milestone'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Payment Status</span>
                      <span className="font-bold text-emerald-700 uppercase font-mono">{data.status || 'COMPLETED'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Amount Paid</span>
                      <span className="font-bold font-mono text-base text-emerald-700">₹{Number(data.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {data.order && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 mb-4">
                    <h4 className="font-bold text-slate-900 mb-1">Linked Order Financial Snapshot</h4>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Number:</span>
                      <span className="font-mono font-bold">{data.order.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Project Value:</span>
                      <span className="font-mono">₹{Number(data.order.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Amount Received to Date:</span>
                      <span className="font-mono text-emerald-700 font-bold">₹{Number(data.order.advancePaid || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="text-slate-900 font-bold">Remaining Outstanding Balance:</span>
                      <span className="font-mono font-black text-rose-600">₹{Number(data.order.balanceAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. WARRANTY CERTIFICATE */}
            {documentType === 'warranty' && (
              <div className="mb-6 border-2 border-amber-400 p-6 rounded-2xl bg-amber-50/30">
                <div className="text-center mb-6">
                  <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Official Solar Equipment Warranty Certificate</h3>
                  <p className="text-xs text-slate-600 font-mono">Certificate #{data.certificateNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-amber-200 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Equipment Category</span>
                    <span className="font-bold uppercase text-slate-800">{data.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Serial Number</span>
                    <span className="font-mono font-bold text-slate-900">{data.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Brand & Model</span>
                    <span className="font-semibold text-slate-800">{data.brand} {data.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Warranty Period</span>
                    <span className="font-bold text-emerald-700">{data.durationYears} Years Full Coverage</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Commencement Date</span>
                    <span className="font-mono">{new Date(data.startDate || Date.now()).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Valid Until</span>
                    <span className="font-mono font-bold text-amber-800">{new Date(data.expiryDate || Date.now()).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {data.coverageDetails || 'This certificate warrants that the equipment listed above is free from manufacturing defects and guarantees linear power performance output according to standard MNRE standards.'}
                </p>
              </div>
            )}

            {/* 4. SITE SURVEY / INSTALLATION / SERVICE REPORT */}
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

            {/* Terms and Formal Signatures */}
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
    </div>
  );
};

export default PrintDocumentModal;
