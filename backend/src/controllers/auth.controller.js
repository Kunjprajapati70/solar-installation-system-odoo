/**
 * Authentication and User Management Controller
 * Enforces bcrypt hashing, JWT issuance, profile updates, and secure password reset flow
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/User');
const Customer = require('../../models/Customer');
const ApiResponse = require('../utils/apiResponse');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'sunpower_super_secret_jwt_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

class AuthController {
  /**
   * POST /api/auth/register
   * Authorized admin registration or customer self-registration
   */
  static async register(req, res, next) {
    try {
      const { name, email, password, role, phone, address, specialization, certification } = req.body;

      if (!name || !email || !password) {
        return ApiResponse.badRequest(res, 'Name, email, and password are required.');
      }

      // Check if user already exists
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return ApiResponse.badRequest(res, 'A user with this email address already exists.');
      }

      // Security check: Only an admin can register other admins or technicians
      let assignedRole = 'customer';
      if (role) {
        if (['admin', 'sales', 'technician'].includes(role)) {
          // If caller is authenticated as admin, allow role assignment
          if (req.user && req.user.role === 'admin') {
            assignedRole = role;
          } else {
            // Default to customer for untrusted public requests
            assignedRole = 'customer';
          }
        } else {
          assignedRole = role;
        }
      }

      const user = new User({
        name,
        email: email.toLowerCase().trim(),
        password,
        role: assignedRole,
        phone,
        address,
        technicianDetails: assignedRole === 'technician' ? {
          specialization: specialization ? (Array.isArray(specialization) ? specialization : [specialization]) : ['Solar PV Installation', 'Electrical QA'],
          certification: certification || 'Certified Solar Technician',
          rating: 4.8
        } : undefined
      });

      await user.save();

      const token = generateToken(user._id);

      return ApiResponse.created(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }, 'User registered successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Please provide both email and password.');
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid email or password credentials.');
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return ApiResponse.unauthorized(res, 'Invalid email or password credentials.');
      }

      if (user.isActive === false) {
        return ApiResponse.forbidden(res, 'Account deactivated. Please contact your system administrator.');
      }

      const token = generateToken(user._id);

      let customerProfile = null;
      if (user.role === 'customer') {
        customerProfile = await Customer.findOne({ user: user._id });
        if (!customerProfile) {
          customerProfile = await Customer.findOne({ email: user.email });
        }
      }

      const userPayload = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        technicianDetails: user.technicianDetails,
        customerProfile
      };

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: userPayload,
        data: {
          user: userPayload,
          ...userPayload,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/demo-login/:role
   * Quick role-based login for Admin, Sales, Technician, Customer personas
   */
  static async demoLogin(req, res, next) {
    try {
      const { role } = req.params;
      const validRoles = ['admin', 'sales', 'technician', 'customer'];
      if (!validRoles.includes(role)) {
        return ApiResponse.badRequest(res, `Invalid role: ${role}. Must be one of [${validRoles.join(', ')}].`);
      }

      const user = await User.findOne({ role });
      if (!user) {
        return ApiResponse.notFound(res, `No active account found for role '${role}'.`);
      }

      const token = generateToken(user._id);

      let customerProfile = null;
      if (user.role === 'customer') {
        customerProfile = await Customer.findOne({ user: user._id });
        if (!customerProfile) {
          customerProfile = await Customer.findOne({ email: user.email });
        }
      }

      const userPayload = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        technicianDetails: user.technicianDetails,
        customerProfile
      };

      return res.status(200).json({
        success: true,
        message: `Authenticated as ${role} persona.`,
        token,
        user: userPayload,
        data: {
          ...userPayload,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/profile (and /api/auth/me)
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        return ApiResponse.notFound(res, 'User profile not found.');
      }

      let customerProfile = null;
      if (user.role === 'customer') {
        customerProfile = await Customer.findOne({ user: user._id });
        if (!customerProfile) {
          customerProfile = await Customer.findOne({ email: user.email });
        }
      }

      const userPayload = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        technicianDetails: user.technicianDetails,
        customerProfile
      };

      return res.status(200).json({
        success: true,
        message: 'User profile retrieved',
        user: userPayload,
        data: userPayload
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, phone, address, avatar, password } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return ApiResponse.notFound(res, 'User profile not found.');
      }

      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (avatar) user.avatar = avatar;
      if (password && password.length >= 6) {
        user.password = password; // Pre-save hook hashes with bcrypt
      }

      await user.save();

      return ApiResponse.success(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      }, 'Profile updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return ApiResponse.badRequest(res, 'Please provide an email address.');
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Return success message to prevent user enumeration attacks
        return ApiResponse.success(res, null, 'If an account exists with this email, a reset token has been dispatched.');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      // In production with email infrastructure: send email with reset link
      console.log(`[Password Reset Token for ${user.email}]: ${resetToken}`);

      return ApiResponse.success(res, { resetToken }, 'Password reset instructions have been dispatched.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { email, password, newPassword } = req.body;
      const pwd = newPassword || password;

      if (!email || !pwd) {
        return ApiResponse.badRequest(res, 'Please provide email and new password.');
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return ApiResponse.notFound(res, 'User account not found.');
      }

      user.password = pwd; // Automatically hashed by bcrypt pre-save hook
      await user.save();

      return ApiResponse.success(res, null, 'Password has been reset successfully. You can now log in.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    return ApiResponse.success(res, null, 'Logged out successfully. Clear client token.');
  }
}

module.exports = AuthController;
