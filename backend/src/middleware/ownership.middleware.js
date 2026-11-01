const Customer = require('../../models/Customer');
const Installation = require('../../models/Installation');
const ServiceTicket = require('../../models/ServiceTicket');
const ApiResponse = require('../utils/apiResponse');

/**
 * Verify Customer Ownership
 * - Admins and Sales staff can access any customer record.
 * - Customer role users can ONLY access records associated with their authenticated User._id.
 */
const verifyCustomerOwnership = async (req, res, next) => {
  if (['admin', 'sales'].includes(req.user.role)) {
    return next();
  }

  if (req.user.role === 'customer') {
    const customerId = req.params.id || req.params.customerId || req.body.customer;
    if (!customerId) return next();

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return ApiResponse.notFound(res, 'Customer not found.');
    }

    if (customer.user && customer.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied: You do not own this customer profile.');
    }

    req.customer = customer;
    return next();
  }

  return ApiResponse.forbidden(res, 'Access denied for this resource.');
};

/**
 * Verify Technician Assignment
 * - Admins can access any installation/job.
 * - Technicians can ONLY access installations where they are leadTechnician or in assistingTechnicians.
 */
const verifyTechnicianAssignment = async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'technician') {
    const installationId = req.params.id || req.body.installationId;
    if (!installationId) return next();

    const installation = await Installation.findById(installationId);
    if (!installation) {
      return ApiResponse.notFound(res, 'Installation job not found.');
    }

    const isLead = installation.leadTechnician && installation.leadTechnician.toString() === req.user._id.toString();
    const isAssistant = installation.assistingTechnicians && installation.assistingTechnicians.some(
      (techId) => techId.toString() === req.user._id.toString()
    );

    if (!isLead && !isAssistant) {
      return ApiResponse.forbidden(res, 'Access denied: You are not assigned to this installation job.');
    }

    req.installation = installation;
    return next();
  }

  return ApiResponse.forbidden(res, 'Access restricted to assigned technicians and administrators.');
};

module.exports = {
  verifyCustomerOwnership,
  verifyTechnicianAssignment
};
