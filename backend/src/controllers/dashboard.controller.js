/**
 * Dashboard & Reports Controller
 * Delivers real-time MongoDB aggregation metrics structured for Recharts
 */

const AnalyticsService = require('../services/analytics.service');
const PaymentService = require('../services/payment.service');
const Inventory = require('../../models/Inventory');
const Installation = require('../../models/Installation');
const Warranty = require('../../models/Warranty');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
  /**
   * GET /api/dashboard and /api/analytics/dashboard
   */
  static async getFullDashboard(req, res, next) {
    try {
      const year = req.query.year ? parseInt(req.query.year) : 2026;
      const [stats, monthly, pipeline, tickets, inventory, technicians, activeInstalls, expiring] = await Promise.all([
        AnalyticsService.getDashboardStats(),
        AnalyticsService.getMonthlyRevenueExpenses(year),
        AnalyticsService.getInstallationPipelineDistribution(),
        AnalyticsService.getServiceTicketsBreakdown(),
        Inventory.find().lean(),
        AnalyticsService.getTechnicianHoursReport(),
        Installation.countDocuments({ status: { $in: ['assigned', 'in_progress', 'testing_in_progress'] } }),
        Warranty.countDocuments({
          status: 'active',
          expiryDate: { $lte: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) }
        })
      ]);

      const pipelineColors = {
        assigned: '#94a3b8',
        in_progress: '#f59e0b',
        testing_in_progress: '#38bdf8',
        completed: '#10b981',
        customer_accepted: '#10b981',
        scheduled: '#38bdf8',
        approved: '#a855f7',
        pending: '#94a3b8'
      };

      const ticketColors = {
        open: '#38bdf8',
        technician_assigned: '#818cf8',
        in_progress: '#f59e0b',
        parts_awaited: '#ec4899',
        resolved: '#10b981',
        closed: '#64748b'
      };

      return ApiResponse.success(res, {
        kpis: {
          totalCustomers: stats.totalCustomers,
          totalProjects: stats.totalProjects,
          totalOrders: stats.totalProjects,
          totalInstallations: stats.completedInstallations,
          activeInstallations: activeInstalls,
          totalInstalledCapacityKw: Number((stats.installedCapacityKw || 0).toFixed(1)),
          totalRevenue: stats.totalRevenue,
          pendingPayments: stats.pendingPayments,
          openTicketsCount: stats.openTickets,
          warrantyClaimsCount: stats.warrantyClaims,
          lowStockCount: stats.lowStockEquipment,
          expiringWarranties: expiring
        },
        charts: {
          monthlyFinancials: monthly.map((row) => ({
            ...row,
            capacityKw: Math.round((stats.installedCapacityKw || 0) / 12)
          })),
          pipelineStageCounts: pipeline.map((p) => ({
            name: p.label || p.status,
            count: p.count,
            color: pipelineColors[p.status] || '#94a3b8'
          })),
          serviceTicketStatusChart: (tickets.byStatus || []).map((t) => ({
            status: t.status,
            count: t.count,
            fill: ticketColors[t.status] || '#38bdf8'
          })),
          inventoryStockChart: inventory.map((item) => ({
            category: item.category,
            availableStock: item.availableStock ?? item.currentStock,
            currentStock: item.currentStock,
            safetyThreshold: item.reorderLevel
          })),
          technicianStats: technicians.map((tech) => ({
            id: tech.technicianId,
            name: tech.name,
            phone: tech.phone,
            completedJobs: tech.completedJobs,
            activeJobs: Math.max(0, tech.totalJobs - tech.completedJobs),
            totalHoursLogged: tech.totalWorkingHours,
            rating: tech.rating
          }))
        }
      }, 'Live dashboard metrics loaded from MongoDB');
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await AnalyticsService.getDashboardStats();
      return ApiResponse.success(res, stats, 'Dashboard KPI metrics calculated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/revenue-expenses
   */
  static async getRevenueExpenses(req, res, next) {
    try {
      const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
      const chartData = await AnalyticsService.getMonthlyRevenueExpenses(year);
      return ApiResponse.success(res, chartData, 'Monthly revenue vs expenses calculated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/installations
   */
  static async getInstallations(req, res, next) {
    try {
      const pipelineData = await AnalyticsService.getInstallationPipelineDistribution();
      return ApiResponse.success(res, pipelineData, 'Installation pipeline distribution retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/capacity
   */
  static async getCapacity(req, res, next) {
    try {
      const capacityData = await AnalyticsService.getCapacityBySystemType();
      return ApiResponse.success(res, capacityData, 'Capacity distribution by system type retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/service-tickets
   */
  static async getServiceTickets(req, res, next) {
    try {
      const ticketsBreakdown = await AnalyticsService.getServiceTicketsBreakdown();
      return ApiResponse.success(res, ticketsBreakdown, 'Service tickets breakdown retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/inventory
   */
  static async getInventory(req, res, next) {
    try {
      const inventoryHealth = await AnalyticsService.getInventoryStockHealth();
      return ApiResponse.success(res, inventoryHealth, 'Inventory stock health retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/summary
   */
  static async getReportsSummary(req, res, next) {
    try {
      const [stats, finance] = await Promise.all([
        AnalyticsService.getDashboardStats(),
        PaymentService.getFinancialSummary()
      ]);
      return ApiResponse.success(res, { stats, finance }, 'Enterprise reports summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/profitability
   */
  static async getProfitabilityReport(req, res, next) {
    try {
      const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
      const [finance, monthly] = await Promise.all([
        PaymentService.getFinancialSummary(),
        AnalyticsService.getMonthlyRevenueExpenses(year)
      ]);
      return ApiResponse.success(res, { overview: finance, monthlyBreakdown: monthly }, 'Profitability report generated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/technician-hours
   */
  static async getTechnicianHours(req, res, next) {
    try {
      const report = await AnalyticsService.getTechnicianHoursReport();
      return ApiResponse.success(res, report, 'Technician working hours and performance report retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
