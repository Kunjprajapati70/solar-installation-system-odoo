/**
 * Site Survey Management Controller
 * Enforces survey scheduling, technical findings recording, and approval gates
 */

const SiteSurvey = require('../../models/SiteSurvey');
const Customer = require('../../models/Customer');
const Enquiry = require('../../models/Enquiry');
const ApiResponse = require('../utils/apiResponse');
const { SURVEY_STATUS } = require('../config/constants');

class SurveyController {
  /**
   * POST /api/surveys
   */
  static async createSurvey(req, res, next) {
    try {
      const customerId = req.body.customerId || req.body.customer;
      const enquiryId = req.body.enquiryId || req.body.enquiry;
      const surveyorId = req.body.surveyorId || req.body.surveyor || req.user._id;
      const { scheduledDate, roofDetails, electricalDetails, notes, surveyorNotes } = req.body;

      let enquiry = null;
      let customer = null;

      if (customerId) {
        customer = await Customer.findById(customerId);
      }

      if (enquiryId) {
        enquiry = await Enquiry.findById(enquiryId);
      }

      // If customer found but no enquiry, link to customer's enquiry or create draft
      if (!enquiry && customer) {
        enquiry = await Enquiry.findOne({ email: customer.email });
      }

      if (!enquiry) {
        enquiry = new Enquiry({
          enquiryNumber: `ENQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          customerName: customer ? customer.name : req.body.customerName || 'Solar Client',
          email: customer ? customer.email : req.body.email || 'client@example.com',
          phone: customer ? customer.phone : req.body.phone || '9876543210',
          proposedCapacityKw: Number(req.body.capacityKw) || 3,
          systemType: req.body.systemType || 'on_grid',
          address: customer ? customer.installationAddress : { street: 'Main St', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
          status: 'survey_scheduled'
        });
        await enquiry.save();
      }

      // If no customer found, create customer profile
      if (!customer) {
        const emailToFind = req.body.email || enquiry.email;
        if (emailToFind) {
          customer = await Customer.findOne({ email: emailToFind });
        }
        if (!customer) {
          customer = new Customer({
            customerCode: `CUST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
            name: req.body.customerName || enquiry.customerName || 'Solar Client',
            email: req.body.email || enquiry.email || 'client@example.com',
            phone: req.body.phone || enquiry.phone || '9876543210',
            installationAddress: enquiry.address || { street: 'Main St', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }
          });
          await customer.save();
        }
      }

      const surveyNumber = `SRV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const survey = new SiteSurvey({
        surveyNumber,
        enquiry: enquiry._id,
        customer: customer._id,
        surveyor: surveyorId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: SURVEY_STATUS.SCHEDULED,
        roofDetails: roofDetails || {
          roofType: 'rcc_flat',
          totalRoofAreaSqft: 800,
          shadowFreeAreaSqft: 600,
          orientation: 'South',
          tiltAngleDeg: 22,
          azimuthDeg: 180,
          structuralIntegrity: 'good'
        },
        electricalDetails: electricalDetails || {
          phase: 'single',
          sanctionedLoadKw: 3,
          existingMeterType: 'digital_electronic',
          earthingStatus: 'required',
          distanceToPanelMeters: 15
        },
        surveyorNotes: surveyorNotes || notes || ''
      });

      await survey.save();
      const populated = await SiteSurvey.findById(survey._id)
        .populate('customer')
        .populate('enquiry')
        .populate('surveyor', 'name email phone');

      return ApiResponse.created(res, populated, 'Site survey scheduled successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Helper to resolve customer profile from authenticated user
   */
  static async getCustomerForUser(userId, userEmail) {
    let customer = await Customer.findOne({ user: userId });
    if (!customer && userEmail) {
      customer = await Customer.findOne({ email: userEmail });
    }
    return customer;
  }

  /**
   * GET /api/surveys
   * Strictly enforces customer data privacy
   */
  static async listSurveys(req, res, next) {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const query = {};

      // Security check: customer can only see their own surveys
      if (req.user?.role === 'customer') {
        const customer = await SurveyController.getCustomerForUser(req.user._id, req.user.email);
        if (!customer) {
          return ApiResponse.success(res, [], 'No surveys found', 200, { total: 0, page: 1, limit, pages: 0 });
        }
        query.customer = customer._id;
      }

      if (status) query.status = status;
      if (search) {
        query.$or = [
          { surveyNumber: { $regex: search, $options: 'i' } },
          { surveyorNotes: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        SiteSurvey.find(query)
          .populate('customer')
          .populate('enquiry')
          .populate('surveyor', 'name email phone')
          .populate('approvalDetails.approvedBy', 'name email')
          .sort({ scheduledDate: -1 })
          .skip(skip)
          .limit(Number(limit)),
        SiteSurvey.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Surveys retrieved', 200, {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/surveys/:id
   * Enforces customer ownership on single record retrieval
   */
  static async getById(req, res, next) {
    try {
      const survey = await SiteSurvey.findById(req.params.id)
        .populate('customer')
        .populate('enquiry')
        .populate('surveyor', 'name email phone')
        .populate('approvalDetails.approvedBy', 'name email');

      if (!survey) {
        return ApiResponse.notFound(res, 'Site survey not found.');
      }

      // Security check: if customer, verify ownership
      if (req.user?.role === 'customer') {
        const customer = await SurveyController.getCustomerForUser(req.user._id, req.user.email);
        const surveyCustomerId = survey.customer?._id?.toString() || survey.customer?.toString();
        if (!customer || surveyCustomerId !== customer._id.toString()) {
          return ApiResponse.forbidden(res, 'Security Policy Violation: You cannot access another customer’s site survey.');
        }
      }

      return ApiResponse.success(res, survey);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/surveys/:id
   */
  static async updateSurvey(req, res, next) {
    try {
      const { roofDetails, electricalDetails, surveyorNotes, status } = req.body;
      const survey = await SiteSurvey.findById(req.params.id);

      if (!survey) {
        return ApiResponse.notFound(res, 'Site survey not found.');
      }

      if (roofDetails) survey.roofDetails = { ...survey.roofDetails.toObject(), ...roofDetails };
      if (electricalDetails) survey.electricalDetails = { ...survey.electricalDetails.toObject(), ...electricalDetails };
      if (surveyorNotes !== undefined) survey.surveyorNotes = surveyorNotes;
      if (status) survey.status = status;

      await survey.save();
      const populated = await SiteSurvey.findById(survey._id)
        .populate('customer')
        .populate('enquiry')
        .populate('surveyor', 'name email phone');

      return ApiResponse.success(res, populated, 'Survey updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT or POST /api/surveys/:id/approve
   * Business rule: Approves survey and unlocks quotation creation
   */
  static async approveSurvey(req, res, next) {
    try {
      const { recommendedCapacityKw, recommendedSystemType, approvalNotes } = req.body;
      const survey = await SiteSurvey.findById(req.params.id);

      if (!survey) {
        return ApiResponse.notFound(res, 'Site survey not found.');
      }

      if (survey.status === SURVEY_STATUS.APPROVED) {
        return ApiResponse.badRequest(res, 'This site survey has already been approved.');
      }

      survey.status = SURVEY_STATUS.APPROVED;
      survey.approvalDetails = {
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        approvalNotes: approvalNotes || 'Rooftop integrity and solar irradiance verified. Approved for quotation.',
        recommendedCapacityKw: Number(recommendedCapacityKw) || 3,
        recommendedSystemType: recommendedSystemType || 'on_grid'
      };

      await survey.save();

      const populated = await SiteSurvey.findById(survey._id)
        .populate('customer')
        .populate('enquiry')
        .populate('surveyor', 'name email phone')
        .populate('approvalDetails.approvedBy', 'name email');

      return ApiResponse.success(res, populated, 'Site survey approved. Quotation generation unlocked.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT or POST /api/surveys/:id/reject
   */
  static async rejectSurvey(req, res, next) {
    try {
      const { reason } = req.body;
      const survey = await SiteSurvey.findById(req.params.id);

      if (!survey) {
        return ApiResponse.notFound(res, 'Site survey not found.');
      }

      if (survey.status === SURVEY_STATUS.APPROVED) {
        return ApiResponse.badRequest(res, 'Cannot reject an already approved site survey.');
      }

      survey.status = SURVEY_STATUS.REJECTED;
      survey.approvalDetails = {
        isApproved: false,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        approvalNotes: reason || 'Survey rejected due to structural or shading constraints.'
      };

      await survey.save();

      const populated = await SiteSurvey.findById(survey._id)
        .populate('customer')
        .populate('enquiry')
        .populate('surveyor', 'name email phone')
        .populate('approvalDetails.approvedBy', 'name email');

      return ApiResponse.success(res, populated, 'Site survey marked as rejected.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SurveyController;
