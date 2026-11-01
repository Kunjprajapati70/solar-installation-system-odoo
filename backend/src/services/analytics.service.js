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
}

module.exports = AnalyticsService;
