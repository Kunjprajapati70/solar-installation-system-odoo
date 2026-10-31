const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Installation = require('../models/Installation');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Equipment = require('../models/Equipment');
const ServiceTicket = require('../models/ServiceTicket');
const Warranty = require('../models/Warranty');
const User = require('../models/User');
const SiteSurvey = require('../models/SiteSurvey');
const Quotation = require('../models/Quotation');
const Enquiry = require('../models/Enquiry');
const { protect } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// Feature 4: Dynamic database-driven metrics and charts for business performance
router.get('/dashboard', protect, async (req, res) => {
  try {
    // 1. Core KPIs from active collections
    const [
      totalCustomers,
      totalOrders,
      installations,
      payments,
      expenses,
      inventoryItems,
      allServiceTickets,
      warranties,
      technicians,
      surveys,
      quotations,
      enquiries
    ] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Installation.find().lean(),
      Payment.find({ status: 'completed' }).lean(),
      Expense.find().lean(),
      Inventory.find().lean(),
      ServiceTicket.find().lean(),
      Warranty.find().lean(),
      User.find({ role: 'technician' }).lean(),
      SiteSurvey.find().lean(),
      Quotation.find().lean(),
      Enquiry.find().lean()
    ]);

    // Total Completed Installations and Installed Capacity
    const completedInstallations = installations.filter(i =>
      i.status === 'completed' || i.status === 'customer_accepted'
    );
    const totalInstalledCapacityKw = completedInstallations.reduce(
      (sum, i) => sum + (Number(i.systemCapacityKw) || 0),
      0
    );

    // Financial Metrics
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const estimatedProfit = totalRevenue - totalExpenses;

    // Pending Payments from Orders
    const allOrders = await Order.find().lean();
    const pendingPayments = allOrders.reduce((sum, o) => sum + (Number(o.balanceAmount) || 0), 0);

    // Low stock items (currentStock <= reorderLevel)
    const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.reorderLevel);

    // Technician hours and incomplete steps
    const technicianWorkingHours = installations.reduce(
      (sum, i) => sum + (Number(i.totalWorkingHours) || 0),
      0
    );

    let incompleteStepsCount = 0;
    installations.forEach(inst => {
      if (inst.steps && Array.isArray(inst.steps)) {
        incompleteStepsCount += inst.steps.filter(s => s.status !== 'completed').length;
      }
    });

    // Warranty Claims Count
    let totalWarrantyClaims = 0;
    warranties.forEach(w => {
      if (w.claimsHistory && Array.isArray(w.claimsHistory)) {
        totalWarrantyClaims += w.claimsHistory.length;
      }
    });

    // 2. Monthly Trend Data for Recharts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthlyFinancials = months.map((month, idx) => {
      const monthPayments = payments.filter(p => {
        const d = new Date(p.paidAt || p.createdAt);
        return d.getMonth() === idx && d.getFullYear() === currentYear;
      });
      const monthExpenses = expenses.filter(e => {
        const d = new Date(e.expenseDate || e.createdAt);
        return d.getMonth() === idx && d.getFullYear() === currentYear;
      });
      const monthInstalls = completedInstallations.filter(i => {
        const d = new Date(i.completedAt || i.createdAt);
        return d.getMonth() === idx && d.getFullYear() === currentYear;
      });

      const rev = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const exp = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const cap = monthInstalls.reduce((sum, i) => sum + (i.systemCapacityKw || 0), 0);

      return {
        month,
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
        installationsCount: monthInstalls.length,
        capacityKw: cap
      };
    });

    // 3. System Capacity Distribution (1kW to 5kW)
    const capacityBuckets = { '1 kW': 0, '2 kW': 0, '3 kW': 0, '4 kW': 0, '5 kW': 0, '5+ kW': 0 };
    installations.forEach(i => {
      const cap = Math.round(i.systemCapacityKw || 3);
      if (cap === 1) capacityBuckets['1 kW']++;
      else if (cap === 2) capacityBuckets['2 kW']++;
      else if (cap === 3) capacityBuckets['3 kW']++;
      else if (cap === 4) capacityBuckets['4 kW']++;
      else if (cap === 5) capacityBuckets['5 kW']++;
      else capacityBuckets['5+ kW']++;
    });

    const capacityDistribution = Object.keys(capacityBuckets).map(key => ({
      name: key,
      projects: capacityBuckets[key]
    }));

    // 4. Installation Status Distribution
    const statusCounts = {
      assigned: 0,
      in_progress: 0,
      testing_in_progress: 0,
      completed: 0,
      customer_accepted: 0
    };
    installations.forEach(i => {
      if (statusCounts[i.status] !== undefined) {
        statusCounts[i.status]++;
      }
    });

    const installationStatusData = [
      { name: 'Assigned', value: statusCounts.assigned, color: '#38bdf8' },
      { name: 'In Progress', value: statusCounts.in_progress, color: '#f59e0b' },
      { name: 'Testing', value: statusCounts.testing_in_progress, color: '#818cf8' },
      { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
      { name: 'Customer Accepted', value: statusCounts.customer_accepted, color: '#059669' }
    ];

    // 5. Inventory Stock Levels by Category
    const categoryStock = {};
    inventoryItems.forEach(item => {
      if (!categoryStock[item.category]) {
        categoryStock[item.category] = { currentStock: 0, reorderLevel: 0, availableStock: 0 };
      }
      categoryStock[item.category].currentStock += item.currentStock;
      categoryStock[item.category].reorderLevel += item.reorderLevel;
      categoryStock[item.category].availableStock += item.availableStock;
    });

    const inventoryStockChart = Object.keys(categoryStock).map(cat => ({
      category: cat.toUpperCase(),
      currentStock: categoryStock[cat].currentStock,
      availableStock: categoryStock[cat].availableStock,
      safetyThreshold: categoryStock[cat].reorderLevel
    }));

    // 6. Service Ticket Analysis by Status
    const openTicketsCount = allServiceTickets.filter(t =>
      ['open', 'technician_assigned', 'in_progress', 'parts_awaited'].includes(t.status)
    ).length;

    const serviceTicketStatusChart = [
      { status: 'Open', count: allServiceTickets.filter(t => t.status === 'open').length, fill: '#38bdf8' },
      { status: 'Assigned', count: allServiceTickets.filter(t => t.status === 'technician_assigned').length, fill: '#818cf8' },
      { status: 'In Progress', count: allServiceTickets.filter(t => t.status === 'in_progress').length, fill: '#f59e0b' },
      { status: 'Parts Awaited', count: allServiceTickets.filter(t => t.status === 'parts_awaited').length, fill: '#ec4899' },
      { status: 'Resolved', count: allServiceTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length, fill: '#10b981' }
    ];

    // 7. Project Pipeline Stages (Pending, Survey, Approved, In Progress, Completed)
    const pipelineStageCounts = [
      { name: 'Pending', count: enquiries.filter(e => e.status === 'new' || e.status === 'contacted').length, color: '#94a3b8' },
      { name: 'Survey', count: surveys.filter(s => ['pending', 'scheduled', 'surveyor_assigned'].includes(s.status)).length, color: '#38bdf8' },
      { name: 'Approved', count: quotations.filter(q => q.status === 'approved').length, color: '#a855f7' },
      { name: 'In Progress', count: installations.filter(i => ['assigned', 'in_progress', 'testing_in_progress'].includes(i.status)).length, color: '#f59e0b' },
      { name: 'Completed', count: completedInstallations.length, color: '#10b981' }
    ];

    // 8. Technician Performance Leaderboard
    const technicianStats = await Promise.all(
      technicians.map(async (tech) => {
        const techInstalls = installations.filter(i =>
          i.leadTechnician?.toString() === tech._id.toString() ||
          i.leadTechnician?._id?.toString() === tech._id.toString()
        );
        const completed = techInstalls.filter(i => i.status === 'completed' || i.status === 'customer_accepted').length;
        const totalHours = techInstalls.reduce((sum, i) => sum + (i.totalWorkingHours || 0), 0);

        return {
          id: tech._id,
          name: tech.name,
          phone: tech.phone,
          completedJobs: completed,
          activeJobs: techInstalls.length - completed,
          totalHoursLogged: Math.round(totalHours * 10) / 10,
          rating: tech.technicianDetails?.rating || 4.8
        };
      })
    );

    res.json({
      success: true,
      data: {
        kpis: {
          totalCustomers,
          totalProjects: totalOrders,
          totalOrders,
          totalInstallations: completedInstallations.length,
          activeInstallations: installations.length - completedInstallations.length,
          totalInstalledCapacityKw: Math.round(totalInstalledCapacityKw * 10) / 10,
          totalRevenue,
          totalExpenses,
          estimatedProfit,
          pendingPayments,
          lowStockCount: lowStockItems.length,
          openTicketsCount,
          warrantyClaimsCount: totalWarrantyClaims,
          technicianWorkingHours: Math.round(technicianWorkingHours * 10) / 10,
          incompleteStepsCount
        },
        charts: {
          monthlyFinancials,
          capacityDistribution,
          installationStatusData,
          pipelineStageCounts,
          serviceTicketStatusChart,
          inventoryStockChart,
          technicianStats: technicianStats.sort((a, b) => b.completedJobs - a.completedJobs)
        }
      }
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
