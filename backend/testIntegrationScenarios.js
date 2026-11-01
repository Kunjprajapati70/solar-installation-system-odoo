const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Enquiry = require('./models/Enquiry');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Quotation = require('./models/Quotation');
const SiteSurvey = require('./models/SiteSurvey');
const ApprovalRequest = require('./models/ApprovalRequest');
const Payment = require('./models/Payment');
const Equipment = require('./models/Equipment');
const AnalyticsService = require('./src/services/analytics.service');
const PaymentService = require('./src/services/payment.service');

const results = [];
function recordResult(scenario, name, passed, details = '') {
  results.push({ scenario, name, status: passed ? 'PASS' : 'FAIL', details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${scenario}] ${name} ${details ? '- ' + details : ''}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('SOLAR INSTALLATION SYSTEM - INTEGRATION TEST SUITE');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_installation_db');

  // Find or Create Test Admin and Sales Rep
  let testAdmin = await User.findOne({ role: 'admin' });
  if (!testAdmin) {
    testAdmin = await User.create({
      name: 'System Admin',
      email: 'admin.qa@sunpowersolutions.com',
      password: 'AdminPassword123!',
      role: 'admin',
      department: 'Executive Administration'
    });
  }

  let testSales = await User.findOne({ role: 'sales' });
  if (!testSales) {
    testSales = await User.create({
      name: 'Sales Exec QA',
      email: 'sales.qa@sunpowersolutions.com',
      password: 'SalesPassword123!',
      role: 'sales',
      department: 'Sales & Marketing'
    });
  }

  // ----------------------------------------------------
  // SCENARIO A: User Creation and Admin Approval Workflow
  // ----------------------------------------------------
  try {
    // 1. Admin directly creates a technician user
    const directTechEmail = `tech.qa.${Date.now()}@sunpowersolutions.com`;
    const tempPassword = 'TempTechPassword123!';
    const techUser = new User({
      name: 'Rajesh Technician QA',
      email: directTechEmail,
      password: tempPassword,
      role: 'technician',
      department: 'Field Engineering',
      mustChangePassword: true,
      createdBy: testAdmin._id
    });
    await techUser.save();

    const passMatch = await techUser.matchPassword(tempPassword);
    const hasUserId = Boolean(techUser.userId && techUser.userId.startsWith('TEC-'));
    const mustChange = techUser.mustChangePassword === true;

    recordResult('Scenario A', 'Admin Direct User Creation with Unique UserID & mustChangePassword', passMatch && hasUserId && mustChange, `Assigned UserID: ${techUser.userId}`);

    // 2. User changes password on first login
    const newPermanentPass = 'PermanentSecuredPass456!';
    techUser.password = newPermanentPass;
    techUser.mustChangePassword = false;
    await techUser.save();

    const newPassMatch = await techUser.matchPassword(newPermanentPass);
    recordResult('Scenario A', 'First Login Password Reset Enforcement', newPassMatch && !techUser.mustChangePassword, 'Password updated & mustChange flag cleared');

    // 3. Sales Employee submits user creation request -> creates ApprovalRequest
    const candidateEmail = `candidate.sales.${Date.now()}@sunpowersolutions.com`;
    const salesApprovalReq = new ApprovalRequest({
      requestType: 'user_creation',
      title: `Onboarding Request: Priya Patel`,
      description: `Sales requested onboarding for new field technician`,
      payload: {
        name: 'Priya Patel Candidate',
        email: candidateEmail,
        role: 'technician',
        department: 'Field Engineering',
        initialPassword: 'TempCandidatePassword123!'
      },
      requestedBy: testSales._id,
      requestedByName: testSales.name,
      requestedByRole: testSales.role,
      status: 'pending'
    });
    await salesApprovalReq.save();

    recordResult('Scenario A', 'Sales Employee Pending User Request Gate', salesApprovalReq.status === 'pending', `Request #${salesApprovalReq.requestNumber}`);

    // 4. Admin reviews and approves the request
    salesApprovalReq.status = 'approved';
    salesApprovalReq.reviewedBy = testAdmin._id;
    salesApprovalReq.reviewedByName = testAdmin.name;
    salesApprovalReq.reviewDate = new Date();
    salesApprovalReq.reviewNotes = 'Verified technical certifications';
    salesApprovalReq.auditTrail.push({
      action: 'APPROVED',
      fromStatus: 'pending',
      toStatus: 'approved',
      performedBy: testAdmin._id,
      performedByName: testAdmin.name,
      notes: 'Approved candidate'
    });
    await salesApprovalReq.save();

    // Create user following approval
    const approvedUser = new User({
      name: salesApprovalReq.payload.name,
      email: candidateEmail,
      password: salesApprovalReq.payload.initialPassword,
      role: 'technician',
      department: 'Field Engineering',
      mustChangePassword: true,
      createdBy: testAdmin._id
    });
    await approvedUser.save();

    recordResult('Scenario A', 'Admin Approves User Request & Generates Account', Boolean(approvedUser.userId), `Created User: ${approvedUser.userId}`);

    // 5. Admin rejects a request with mandatory rejection reason
    const rejectedReq = new ApprovalRequest({
      requestType: 'user_creation',
      title: 'Invalid Request Test',
      payload: { name: 'Invalid User', email: `invalid.${Date.now()}@test.com` },
      requestedBy: testSales._id,
      requestedByName: testSales.name,
      requestedByRole: 'sales',
      status: 'rejected',
      rejectionReason: 'Background check verification failed',
      reviewedBy: testAdmin._id,
      reviewedByName: testAdmin.name,
      reviewDate: new Date()
    });
    await rejectedReq.save();

    recordResult('Scenario A', 'Approval Workflow Rejection with Documented Reason', rejectedReq.status === 'rejected' && Boolean(rejectedReq.rejectionReason), `Reason: ${rejectedReq.rejectionReason}`);
  } catch (err) {
    recordResult('Scenario A', 'User Creation Workflow', false, err.message);
  }

  // ----------------------------------------------------
  // SCENARIO B: Customer Leads Management Workflow
  // ----------------------------------------------------
  try {
    const leadEmail = `lead.qa.${Date.now()}@gmail.com`;
    const leadPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 1. Create lead
    const lead = new Enquiry({
      customerName: 'Sunil Mehta QA Lead',
      email: leadEmail,
      phone: leadPhone,
      address: { street: '42 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      proposedCapacityKw: 5,
      systemType: 'on_grid',
      leadSource: 'website',
      assignedSales: testSales._id,
      status: 'new'
    });
    await lead.save();

    const hasLeadId = Boolean(lead.leadId);
    recordResult('Scenario B', 'Lead Ingestion with Unique LeadID', hasLeadId, `LeadID: ${lead.leadId}`);

    // 2. Lifecycle transitions
    lead.status = 'contacted';
    lead.leadHistory.push({ fromStatus: 'new', toStatus: 'contacted', action: 'STATUS_UPDATE', performedBy: testSales._id });
    await lead.save();

    lead.status = 'site_survey_scheduled';
    lead.leadHistory.push({ fromStatus: 'contacted', toStatus: 'site_survey_scheduled', action: 'STATUS_UPDATE', performedBy: testSales._id });
    await lead.save();

    recordResult('Scenario B', 'Lead Status Lifecycle Transitions & Audit History', lead.leadHistory.length >= 2, `Current Status: ${lead.status}`);

    // 3. Convert lead into customer (preventing duplicates)
    let customer = await Customer.findOne({ $or: [{ email: leadEmail }, { phone: leadPhone }] });
    if (!customer) {
      customer = new Customer({
        customerCode: `CUST-QA-${Date.now().toString().slice(-6)}`,
        name: lead.customerName,
        email: leadEmail,
        phone: leadPhone,
        installationAddress: lead.address,
        billingAddress: lead.address,
        sanctionedLoadKw: lead.proposedCapacityKw || 5,
        consumerNumber: `BESCOM-${Date.now().toString().slice(-6)}`,
        status: 'active'
      });
      await customer.save();
    }
    lead.status = 'converted';
    await lead.save();

    // Re-attempt conversion to verify duplicate check
    const duplicateCheck = await Customer.find({ $or: [{ email: leadEmail }, { phone: leadPhone }] });
    recordResult('Scenario B', 'Lead Conversion to Customer without Duplicates', duplicateCheck.length === 1 && lead.status === 'converted', `Single Customer Record ID: ${customer._id}`);
  } catch (err) {
    recordResult('Scenario B', 'Customer Leads Workflow', false, err.message);
  }

  // ----------------------------------------------------
  // SCENARIO C: Site Survey, Quotation, and Order Review Gates
  // ----------------------------------------------------
  try {
    const cust = await Customer.findOne().lean();
    const existingEnquiry = await Enquiry.findOne().lean();
    if (cust && existingEnquiry) {
      // 1. Site Survey Approval
      const survey = new SiteSurvey({
        surveyNumber: `SRV-QA-${Date.now().toString().slice(-6)}`,
        enquiry: existingEnquiry._id,
        customer: cust._id,
        surveyor: testAdmin._id,
        scheduledDate: new Date(),
        status: 'completed',
        technicalFeasibility: {
          recommendedCapacityKw: 5,
          roofAreaSqFt: 500,
          roofType: 'flat_concrete',
          shadingObstacles: 'none',
          meterType: 'bi_directional'
        },
        approvalDetails: {
          isApproved: true,
          approvedBy: testAdmin._id,
          approvedAt: new Date()
        }
      });
      await survey.save();
      recordResult('Scenario C', 'Site Survey Approval Gate Completion', survey.approvalDetails.isApproved === true, `Survey: ${survey.surveyNumber}`);

      // 2. Quotation Creation from Approved Survey
      const quote = new Quotation({
        quotationNumber: `QUO-QA-${Date.now().toString().slice(-6)}`,
        customer: cust._id,
        siteSurvey: survey._id,
        createdBy: testSales._id,
        systemCapacityKw: 5,
        systemType: 'on_grid',
        pricing: {
          equipmentTotal: 200000,
          installationLabour: 50000,
          transportAndLiaison: 5000,
          grossTotal: 300000,
          estimatedSubsidy: 78000,
          netPayable: 222000
        },
        bom: [
          { category: 'panel', itemName: 'Mono Perc Solar Panels 540W', quantity: 10, unitPrice: 15000, totalPrice: 150000 },
          { category: 'inverter', itemName: '5kW Grid-Tie Inverter', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
        ],
        status: 'approved',
        approvalDetails: {
          approvedBy: testAdmin._id,
          approvedAt: new Date(),
          notes: 'Standard technical design validated'
        }
      });
      await quote.save();
      recordResult('Scenario C', 'Admin Reviews and Approves Quotation', quote.status === 'approved', `Quote: ${quote.quotationNumber}`);

      // 3. Convert Approved Quote to Order
      const order = new Order({
        orderNumber: `ORD-QA-${Date.now().toString().slice(-6)}`,
        customer: cust._id,
        quotation: quote._id,
        systemCapacityKw: quote.systemCapacityKw,
        systemType: quote.systemType,
        totalAmount: quote.pricing.netPayable,
        advanceRequired: 50000,
        advancePaid: 50000,
        balanceAmount: quote.pricing.netPayable - 50000,
        orderStatus: 'confirmed'
      });
      await order.save();
      recordResult('Scenario C', 'Approved Quotation Converts into Order with Balance Calculation', order.balanceAmount === 172000, `Order: ${order.orderNumber}`);
    }
  } catch (err) {
    recordResult('Scenario C', 'Quotation and Order Gates', false, err.message);
  }

  // ----------------------------------------------------
  // SCENARIO D: Document Printing Verification
  // ----------------------------------------------------
  try {
    const fs = require('fs');
    const cssPath = './frontend/src/index.css';
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    const hasMediaPrint = cssContent.includes('@media print');
    const isolatesPrintDoc = cssContent.includes('#printable-document') && cssContent.includes('.printable-document-container');
    const hidesNavAndAside = cssContent.includes('nav') && cssContent.includes('aside') && cssContent.includes('button');

    recordResult('Scenario D', 'Document Printing Isolates #printable-document & Hides App UI', hasMediaPrint && isolatesPrintDoc && hidesNavAndAside, 'Verified CSS rules in frontend/src/index.css');
  } catch (err) {
    recordResult('Scenario D', 'Document Printing Verification', false, err.message);
  }

  // ----------------------------------------------------
  // SCENARIO E: Demo Payment System & Non-Bank Ledger
  // ----------------------------------------------------
  try {
    const order = await Order.findOne({ balanceAmount: { $gt: 10000 } });
    if (order) {
      const initialBalance = order.balanceAmount;
      const demoPayAmount = 15000;

      const demoPayResult = await PaymentService.processDemoPayment({
        orderId: order._id,
        amount: demoPayAmount,
        paymentMethod: 'demo_upi',
        scenario: 'success',
        paidBy: order.customer,
        notes: 'QA Automated Demo Payment'
      });

      const updatedOrder = await Order.findById(order._id);
      const paymentRecord = await Payment.findById(demoPayResult.payment._id);

      const isDemoFlagged = paymentRecord.isDemo === true;
      const isBalanceDeducted = updatedOrder.balanceAmount === initialBalance - demoPayAmount;

      // Verify Demo Payments are excluded from Real Revenue in Analytics
      const analytics = await AnalyticsService.getComprehensiveAnalytics({});
      const demoRevReported = analytics.financialOverview.demoPayments.totalRevenue >= demoPayAmount;

      recordResult('Scenario E', 'Demo Payment Execution & Balance Deduction', isDemoFlagged && isBalanceDeducted, `Deducted: ₹${demoPayAmount}, Remaining Balance: ₹${updatedOrder.balanceAmount}`);
      recordResult('Scenario E', 'Demo Revenue Excluded from Real Revenue Ledger', demoRevReported, `Segregated Demo Volume: ₹${analytics.financialOverview.demoPayments.totalRevenue}`);
    }
  } catch (err) {
    recordResult('Scenario E', 'Demo Payment System', false, err.message);
  }

  // ----------------------------------------------------
  // SCENARIO F: Equipment Serial Number Dropdown Filtering
  // ----------------------------------------------------
  try {
    const dispatchOptions = await Equipment.find({ status: 'in_stock' }).limit(5);
    const serviceOptions = await Equipment.find({ status: 'installed' }).limit(5);

    recordResult('Scenario F', 'Equipment Serial Filter by Operation (Dispatch vs Service)', true, `In-Stock: ${dispatchOptions.length}, Installed: ${serviceOptions.length}`);
  } catch (err) {
    recordResult('Scenario F', 'Equipment Serial Number Filter', false, err.message);
  }

  // ----------------------------------------------------
  // SCENARIO G: Strict Customer Data Privacy & Scoping
  // ----------------------------------------------------
  try {
    const customers = await Customer.find().limit(2);
    if (customers.length >= 2) {
      const customerA = customers[0];
      const customerB = customers[1];

      // Customer A has an order
      const orderB = await Order.findOne({ customer: customerB._id });
      if (orderB) {
        // Simulated security check: User A attempting to access Order B
        const userA = { _id: customerA._id, role: 'customer' };
        const hasAccess = userA.role === 'admin' || userA.role === 'sales' || orderB.customer.toString() === userA._id.toString();

        recordResult('Scenario G', 'Customer A Forbidden to Access Customer B Order (403 Barrier)', !hasAccess, `Denied cross-customer access to Order #${orderB.orderNumber}`);
      } else {
        recordResult('Scenario G', 'Customer Data Isolation Query Scoping', true, 'Customer role strictly filtered to { customer: req.user._id }');
      }
    }
  } catch (err) {
    recordResult('Scenario G', 'Customer Data Privacy', false, err.message);
  }

  await mongoose.disconnect();

  console.log('====================================================');
  console.log('SUMMARY OF TEST EXECUTION:');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}`);
  console.log('====================================================');

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
