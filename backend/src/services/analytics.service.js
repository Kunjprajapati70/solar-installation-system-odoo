/**
 * Real-Time Analytics & Reporting Service
 * Uses high-performance MongoDB aggregation pipelines tailored for Recharts visualization
 */

const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const Installation = require('../../models/Installation');
const Payment = require('../../models/Payment');
const Expense = require('../../models/Expense');
const Inventory = require('../../models/Inventory');
const ServiceTicket = require('../../models/ServiceTicket');
const Warranty = require('../../models/Warranty');
const User = require('../../models/User');
const Enquiry = require('../../models/Enquiry');
const ApprovalRequest = require('../../models/ApprovalRequest');
const SiteSurvey = require('../../models/SiteSurvey');
const Quotation = require('../../models/Quotation');
const Subsidy = require('../../models/Subsidy');
const { rupeesToPaise, paiseToRupees } = require('../utils/currency');

class AnalyticsService {
  /**
   * Main KPI Dashboard Stats
   */
  static async getDashboardStats() {
    const [
      totalCustomers,
      totalOrders,
      installationsAgg,
      revenueAgg,
      expensesAgg,
      pendingOrdersAgg,
      lowStockCount,
      openTicketsCount,
      warrantyClaimsAgg
    ] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Installation.aggregate([
        {
          $group: {
            _id: null,
            totalCompleted: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['completed', 'customer_accepted']] },
                  1,
                  0
                ]
              }
            },
            totalCapacity: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['completed', 'customer_accepted']] },
                  '$systemCapacityKw',
                  0
                ]
              }
            },
            totalWorkingHours: { $sum: '$totalWorkingHours' }
          }
        }
      ]),
      // Confirmed Payments Only
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
      // Expenses Total
      Expense.aggregate([
        { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
      ]),
      // Pending Balances
      Order.aggregate([
        { $match: { paymentStatus: { $ne: 'fully_paid' } } },
        { $group: { _id: null, totalPending: { $sum: '$balanceAmount' } } }
      ]),
      // Low stock (available <= minimumStock)
      Inventory.countDocuments({
        $expr: {
          $lte: [
            { $ifNull: ['$availableStock', '$currentStock'] },
            { $ifNull: ['$reorderLevel', 0] }
          ]
        }
      }),
      // Open service tickets
      ServiceTicket.countDocuments({ status: { $in: ['open', 'technician_assigned', 'in_progress', 'parts_awaited'] } }),
      // Warranty claims
      Warranty.aggregate([
        { $unwind: { path: '$claimsHistory', preserveNullAndEmptyArrays: false } },
        { $count: 'claimsCount' }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
    const netProfit = paiseToRupees(rupeesToPaise(totalRevenue) - rupeesToPaise(totalExpenses));

    return {
      totalCustomers,
      totalProjects: totalOrders,
      completedInstallations: installationsAgg[0]?.totalCompleted || 0,
      installedCapacityKw: installationsAgg[0]?.totalCapacity || 0,
      totalRevenue,
      totalExpenses,
      estimatedProfit: netProfit,
      pendingPayments: pendingOrdersAgg[0]?.totalPending || 0,
      lowStockEquipment: lowStockCount,
      openTickets: openTicketsCount,
      warrantyClaims: warrantyClaimsAgg[0]?.claimsCount || 0,
      technicianWorkingHours: installationsAgg[0]?.totalWorkingHours || 0
    };
  }

  /**
   * Monthly Revenue vs Expenses for Recharts Area/Bar Chart
   */
  static async getMonthlyRevenueExpenses(year = new Date().getFullYear()) {
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const [monthlyRevenue, monthlyExpenses] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            status: 'completed',
            paidAt: { $gte: startOfYear, $lte: endOfYear }
          }
        },
        {
          $group: {
            _id: { $month: '$paidAt' },
            revenue: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            expenseDate: { $gte: startOfYear, $lte: endOfYear }
          }
        },
        {
          $group: {
            _id: { $month: '$expenseDate' },
            expenses: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const chartData = months.map((monthName, index) => {
      const monthNum = index + 1;
      const revObj = monthlyRevenue.find((r) => r._id === monthNum);
      const expObj = monthlyExpenses.find((e) => e._id === monthNum);

      const revenue = revObj ? revObj.revenue : 0;
      const expenses = expObj ? expObj.expenses : 0;
      const profit = paiseToRupees(rupeesToPaise(revenue) - rupeesToPaise(expenses));

      return {
        month: monthName,
        revenue,
        expenses,
        profit
      };
    });

    return chartData;
  }

  /**
   * Installation Pipeline Distribution for Recharts Pie/Bar Chart
   */
  static async getInstallationPipelineDistribution() {
    const pipelineData = await Installation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalKw: { $sum: '$systemCapacityKw' }
        }
      }
    ]);

    const statusLabels = {
      assigned: 'Assigned / Scheduled',
      in_progress: 'In Progress',
      testing_in_progress: 'Testing & QA',
      completed: 'Completed',
      customer_accepted: 'Customer Accepted'
    };

    return pipelineData.map((item) => ({
      status: item._id,
      label: statusLabels[item._id] || item._id,
      count: item.count,
      totalKw: item.totalKw
    }));
  }

  /**
   * Capacity by System Type (On-Grid, Off-Grid, Hybrid)
   */
  static async getCapacityBySystemType() {
    const data = await Order.aggregate([
      {
        $group: {
          _id: '$systemType',
          count: { $sum: 1 },
          totalKw: { $sum: '$systemCapacityKw' },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const systemLabels = {
      on_grid: 'On-Grid Grid-Tied',
      off_grid: 'Off-Grid Standalone',
      hybrid: 'Hybrid Battery Storage'
    };

    return data.map((d) => ({
      systemType: d._id,
      label: systemLabels[d._id] || d._id,
      projectsCount: d.count,
      totalKw: d.totalKw,
      totalAmount: d.totalAmount
    }));
  }

  /**
   * Service Tickets Breakdown
   */
  static async getServiceTicketsBreakdown() {
    const [byStatus, byCategory] = await Promise.all([
      ServiceTicket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      ServiceTicket.aggregate([
        { $group: { _id: '$issueCategory', count: { $sum: 1 } } }
      ])
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      byCategory: byCategory.map((c) => ({ category: c._id, count: c.count }))
    };
  }

  /**
   * Inventory Stock Alerts
   */
  static async getInventoryStockHealth() {
    return await Inventory.find()
      .select('name category brand model availableStock currentStock reorderLevel unitCostPrice unitSellingPrice')
      .lean();
  }

  /**
   * Technician Hours Summary Report
   */
  static async getTechnicianHoursReport() {
    const technicians = await User.find({ role: 'technician' })
      .select('name email phone technicianDetails')
      .lean();

    const jobs = await Installation.find()
      .select('leadTechnician assistingTechnicians status totalWorkingHours')
      .lean();

    return technicians.map((tech) => {
      const assignedJobs = jobs.filter(
        (j) =>
          j.leadTechnician?.toString() === tech._id.toString() ||
          j.assistingTechnicians?.some((t) => t.toString() === tech._id.toString())
      );

      const completedCount = assignedJobs.filter(
        (j) => j.status === 'completed' || j.status === 'customer_accepted'
      ).length;

      const totalHours = assignedJobs.reduce((acc, j) => acc + (j.totalWorkingHours || 0), 0);

      return {
        technicianId: tech._id,
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        rating: tech.technicianDetails?.rating || 4.8,
        totalJobs: assignedJobs.length,
        completedJobs: completedCount,
        totalWorkingHours: Number(totalHours.toFixed(1))
      };
    });
  }

  /**
   * Comprehensive Analytics & Work Monitoring Center
   * Powers the 6 Recharts charts and the 4 overview centers with real MongoDB aggregations
   */
  static async getComprehensiveAnalytics(filters = {}) {
    const year = Number(filters.year) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    // 1. Business Overview KPIs
    const [
      totalLeads,
      newLeads,
      convertedLeads,
      totalCustomers,
      totalEmployees,
      totalTechnicians,
      totalProjects,
      completedInstalls,
      pendingInstalls,
      capacityAgg
    ] = await Promise.all([
      Enquiry.countDocuments({ archived: { $ne: true } }),
      Enquiry.countDocuments({ status: { $in: ['new', 'contacted'] }, archived: { $ne: true } }),
      Enquiry.countDocuments({ status: 'converted', archived: { $ne: true } }),
      Customer.countDocuments(),
      User.countDocuments({ role: { $in: ['admin', 'sales'] }, isActive: true }),
      User.countDocuments({ role: 'technician', isActive: true }),
      Order.countDocuments(),
      Installation.countDocuments({ status: { $in: ['completed', 'customer_accepted'] } }),
      Installation.countDocuments({ status: { $in: ['assigned', 'in_progress', 'testing_in_progress'] } }),
      Installation.aggregate([
        { $match: { status: { $in: ['completed', 'customer_accepted'] } } },
        { $group: { _id: null, totalKw: { $sum: '$systemCapacityKw' } } }
      ])
    ]);

    // 2. Financial Overview KPIs (Separating Demo Transactions)
    const [
      realRevenueAgg,
      demoRevenueAgg,
      expensesAgg,
      pendingPaymentsAgg,
      advancePaymentsAgg
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed', isDemo: { $ne: true } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', isDemo: true } },
        { $group: { _id: null, totalDemo: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $group: { _id: null, totalExpenses: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: { $ne: 'fully_paid' } } },
        { $group: { _id: null, totalPending: { $sum: '$balanceAmount' } } }
      ]),
      Order.aggregate([
        { $group: { _id: null, totalAdvance: { $sum: '$advancePaid' } } }
      ])
    ]);

    const totalConfirmedRevenue = realRevenueAgg[0]?.totalRevenue || 0;
    const totalDemoRevenue = demoRevenueAgg[0]?.totalDemo || 0;
    const totalExpenses = expensesAgg[0]?.totalExpenses || 0;
    const estimatedProfit = paiseToRupees(rupeesToPaise(totalConfirmedRevenue) - rupeesToPaise(totalExpenses));

    // 3. Operational Overview KPIs
    const [
      pendingUserApprovals,
      pendingCustomerRequests,
      pendingSurveys,
      pendingQuotations,
      pendingDispatches,
      ongoingInstallations,
      overdueInstallations,
      openTickets,
      pendingWarranties,
      lowStock
    ] = await Promise.all([
      ApprovalRequest.countDocuments({ requestType: 'user_creation', status: 'pending' }),
      ApprovalRequest.countDocuments({ requestType: 'customer_creation', status: 'pending' }),
      SiteSurvey.countDocuments({ status: { $in: ['scheduled', 'completed'] }, 'approvalDetails.isApproved': { $ne: true } }),
      Quotation.countDocuments({ status: { $in: ['draft', 'sent'] } }),
      Order.countDocuments({ orderStatus: { $in: ['confirmed', 'stock_checked', 'allocated'] } }),
      Installation.countDocuments({ status: { $in: ['assigned', 'in_progress', 'testing_in_progress'] } }),
      Installation.countDocuments({
        status: { $in: ['assigned', 'in_progress'] },
        scheduledDate: { $lt: new Date() }
      }),
      ServiceTicket.countDocuments({ status: { $in: ['open', 'technician_assigned', 'in_progress', 'parts_awaited'] } }),
      Warranty.aggregate([
        { $unwind: { path: '$claimsHistory', preserveNullAndEmptyArrays: false } },
        { $count: 'claimsCount' }
      ]),
      Inventory.countDocuments({
        $expr: {
          $lte: [
            { $ifNull: ['$availableStock', '$currentStock'] },
            { $ifNull: ['$reorderLevel', 0] }
          ]
        }
      })
    ]);

    // 4. Employee & Technician Analysis
    const salesUsers = await User.find({ role: 'sales' }).select('name email phone').lean();
    const leads = await Enquiry.find({ archived: { $ne: true } }).select('assignedSales status').lean();

    const salesAnalysis = salesUsers.map((salesRep) => {
      const repLeads = leads.filter((l) => l.assignedSales?.toString() === salesRep._id.toString());
      const converted = repLeads.filter((l) => l.status === 'converted' || l.status === 'won').length;
      const rate = repLeads.length > 0 ? ((converted / repLeads.length) * 100).toFixed(1) : 0;
      return {
        salesId: salesRep._id,
        name: salesRep.name,
        email: salesRep.email,
        totalLeads: repLeads.length,
        convertedLeads: converted,
        conversionRate: Number(rate)
      };
    });

    const technicianReport = await AnalyticsService.getTechnicianHoursReport();

    // 5. THE 6 RECHARTS DATASETS

    // Chart 1: Revenue vs Expenses by Month
    const chart1RevenueExpenses = await AnalyticsService.getMonthlyRevenueExpenses(year);

    // Chart 2: Lead Conversion by Status
    const leadStatusAgg = await Enquiry.aggregate([
      { $match: { archived: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const leadStatusColors = {
      new: '#38bdf8',
      contacted: '#818cf8',
      follow_up_required: '#fbbf24',
      site_survey_scheduled: '#a78bfa',
      survey_scheduled: '#a78bfa',
      survey_completed: '#2dd4bf',
      quotation_sent: '#f472b6',
      quoted: '#f472b6',
      converted: '#34d399',
      won: '#10b981',
      rejected: '#f43f5e',
      lost: '#94a3b8'
    };
    const chart2LeadConversion = leadStatusAgg.map((item) => ({
      status: item._id,
      label: item._id ? item._id.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN',
      count: item.count,
      fill: leadStatusColors[item._id] || '#64748b'
    }));

    // Chart 3: Installation Performance by Month
    const installMonthlyAgg = await Installation.aggregate([
      {
        $match: {
          scheduledDate: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$scheduledDate' },
          completed: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'customer_accepted']] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $in: ['$status', ['assigned', 'in_progress', 'testing_in_progress']] }, 1, 0] }
          },
          totalKw: { $sum: '$systemCapacityKw' }
        }
      }
    ]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chart3InstallationPerformance = months.map((monthName, idx) => {
      const match = installMonthlyAgg.find((m) => m._id === idx + 1);
      return {
        month: monthName,
        completed: match ? match.completed : 0,
        inProgress: match ? match.inProgress : 0,
        totalKw: match ? Number(match.totalKw.toFixed(1)) : 0
      };
    });

    // Chart 4: Technician Performance
    const chart4TechnicianPerformance = technicianReport.map((tech) => ({
      technicianName: tech.name,
      completedJobs: tech.completedJobs,
      totalJobs: tech.totalJobs,
      workingHours: tech.totalWorkingHours,
      rating: tech.rating
    }));

    // Chart 5: Project Capacity (kW) by Month
    const capacityMonthlyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          capacityKw: { $sum: '$systemCapacityKw' },
          projectsCount: { $sum: 1 }
        }
      }
    ]);
    const chart5ProjectCapacity = months.map((monthName, idx) => {
      const match = capacityMonthlyAgg.find((c) => c._id === idx + 1);
      return {
        month: monthName,
        capacityKw: match ? Number(match.capacityKw.toFixed(1)) : 0,
        projectsCount: match ? match.projectsCount : 0
      };
    });

    // Chart 6: Service Ticket Status
    const ticketStatusAgg = await ServiceTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const ticketStatusColors = {
      open: '#f59e0b',
      technician_assigned: '#38bdf8',
      in_progress: '#818cf8',
      parts_awaited: '#e879f9',
      resolved: '#34d399',
      closed: '#10b981',
      rejected: '#f43f5e'
    };
    const chart6ServiceTicketStatus = ticketStatusAgg.map((item) => ({
      status: item._id,
      label: item._id ? item._id.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN',
      count: item.count,
      fill: ticketStatusColors[item._id] || '#64748b'
    }));

    return {
      businessOverview: {
        totalLeads,
        newLeads,
        convertedLeads,
        totalCustomers,
        totalEmployees,
        totalTechnicians,
        totalProjects,
        completedInstallations: completedInstalls,
        pendingInstallations: pendingInstalls,
        installedCapacityKw: capacityAgg[0]?.totalKw || 0
      },
      financialOverview: {
        totalConfirmedRevenue,
        totalExpenses,
        estimatedProfit,
        pendingPayments: pendingPaymentsAgg[0]?.totalPending || 0,
        advancePayments: advancePaymentsAgg[0]?.totalAdvance || 0,
        outstandingBalances: pendingPaymentsAgg[0]?.totalPending || 0,
        demoPayments: {
          totalRevenue: totalDemoRevenue,
          transactionCount: demoRevenueAgg[0]?.count || 0
        }
      },
      operationalOverview: {
        pendingUserApprovals,
        pendingCustomerRequests,
        pendingSurveys,
        pendingQuotations,
        pendingDispatches,
        ongoingInstallations,
        overdueInstallations,
        openServiceTickets: openTickets,
        pendingWarrantyClaims: pendingWarranties[0]?.claimsCount || 0,
        lowStockEquipment: lowStock
      },
      employeeAnalysis: {
        salesPerformance: salesAnalysis,
        technicianPerformance: technicianReport
      },
      charts: {
        revenueVsExpenses: chart1RevenueExpenses,
        leadConversion: chart2LeadConversion,
        installationPerformance: chart3InstallationPerformance,
        technicianPerformance: chart4TechnicianPerformance,
        projectCapacity: chart5ProjectCapacity,
        serviceTicketStatus: chart6ServiceTicketStatus
      }
    };
  }
}

module.exports = AnalyticsService;
