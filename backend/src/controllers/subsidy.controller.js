const Subsidy = require('../../models/Subsidy');
const Order = require('../../models/Order');
const ApiResponse = require('../utils/apiResponse');

class SubsidyController {
  /**
   * GET /api/subsidies
   */
  static async listSubsidies(req, res, next) {
    try {
      const { status, search } = req.query;
      const query = {};

      if (status) query.status = status;
      if (search) {
        query.$or = [
          { applicationNumber: { $regex: search, $options: 'i' } },
          { consumerNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const items = await Subsidy.find(query)
        .populate('customer')
        .populate('order', 'orderNumber systemCapacityKw totalAmount')
        .sort({ applicationDate: -1 });

      return ApiResponse.success(res, items);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/subsidies/:id
   */
  static async getById(req, res, next) {
    try {
      const subsidy = await Subsidy.findById(req.params.id)
        .populate('customer')
        .populate('order');

      if (!subsidy) {
        return ApiResponse.notFound(res, 'Subsidy application record not found.');
      }
      return ApiResponse.success(res, subsidy);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/subsidies
   */
  static async createSubsidy(req, res, next) {
    try {
      const { orderId, customerId, stateDiscom, consumerNumber, capacityKw, subsidyEligibleAmount } = req.body;

      const applicationNumber = `SUB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const subsidy = new Subsidy({
        applicationNumber,
        order: orderId,
        customer: customerId,
        stateDiscom: stateDiscom || 'Gujarat Urja Vikas Nigam Ltd (GUVNL)',
        consumerNumber: consumerNumber || `DISCOM-${Date.now().toString().slice(-5)}`,
        capacityKw: Number(capacityKw) || 3,
        subsidyEligibleAmount: Number(subsidyEligibleAmount) || 78000,
        status: 'application_submitted',
        documents: [
          { docType: 'electricity_bill', fileName: 'Latest_Electricity_Bill.pdf', verified: true },
          { docType: 'aadhaar_card', fileName: 'Customer_Aadhaar.pdf', verified: true },
          { docType: 'bank_passbook_cancelled_cheque', fileName: 'Cancelled_Cheque_DBT.pdf', verified: true }
        ]
      });

      await subsidy.save();
      return ApiResponse.created(res, subsidy, 'National Portal subsidy application filed.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/subsidies/:id/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { status, discomOfficerNotes, subsidyDisbursedAmount } = req.body;
      const subsidy = await Subsidy.findById(req.params.id);

      if (!subsidy) {
        return ApiResponse.notFound(res, 'Subsidy record not found.');
      }

      if (status) subsidy.status = status;
      if (discomOfficerNotes) subsidy.discomOfficerNotes = discomOfficerNotes;
      if (subsidyDisbursedAmount) {
        subsidy.subsidyDisbursedAmount = Number(subsidyDisbursedAmount);
        subsidy.disbursementDate = new Date();
      }

      await subsidy.save();
      return ApiResponse.success(res, subsidy, `Subsidy status updated to '${status}'.`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SubsidyController;
