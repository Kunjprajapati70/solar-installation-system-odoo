const ApiResponse = require('../utils/apiResponse');

/**
 * Validation Helper
 * Validates request payload against rule definitions
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const target = req.method === 'GET' ? req.query : req.body;

    for (const [field, rules] of Object.entries(schema)) {
      const val = target[field];

      if (rules.required && (val === undefined || val === null || val === '')) {
        errors.push(`'${field}' is required.`);
        continue;
      }

      if (val !== undefined && val !== null && val !== '') {
        if (rules.type === 'number' && isNaN(Number(val))) {
          errors.push(`'${field}' must be a valid number.`);
        }
        if (rules.min !== undefined && Number(val) < rules.min) {
          errors.push(`'${field}' cannot be less than ${rules.min}.`);
        }
        if (rules.type === 'email') {
          const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          if (!emailRegex.test(val)) {
            errors.push(`'${field}' must be a valid email address.`);
          }
        }
        if (rules.enum && !rules.enum.includes(val)) {
          errors.push(`'${field}' must be one of: [${rules.enum.join(', ')}].`);
        }
      }
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Request validation failed', errors);
    }

    next();
  };
};

// Common Validation Schemas
const schemas = {
  login: {
    email: { required: true, type: 'email' },
    password: { required: true }
  },
  register: {
    name: { required: true },
    email: { required: true, type: 'email' },
    password: { required: true },
    role: { enum: ['admin', 'sales', 'technician', 'customer'] }
  },
  customerCreate: {
    name: { required: true },
    email: { required: true, type: 'email' },
    phone: { required: true }
  },
  surveyCreate: {
    scheduledDate: { required: true }
  },
  quotationCreate: {
    customer: { required: true },
    systemCapacityKw: { required: true, type: 'number', min: 0.1 },
    systemType: { required: true, enum: ['on_grid', 'off_grid', 'hybrid'] }
  },
  orderCreate: {
    quotation: { required: true }
  },
  equipmentDispatch: {
    orderId: { required: true }
  },
  serviceTicketCreate: {
    equipmentSerialNumber: { required: true },
    title: { required: true },
    description: { required: true }
  },
  transactionCreate: {
    amount: { required: true, type: 'number', min: 1 },
    paymentType: { required: true }
  }
};

module.exports = {
  validate,
  schemas
};
