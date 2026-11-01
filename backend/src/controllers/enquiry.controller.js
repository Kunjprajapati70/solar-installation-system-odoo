const Enquiry = require('../../models/Enquiry');
const Customer = require('../../models/Customer');
const SiteSurvey = require('../../models/SiteSurvey');
const ApiResponse = require('../utils/apiResponse');

class EnquiryController {
  static async listEnquiries(req, res, next) {
    try {
      const { status, search } = req.query;
      const query = {};

      if (status) query.status = status;
      if (search) {
        query.$or = [
          { customerName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { enquiryNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const enquiries = await Enquiry.find(query)
        .populate('assignedSales', 'name email')
        .populate('linkedCustomer', 'name customerCode')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, enquiries);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const enquiry = await Enquiry.findById(req.params.id)
        .populate('assignedSales', 'name email')
        .populate('linkedCustomer');

      if (!enquiry) {
        return ApiResponse.notFound(res, 'Enquiry not found.');
      }
      return ApiResponse.success(res, enquiry);
    } catch (err) {
      next(err);
    }
  }

  static async createEnquiry(req, res, next) {
    try {
      const count = await Enquiry.countDocuments();
      const enquiryNumber = `ENQ-2026-${String(count + 1).padStart(4, '0')}`;

      const enquiry = await Enquiry.create({
        ...req.body,
        enquiryNumber
      });

      return ApiResponse.created(res, enquiry, 'Enquiry received.');
    } catch (err) {
      next(err);
    }
  }

  static async updateEnquiry(req, res, next) {
    try {
      const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      if (!enquiry) {
        return ApiResponse.notFound(res, 'Enquiry not found.');
      }
      return ApiResponse.success(res, enquiry, 'Enquiry updated.');
    } catch (err) {
      next(err);
    }
  }

  static async deleteEnquiry(req, res, next) {
    try {
      const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
      if (!enquiry) {
        return ApiResponse.notFound(res, 'Enquiry not found.');
      }
      return ApiResponse.success(res, null, 'Enquiry deleted.');
    } catch (err) {
      next(err);
    }
  }

  static async scheduleSurvey(req, res, next) {
    try {
      const enquiry = await Enquiry.findById(req.params.id);
      if (!enquiry) {
        return ApiResponse.notFound(res, 'Enquiry not found.');
      }

      const { surveyorId, scheduledDate, notes } = req.body;
      if (!surveyorId || !scheduledDate) {
        return ApiResponse.badRequest(res, 'Surveyor and scheduled date are required.');
      }

      let customerId = enquiry.linkedCustomer;
      if (!customerId) {
        const existing = await Customer.findOne({ email: enquiry.email });
        if (existing) {
          customerId = existing._id;
        } else {
          const customer = await Customer.create({
            customerCode: `CUST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
            name: enquiry.customerName,
            email: enquiry.email,
            phone: enquiry.phone,
            installationAddress: {
              street: enquiry.address?.street || 'Site Address',
              city: enquiry.address?.city || 'Ahmedabad',
              state: enquiry.address?.state || 'Gujarat',
              pincode: enquiry.address?.pincode || '380015'
            },
            connectionType: enquiry.systemType || 'on_grid',
            sanctionedLoadKw: enquiry.proposedCapacityKw || 3
          });
          customerId = customer._id;
        }
        enquiry.linkedCustomer = customerId;
      }

      const survey = await SiteSurvey.create({
        surveyNumber: `SRV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        enquiry: enquiry._id,
        customer: customerId,
        surveyor: surveyorId,
        scheduledDate,
        status: 'scheduled',
        surveyorNotes: notes || 'Site survey scheduled from enquiry pipeline'
      });

      enquiry.status = 'survey_scheduled';
      await enquiry.save();

      return ApiResponse.created(res, { enquiry, survey }, 'Site survey scheduled successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EnquiryController;
