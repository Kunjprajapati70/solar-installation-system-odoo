const Enquiry = require('../../models/Enquiry');
const Customer = require('../../models/Customer');
const SiteSurvey = require('../../models/SiteSurvey');
const User = require('../../models/User');
const ApiResponse = require('../utils/apiResponse');

class EnquiryController {
  /**
   * GET /api/enquiries (and /api/leads)
   */
  static async listEnquiries(req, res, next) {
    try {
      const { status, assignedSales, leadSource, search, page = 1, limit = 50, includeArchived = 'false' } = req.query;
      const query = {};

      if (includeArchived !== 'true') {
        query.archived = { $ne: true };
      }

      if (status) query.status = status;
      if (assignedSales) query.assignedSales = assignedSales;
      if (leadSource) query.leadSource = leadSource;

      // If user is sales rep and not admin, prioritize their assigned leads if query specifies
      if (req.user?.role === 'sales' && req.query.myLeads === 'true') {
        query.assignedSales = req.user._id;
      }

      if (search) {
        query.$or = [
          { customerName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { enquiryNumber: { $regex: search, $options: 'i' } },
          { leadId: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [enquiries, total] = await Promise.all([
        Enquiry.find(query)
          .populate('assignedSales', 'name email role phone')
          .populate('linkedCustomer', 'name customerCode phone email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Enquiry.countDocuments(query)
      ]);

      return ApiResponse.success(res, enquiries, 'Leads retrieved', 200, {
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
   * GET /api/enquiries/:id
   */
  static async getById(req, res, next) {
    try {
      const enquiry = await Enquiry.findById(req.params.id)
        .populate('assignedSales', 'name email role phone')
        .populate('linkedCustomer')
        .populate('leadHistory.changedBy', 'name email role');

      if (!enquiry) {
        return ApiResponse.notFound(res, 'Customer Lead record not found.');
      }
      return ApiResponse.success(res, enquiry);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/enquiries
   */
  static async createEnquiry(req, res, next) {
    try {
      const count = await Enquiry.countDocuments();
      const num = `LED-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const lead = new Enquiry({
        ...req.body,
        enquiryNumber: num,
        leadId: num,
        leadSource: req.body.leadSource || 'website',
        status: req.body.status || 'new',
        assignedSales: req.body.assignedSales || (req.user?.role === 'sales' ? req.user._id : undefined),
        leadHistory: [
          {
            fromStatus: 'none',
            toStatus: req.body.status || 'new',
            action: 'CREATED',
            changedBy: req.user?._id,
            changedByName: req.user?.name || 'System Lead Engine',
            notes: req.body.notes || 'Lead recorded in pipeline'
          }
        ]
      });

      await lead.save();
      const populated = await Enquiry.findById(lead._id).populate('assignedSales', 'name email phone');

      return ApiResponse.created(res, populated, 'Customer lead created successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/enquiries/:id/assign
   * Assign or reassign lead to sales employee
   */
  static async assignLead(req, res, next) {
    try {
      const { salesId, notes } = req.body;
      if (!salesId) {
        return ApiResponse.badRequest(res, 'Sales Employee ID is required for assignment.');
      }

      const [lead, salesUser] = await Promise.all([
        Enquiry.findById(req.params.id),
        User.findById(salesId)
      ]);

      if (!lead) return ApiResponse.notFound(res, 'Lead not found.');
      if (!salesUser) return ApiResponse.notFound(res, 'Sales representative not found.');

      const prevAssigned = lead.assignedSales;
      lead.assignedSales = salesUser._id;
      if (lead.status === 'new') {
        lead.status = 'contacted';
      }

      lead.leadHistory.push({
        action: 'ASSIGNED',
        fromStatus: lead.status,
        toStatus: lead.status,
        changedBy: req.user._id,
        changedByName: req.user.name,
        notes: notes || `Assigned to ${salesUser.name}`
      });

      await lead.save();
      const populated = await Enquiry.findById(lead._id).populate('assignedSales', 'name email phone');

      return ApiResponse.success(res, populated, `Lead assigned to ${salesUser.name}.`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/enquiries/:id/status
   * Update lead status with audit logging
   */
  static async updateStatus(req, res, next) {
    try {
      const { status, notes, rejectionReason } = req.body;
      if (!status) {
        return ApiResponse.badRequest(res, 'New lead status is required.');
      }

      const lead = await Enquiry.findById(req.params.id);
      if (!lead) return ApiResponse.notFound(res, 'Lead not found.');

      const fromStatus = lead.status;
      lead.status = status;
      if (rejectionReason) lead.rejectionReason = rejectionReason;
      if (notes) lead.notes = notes;

      lead.leadHistory.push({
        action: 'STATUS_CHANGE',
        fromStatus,
        toStatus: status,
        changedBy: req.user._id,
        changedByName: req.user.name,
        notes: notes || rejectionReason || `Status shifted to ${status}`
      });

      await lead.save();
      const populated = await Enquiry.findById(lead._id).populate('assignedSales', 'name email phone');

      return ApiResponse.success(res, populated, `Lead status updated to '${status}'.`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/enquiries/:id/convert
   * Convert an approved lead into a customer record, preventing duplicates
   */
  static async convertLead(req, res, next) {
    try {
      const lead = await Enquiry.findById(req.params.id);
      if (!lead) return ApiResponse.notFound(res, 'Lead record not found.');

      // Check for existing customer to prevent duplicates
      let customer = await Customer.findOne({
        $or: [
          { email: lead.email.toLowerCase().trim() },
          { phone: lead.phone.trim() }
        ]
      });

      let wasExisting = false;
      if (customer) {
        wasExisting = true;
      } else {
        const customerCode = `CUST-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
        customer = new Customer({
          customerCode,
          name: lead.customerName,
          email: lead.email.toLowerCase().trim(),
          phone: lead.phone.trim(),
          installationAddress: {
            street: lead.address?.street || 'Site Address',
            city: lead.address?.city || 'Ahmedabad',
            state: lead.address?.state || 'Gujarat',
            pincode: lead.address?.pincode || '380015'
          },
          connectionType: lead.systemType || 'on_grid',
          sanctionedLoadKw: lead.proposedCapacityKw || 3,
          discomName: 'State Electricity Distribution Co.',
          consumerNumber: `CON-${Date.now().toString().slice(-6)}`,
          currentPhase: 'single',
          notes: lead.notes
        });
        await customer.save();
      }

      lead.linkedCustomer = customer._id;
      lead.status = 'converted';
      lead.leadHistory.push({
        action: 'CONVERTED_TO_CUSTOMER',
        fromStatus: lead.status,
        toStatus: 'converted',
        changedBy: req.user._id,
        changedByName: req.user.name,
        notes: wasExisting
          ? `Linked to existing customer profile #${customer.customerCode}`
          : `Converted to new customer #${customer.customerCode}`
      });

      await lead.save();

      return ApiResponse.success(res, {
        lead,
        customer,
        isExistingCustomer: wasExisting
      }, wasExisting ? 'Lead linked to existing customer profile.' : 'Lead converted to customer successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/enquiries/:id/notes
   * Add internal staff note
   */
  static async addInternalNote(req, res, next) {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return ApiResponse.badRequest(res, 'Note text cannot be empty.');
      }

      const lead = await Enquiry.findById(req.params.id);
      if (!lead) return ApiResponse.notFound(res, 'Lead not found.');

      lead.internalNotes.push({
        text: text.trim(),
        author: req.user._id,
        authorName: req.user.name,
        createdAt: new Date()
      });

      await lead.save();
      return ApiResponse.success(res, lead, 'Internal note added to lead record.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/enquiries/:id/archive
   */
  static async archiveLead(req, res, next) {
    try {
      const { archive = true } = req.body;
      const lead = await Enquiry.findById(req.params.id);
      if (!lead) return ApiResponse.notFound(res, 'Lead not found.');

      lead.archived = Boolean(archive);
      lead.leadHistory.push({
        action: lead.archived ? 'ARCHIVED' : 'UNARCHIVED',
        fromStatus: lead.status,
        toStatus: lead.status,
        changedBy: req.user._id,
        changedByName: req.user.name,
        notes: lead.archived ? 'Archived from active pipeline' : 'Restored to active pipeline'
      });

      await lead.save();
      return ApiResponse.success(res, lead, lead.archived ? 'Lead archived.' : 'Lead unarchived.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/enquiries/:id
   */
  static async updateEnquiry(req, res, next) {
    try {
      const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      if (!enquiry) {
        return ApiResponse.notFound(res, 'Lead not found.');
      }
      return ApiResponse.success(res, enquiry, 'Lead updated.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/enquiries/:id
   */
  static async deleteEnquiry(req, res, next) {
    try {
      const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
      if (!enquiry) {
        return ApiResponse.notFound(res, 'Lead not found.');
      }
      return ApiResponse.success(res, null, 'Lead deleted.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/enquiries/:id/schedule-survey
   */
  static async scheduleSurvey(req, res, next) {
    try {
      const enquiry = await Enquiry.findById(req.params.id);
      if (!enquiry) {
        return ApiResponse.notFound(res, 'Lead not found.');
      }

      const { surveyorId, scheduledDate, notes } = req.body;
      if (!surveyorId || !scheduledDate) {
        return ApiResponse.badRequest(res, 'Surveyor engineer and scheduled date are required.');
      }

      let customerId = enquiry.linkedCustomer;
      if (!customerId) {
        const existing = await Customer.findOne({
          $or: [
            { email: enquiry.email.toLowerCase().trim() },
            { phone: enquiry.phone.trim() }
          ]
        });
        if (existing) {
          customerId = existing._id;
        } else {
          const customer = await Customer.create({
            customerCode: `CUST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
            name: enquiry.customerName,
            email: enquiry.email.toLowerCase().trim(),
            phone: enquiry.phone.trim(),
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

      enquiry.status = 'site_survey_scheduled';
      enquiry.leadHistory.push({
        action: 'SURVEY_SCHEDULED',
        fromStatus: enquiry.status,
        toStatus: 'site_survey_scheduled',
        changedBy: req.user._id,
        changedByName: req.user.name,
        notes: `Site Survey #${survey.surveyNumber} scheduled for ${new Date(scheduledDate).toLocaleDateString()}`
      });
      await enquiry.save();

      return ApiResponse.created(res, { enquiry, survey }, 'Site survey scheduled successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EnquiryController;
