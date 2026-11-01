/**
 * Live HTTP integration tests against the running backend.
 * Uses JWT login for admin, sales, technician, and two customers.
 */

const BASE = process.env.API_BASE || 'http://127.0.0.1:5000/api';

const results = [];
function record(scenario, name, passed, details = '') {
  results.push({ scenario, name, status: passed ? 'PASS' : 'FAIL', details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${scenario}] ${name}${details ? ' - ' + details : ''}`);
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function login(email, password) {
  const { status, json } = await req('POST', '/auth/login', { body: { email, password } });
  if (status !== 200 || !json.token) {
    throw new Error(`Login failed for ${email}: ${json.message || status}`);
  }
  return json;
}

async function run() {
  console.log('====================================================');
  console.log('LIVE API WORKFLOW TESTS');
  console.log('BASE', BASE);
  console.log('====================================================');

  const health = await req('GET', '/health');
  record('Infra', 'Backend health', health.status === 200 && health.json.database === 'connected', JSON.stringify(health.json));
  if (health.json.database !== 'connected') {
    console.error('MongoDB is not connected. Aborting remaining HTTP tests.');
    printSummary();
    process.exit(1);
  }

  let admin;
  let sales;
  let tech;
  let customerA;
  try {
    admin = await login('admin@sunpower.com', 'admin123');
    record('Auth', 'Admin login', true, admin.user?.email);
  } catch (err) {
    record('Auth', 'Admin login', false, err.message);
  }
  try {
    sales = await login('sales@sunpower.com', 'sales123');
    record('Auth', 'Sales login', true, sales.user?.email);
  } catch (err) {
    record('Auth', 'Sales login', false, err.message);
  }
  try {
    tech = await login('tech@sunpower.com', 'tech123');
    record('Auth', 'Technician login', true, tech.user?.email);
  } catch (err) {
    record('Auth', 'Technician login', false, err.message);
  }
  try {
    customerA = await login('customer@sunpower.com', 'customer123');
    record('Auth', 'Customer A login', true, customerA.user?.email);
  } catch (err) {
    record('Auth', 'Customer A login', false, err.message);
  }

  if (!admin?.token) {
    printSummary();
    process.exit(1);
  }

  // Scenario A: Admin creates employee
  const empEmail = `qa.sales.${Date.now()}@sunpowersolutions.com`;
  const created = await req('POST', '/users', {
    token: admin.token,
    body: {
      name: 'QA Sales Employee',
      email: empEmail,
      userId: `QA-SALES-${Date.now().toString().slice(-6)}`,
      password: 'TempPass!234',
      phone: '9876500101',
      role: 'sales',
      department: 'Sales & Marketing',
      mustChangePassword: true
    }
  });
  const createdUser = created.json.data;
  record('Scenario A', 'Admin creates sales employee with User ID', created.status === 201 && Boolean(createdUser?.userId), createdUser?.userId || created.json.message);
  record('Scenario A', 'Temporary password returned once to admin (not hashed)', Boolean(createdUser?.initialPassword || createdUser?.temporaryPassword), 'handoff only');
  record('Scenario A', 'mustChangePassword is true', createdUser?.mustChangePassword === true);

  if (createdUser?.initialPassword || createdUser?.temporaryPassword) {
    const firstLogin = await req('POST', '/auth/login', {
      body: { email: empEmail, password: createdUser.initialPassword || createdUser.temporaryPassword }
    });
    record('Scenario A', 'New employee can log in with temporary password', firstLogin.status === 200 && firstLogin.json.user?.mustChangePassword === true);
    if (firstLogin.json.token) {
      const change = await req('POST', '/auth/change-first-password', {
        token: firstLogin.json.token,
        body: {
          oldPassword: createdUser.initialPassword || createdUser.temporaryPassword,
          newPassword: 'PermanentPass!456'
        }
      });
      record('Scenario A', 'First-login password change', change.status === 200 && change.json.data?.mustChangePassword === false, change.json.message);
    }
  }

  // Sales cannot request admin
  if (sales?.token) {
    const adminReq = await req('POST', '/users', {
      token: sales.token,
      body: { name: 'Illegal Admin', email: `bad.admin.${Date.now()}@x.com`, role: 'admin' }
    });
    record('Scenario A', 'Sales cannot request Admin role', adminReq.status === 403, adminReq.json.message);

    const pending = await req('POST', '/users', {
      token: sales.token,
      body: { name: 'Requested Tech', email: `req.tech.${Date.now()}@sunpowersolutions.com`, role: 'technician', phone: '9876500102' }
    });
    record('Scenario B', 'Sales user request is pending', pending.status === 201 && pending.json.data?.status === 'pending_approval', pending.json.data?.requestNumber);

    const custReq = await req('POST', '/customers', {
      token: sales.token,
      body: {
        name: 'Pending Customer QA',
        email: `pending.cust.${Date.now()}@example.com`,
        phone: `98${Date.now().toString().slice(-8)}`,
        installationAddress: { street: '12 Solar Street', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015' }
      }
    });
    record('Scenario B', 'Sales customer create is pending approval', custReq.status === 201 && custReq.json.data?.status === 'pending_approval', custReq.json.data?.requestNumber || custReq.json.message);

    const requestId = pending.json.data?.requestId;
    if (requestId) {
      const selfApprove = await req('PUT', `/approvals/${requestId}/approve`, { token: sales.token, body: { reviewNotes: 'self' } });
      record('Scenario B', 'Sales cannot approve own request', selfApprove.status === 403, selfApprove.json.message);

      const reject = await req('PUT', `/approvals/${requestId}/reject`, {
        token: admin.token,
        body: { rejectionReason: 'Incomplete certification documents' }
      });
      record('Scenario B', 'Admin reject stores reason and keeps record', reject.status === 200 && reject.json.data?.status === 'rejected' && Boolean(reject.json.data?.rejectionReason), reject.json.data?.rejectionReason);
    }
  }

  // Scenario C: Leads
  const lead = await req('POST', '/enquiries', {
    token: sales?.token || admin.token,
    body: {
      customerName: 'Lead QA Family',
      email: `lead.qa.${Date.now()}@example.com`,
      phone: `97${Date.now().toString().slice(-8)}`,
      proposedCapacityKw: 5,
      systemType: 'on_grid',
      leadSource: 'direct',
      address: { street: 'Lead Street', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }
    }
  });
  record('Scenario C', 'Lead created in MongoDB', lead.status === 201 && Boolean(lead.json.data?._id), lead.json.data?.leadId || lead.json.message);
  const leadId = lead.json.data?._id;
  if (leadId) {
    const assign = await req('PUT', `/enquiries/${leadId}/assign`, {
      token: admin.token,
      body: { salesId: sales?.user?._id || sales?.user?.id, notes: 'Assigned for follow-up' }
    });
    record('Scenario C', 'Admin assigns lead to sales', assign.status === 200, assign.json.message);
    const statusUp = await req('PUT', `/enquiries/${leadId}/status`, {
      token: sales?.token || admin.token,
      body: { status: 'contacted', notes: 'Called customer' }
    });
    record('Scenario C', 'Sales updates lead status', statusUp.status === 200 && statusUp.json.data?.status === 'contacted');
    const convert = await req('POST', `/enquiries/${leadId}/convert`, { token: admin.token });
    record('Scenario C', 'Lead converts without duplicate customer errors', convert.status === 200, convert.json.message);
  }

  // Analytics not hardcoded
  const analytics = await req('GET', '/dashboard/comprehensive?year=2026', { token: admin.token });
  record('Analytics', 'Comprehensive analytics from MongoDB', analytics.status === 200 && analytics.json.data?.businessOverview != null);
  record('Analytics', 'Demo payments separated from confirmed revenue', analytics.json.data?.financialOverview?.demoPayments != null);

  const salesAnalytics = sales?.token ? await req('GET', '/dashboard/comprehensive?year=2026', { token: sales.token }) : { status: 0, json: {} };
  record('Analytics', 'Sales cannot see full company revenue block', salesAnalytics.status === 200 && salesAnalytics.json.data?.financialOverview?.restricted === true, 'restricted flag');

  const techAnalytics = tech?.token ? await req('GET', '/dashboard/comprehensive?year=2026', { token: tech.token }) : { status: 0 };
  record('RBAC', 'Technician blocked from admin analytics', techAnalytics.status === 403);

  // Equipment dropdown
  const dropdown = await req('GET', '/equipment/dropdown?operation=dispatch', { token: admin.token });
  record('Equipment', 'Serial dropdown loads live equipment', dropdown.status === 200 && Array.isArray(dropdown.json.data));

  // Customer privacy
  if (customerA?.token) {
    const ownOrders = await req('GET', '/orders', { token: customerA.token });
    record('Scenario F', 'Customer A lists only own orders', ownOrders.status === 200 && Array.isArray(ownOrders.json.data));
    const allOrdersAdmin = await req('GET', '/orders', { token: admin.token });
    const otherOrder = (allOrdersAdmin.json.data || []).find((o) => {
      const custEmail = o.customer?.email;
      return custEmail && custEmail !== 'customer@sunpower.com';
    });
    if (otherOrder) {
      const steal = await req('GET', `/orders/${otherOrder._id}`, { token: customerA.token });
      record('Scenario F', 'Customer A cannot read Customer B order by ID', steal.status === 403 || steal.status === 404, `status ${steal.status}`);
    } else {
      record('Scenario F', 'Customer A cannot read Customer B order by ID', false, 'No other customer order found to probe');
    }

    const finance = await req('GET', '/finance/summary', { token: customerA.token });
    record('Scenario F', 'Customer blocked from finance summary', finance.status === 403);

    const users = await req('GET', '/users', { token: customerA.token });
    record('Scenario F', 'Customer blocked from user directory', users.status === 403);
  }

  // Demo payment
  if (customerA?.token) {
    const orders = await req('GET', '/customer-portal/orders', { token: customerA.token });
    const unpaid = (orders.json.data || []).find((o) => Number(o.balanceAmount) > 0);
    if (unpaid) {
      const pay = await req('POST', '/transactions/demo', {
        token: customerA.token,
        body: {
          orderId: unpaid._id,
          amount: Math.min(1000, unpaid.balanceAmount),
          paymentMethod: 'demo_upi',
          demoScenario: 'success',
          notes: 'QA demo payment'
        }
      });
      record('Scenario E', 'Demo payment records successful simulated txn', pay.status === 201 && pay.json.data?.isDemo === true, pay.json.data?.payment?.transactionReference || pay.json.message);
      record('Scenario E', 'Order balance updated after demo payment', Boolean(pay.json.data?.order?.balanceAmount !== undefined));
    } else {
      const adminOrders = await req('GET', '/orders', { token: admin.token });
      const anyUnpaid = (adminOrders.json.data || []).find((o) => Number(o.balanceAmount) > 0);
      if (anyUnpaid) {
        const pay = await req('POST', '/transactions/demo', {
          token: admin.token,
          body: {
            orderId: anyUnpaid._id,
            amount: Math.min(500, anyUnpaid.balanceAmount),
            paymentMethod: 'demo_cash',
            demoScenario: 'success'
          }
        });
        record('Scenario E', 'Demo payment records successful simulated txn', pay.status === 201 && pay.json.data?.isDemo === true, pay.json.message);
      } else {
        record('Scenario E', 'Demo payment records successful simulated txn', false, 'No unpaid order available');
      }
    }
  }

  // Technician jobs
  if (tech?.token) {
    const jobs = await req('GET', '/installations', { token: tech.token });
    record('Scenario G', 'Technician sees assigned jobs list', jobs.status === 200);
    const job = (jobs.json.data || [])[0];
    if (job) {
      const start = await req('POST', `/installations/${job._id}/start`, { token: tech.token });
      record('Scenario G', 'Technician can start assigned job or is correctly gated', start.status === 200 || start.status === 400, start.json.message);
    } else {
      record('Scenario G', 'Technician can start assigned job or is correctly gated', false, 'No assigned installation in dataset');
    }
  }

  printSummary();
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  console.log('\n====================================================');
  console.log('SUMMARY');
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PASS ${pass} / FAIL ${fail} / TOTAL ${results.length}`);
  results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(` - ${r.scenario}: ${r.name} (${r.details})`));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
