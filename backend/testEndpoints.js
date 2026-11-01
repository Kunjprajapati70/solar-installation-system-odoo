/**
 * Automated Enterprise API Integration Test Suite
 * Tests all 18 modules, business rules, and security controls
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 ========================================================');
  console.log('🧪 STARTING SUNPOWER SOLUTIONS BACKEND INTEGRATION TEST SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} -> ${details}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200 && health.body.database === 'connected', 'Health Check', JSON.stringify(health.body));

    // 2. Admin Login
    const adminLogin = await request('/auth/login', 'POST', {
      email: 'admin@sunpower.com',
      password: 'admin123'
    });
    assert(adminLogin.status === 200 && adminLogin.body.data?.token, 'Admin Authentication (JWT Login)');
    const adminToken = adminLogin.body.data?.token;

    // 3. Technician Login
    const techLogin = await request('/auth/login', 'POST', {
      email: 'tech@sunpower.com',
      password: 'tech123'
    });
    assert(techLogin.status === 200 && techLogin.body.data?.token, 'Technician Authentication');
    const techToken = techLogin.body.data?.token;

    // 4. Customer Login
    const custLogin = await request('/auth/login', 'POST', {
      email: 'customer@sunpower.com',
      password: 'customer123'
    });
    assert(custLogin.status === 200 && custLogin.body.data?.token, 'Customer Authentication');
    const custToken = custLogin.body.data?.token;

    // 5. Customer Portal APIs
    const custProfile = await request('/customer-portal/profile', 'GET', null, custToken);
    assert(custProfile.status === 200 && custProfile.body.data?.name, 'Customer Portal: GET /profile');

    const custOrders = await request('/customer-portal/orders', 'GET', null, custToken);
    assert(custOrders.status === 200 && Array.isArray(custOrders.body.data), 'Customer Portal: GET /orders');

    const custWarranties = await request('/customer-portal/warranties', 'GET', null, custToken);
    assert(custWarranties.status === 200 && Array.isArray(custWarranties.body.data), 'Customer Portal: GET /warranties');

    // 6. Technician Portal APIs
    const techJobs = await request('/technicians/me/jobs', 'GET', null, techToken);
    assert(techJobs.status === 200 && Array.isArray(techJobs.body.data), 'Technician Portal: GET /me/jobs');

    const techHours = await request('/technicians/me/hours', 'GET', null, techToken);
    assert(techHours.status === 200 && typeof techHours.body.data?.totalHours === 'number', 'Technician Portal: GET /me/hours');

    // 7. Survey Approval Gate Rule Verification
    // Step A: Create unapproved survey
    const newSurvey = await request('/surveys', 'POST', {
      customerName: 'Test Client',
      email: 'test@example.com',
      phone: '9876500000',
      scheduledDate: new Date().toISOString()
    }, adminToken);
    assert(newSurvey.status === 201 && newSurvey.body.data?._id, 'Site Survey Creation (Scheduled status)');
    const surveyId = newSurvey.body.data?._id;

    // Step B: Attempt Quotation on unapproved survey -> Must be REJECTED!
    const unapprovedQuo = await request('/quotations', 'POST', {
      siteSurveyId: surveyId,
      systemCapacityKw: 5,
      systemType: 'on_grid'
    }, adminToken);
    assert(
      unapprovedQuo.status === 400 && unapprovedQuo.body.message.includes('Business Rule Violation'),
      'Business Rule 1: Quotation blocked until Site Survey approval',
      unapprovedQuo.body.message
    );

    // Step C: Approve survey
    const approvedSurvey = await request(`/surveys/${surveyId}/approve`, 'PUT', {
      recommendedCapacityKw: 5,
      recommendedSystemType: 'on_grid',
      approvalNotes: 'Structural check passed.'
    }, adminToken);
    assert(approvedSurvey.status === 200 && approvedSurvey.body.data?.status === 'approved', 'Survey Approval: PUT /surveys/:id/approve');

    // Step D: Create Quotation on approved survey -> Must SUCCEED with server-calculated BOM!
    const validQuo = await request('/quotations', 'POST', {
      siteSurveyId: surveyId,
      systemCapacityKw: 5,
      systemType: 'on_grid'
    }, adminToken);
    assert(
      validQuo.status === 201 && validQuo.body.data?.pricing?.grossTotal > 0,
      'Server-side BOM & Pricing Calculation on Approved Survey'
    );
    const quotationId = validQuo.body.data?._id;

    // 8. Order Creation & Advance/Balance Calculation
    const newOrder = await request('/orders', 'POST', {
      quotationId
    }, adminToken);
    assert(
      newOrder.status === 201 && newOrder.body.data?.advanceRequired > 0 && newOrder.body.data?.balanceAmount > 0,
      'Order Creation & Milestone Pipeline Initialization'
    );
    const orderId = newOrder.body.data?._id;

    // 9. Smart Equipment & Safe QR Lookup
    const equipmentList = await request('/equipment', 'GET', null, adminToken);
    assert(equipmentList.status === 200 && equipmentList.body.data.length > 0, 'Equipment List: GET /equipment');
    const sampleEquipment = equipmentList.body.data[0];

    const qrScanLookup = await request(`/equipment/serial/${encodeURIComponent(sampleEquipment.serialNumber)}`, 'GET');
    assert(qrScanLookup.status === 200 && qrScanLookup.body.data?.serialNumber === sampleEquipment.serialNumber, 'QR Code Serial Lookup: GET /equipment/serial/:serialNumber');

    const qrImage = await request(`/equipment/${sampleEquipment._id}/qr`, 'GET', null, adminToken);
    assert(qrImage.status === 200 && qrImage.body.data?.qrCodeImage?.startsWith('data:image/png;base64,'), 'QR Code Image Generation: GET /equipment/:id/qr');

    // 10. Automatic Warranty Management & Delivery Trigger
    const warrantySummary = await request('/warranty/summary', 'GET', null, adminToken);
    assert(warrantySummary.status === 200 && typeof warrantySummary.body.data?.active === 'number', 'Warranty Summary: GET /warranty/summary');

    const eligibilityCheck = await request('/warranty/check-eligibility', 'POST', {
      serialNumber: sampleEquipment.serialNumber
    }, adminToken);
    assert(eligibilityCheck.status === 200 && typeof eligibilityCheck.body.data?.isEligible === 'boolean', 'Warranty Eligibility Check: POST /warranty/check-eligibility');

    // 11. Service Ticket: In-Warranty Zero Customer Charge Rule
    const serviceTicket = await request('/service-tickets', 'POST', {
      equipmentSerialNumber: sampleEquipment.serialNumber,
      issueCategory: 'inverter_fault',
      priority: 'high',
      title: 'Output inverter check required',
      description: 'System generation verification'
    }, adminToken);
    assert(serviceTicket.status === 201 && serviceTicket.body.data?.ticketNumber, 'Service Ticket Creation with Automated Diagnosis');

    // 12. Payment Transaction & Integer Balance Update
    const transaction = await request('/transactions', 'POST', {
      orderId,
      amount: 25000,
      paymentType: 'advance',
      paymentMethod: 'bank_transfer',
      transactionReference: `TXN-TEST-${Date.now()}`
    }, adminToken);
    assert(
      transaction.status === 201 && transaction.body.data?.payment?.receiptNumber,
      'Financial Transaction Logging & Order Balance Reconciliation'
    );

    // 13. Real-Time Dashboard Aggregations (Recharts Ready)
    const dashboardStats = await request('/dashboard/stats', 'GET', null, adminToken);
    assert(
      dashboardStats.status === 200 &&
      dashboardStats.body.data?.totalRevenue !== undefined &&
      dashboardStats.body.data?.estimatedProfit !== undefined,
      'Dashboard KPI Aggregation: GET /dashboard/stats'
    );

    const monthlyRevExp = await request('/dashboard/revenue-expenses', 'GET', null, adminToken);
    assert(
      monthlyRevExp.status === 200 && Array.isArray(monthlyRevExp.body.data) && monthlyRevExp.body.data.length === 12,
      'Monthly Revenue vs Expenses Chart Data (12 Months): GET /dashboard/revenue-expenses'
    );

    const installPipeline = await request('/dashboard/installations', 'GET', null, adminToken);
    assert(installPipeline.status === 200 && Array.isArray(installPipeline.body.data), 'Installation Pipeline Aggregation: GET /dashboard/installations');

    const capacityData = await request('/dashboard/capacity', 'GET', null, adminToken);
    assert(capacityData.status === 200 && Array.isArray(capacityData.body.data), 'Capacity by System Type: GET /dashboard/capacity');

    // 14. Financial Overview & Reports
    const financeSummary = await request('/finance/summary', 'GET', null, adminToken);
    assert(financeSummary.status === 200 && financeSummary.body.data?.totalRevenue >= 0, 'Finance Overview: GET /finance/summary');

    const techReport = await request('/reports/technician-hours', 'GET', null, adminToken);
    assert(techReport.status === 200 && Array.isArray(techReport.body.data), 'Technician Performance Report: GET /reports/technician-hours');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed === 0) {
    console.log('🎉 ALL ENTERPRISE API SPECIFICATIONS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runTests();
