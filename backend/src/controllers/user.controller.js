const User = require('../../models/User');
const ApprovalRequest = require('../../models/ApprovalRequest');
const Notification = require('../../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const {
  normalizeUserId,
  validateUserId,
  validatePassword,
  assertUniqueLogin
} = require('../utils/loginCredentials');

class UserController {
  /**
   * GET /api/users
   */
  static async listUsers(req, res, next) {
    try {
      const { role, department, status, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (role) query.role = role;
      if (department) query.department = department;
      if (status) query.status = status;
      if (req.user.role === 'sales') {
        query.role = { $ne: 'admin' };
        if (role && role !== 'admin') query.role = role;
        else if (role === 'admin') query.role = '__none__';
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .populate('createdBy', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(query)
      ]);

      return ApiResponse.success(res, users, 'Users retrieved', 200, {
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
   * POST /api/users
   * Admin direct user creation or Sales employee pending user request
   */
  static async createUser(req, res, next) {
    try {
      const {
        name,
        email,
        userId,
        password,
        role = 'sales',
        department,
        phone,
        address,
        technicianDetails,
        mustChangePassword = true
      } = req.body;

      if (!name || !email) {
        return ApiResponse.badRequest(res, 'Name and email are required.');
      }

      const cleanEmail = email.toLowerCase().trim();
      const assignedUserId = normalizeUserId(userId);

      // Check if caller is Sales Employee
      if (req.user.role === 'sales') {
        if (role === 'admin') {
          return ApiResponse.forbidden(res, 'Security Policy: Sales employees cannot create or request Administrator accounts.');
        }

        // Create pending Approval Request
        const approvalReq = new ApprovalRequest({
          requestType: 'user_creation',
          title: `New User Request: ${name} (${role.toUpperCase()})`,
          description: `Sales Representative ${req.user.name} submitted request to onboard new ${role}.`,
          payload: {
            name,
            email: cleanEmail,
            userId: assignedUserId || undefined,
            password: password || undefined,
            role,
            department: department || (role === 'technician' ? 'Field Engineering' : 'Sales & Marketing'),
            phone,
            address,
            technicianDetails
          },
          requestedBy: req.user._id,
          requestedByName: req.user.name,
          requestedByRole: req.user.role,
          status: 'pending'
        });

        await approvalReq.save();

        await Notification.create({
          targetRole: 'admin',
          title: `Pending user request ${approvalReq.requestNumber}`,
          message: `${req.user.name} requested a ${role} account for ${name} (${cleanEmail}).`,
          type: 'approval_request',
          link: '/approvals'
        });

        return ApiResponse.created(res, {
          requestId: approvalReq._id,
          requestNumber: approvalReq.requestNumber,
          status: 'pending_approval'
        }, 'User request submitted. Awaiting Administrator approval.');
      }

      const userIdError = validateUserId(assignedUserId);
      const passwordError = validatePassword(password);
      if (userIdError) return ApiResponse.badRequest(res, userIdError);
      if (passwordError) return ApiResponse.badRequest(res, passwordError);

      try {
        await assertUniqueLogin({ userId: assignedUserId, email: cleanEmail });
      } catch (dupErr) {
        return ApiResponse.badRequest(res, dupErr.message);
      }

      const initialPassword = password;

      const user = new User({
        userId: assignedUserId,
        name,
        email: cleanEmail,
        password: initialPassword,
        role,
        department: department || (role === 'technician' ? 'Field Engineering' : role === 'sales' ? 'Sales & Marketing' : 'Management'),
        phone,
        address,
        technicianDetails,
        mustChangePassword: Boolean(mustChangePassword),
        status: 'active',
        isActive: true,
        createdBy: req.user._id,
        approvalDetails: {
          status: 'approved',
          reviewedBy: req.user._id,
          reviewDate: new Date(),
          notes: 'Direct account provisioning by Administrator'
        }
      });

      await user.save();

      await Notification.create({
        recipient: user._id,
        title: 'Temporary login issued',
        message: `Account ${user.userId} is active. Sign in with your User ID or email, then replace the temporary password on first login. Credentials are shown once to the administrator and are not emailed in plaintext.`,
        type: 'credentials',
        link: '/profile'
      });

      return ApiResponse.created(res, {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        initialPassword,
        temporaryPassword: initialPassword,
        mustChangePassword: user.mustChangePassword,
        status: user.status,
        deliveryMethod: 'admin_secure_handoff'
      }, `User account ${user.userId} created successfully.`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/users/:id
   */
  static async updateUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found.');
      }

      const { name, phone, address, role, department, status, isActive, password, technicianDetails, mustChangePassword } = req.body;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (role) user.role = role;
      if (department) user.department = department;
      if (status) {
        user.status = status;
        user.isActive = status === 'active';
      }
      if (isActive !== undefined) {
        user.isActive = isActive;
        user.status = isActive ? 'active' : 'inactive';
      }
      if (mustChangePassword !== undefined) user.mustChangePassword = mustChangePassword;
      if (technicianDetails) user.technicianDetails = technicianDetails;
      if (password && password.length >= 6) user.password = password;

      await user.save();
      return ApiResponse.success(res, {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword
      }, 'User updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/users/:id
   */
  static async deleteUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found.');
      }

      if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
        return ApiResponse.forbidden(res, 'Cannot delete the last remaining Administrator account.');
      }

      await User.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'User account deleted.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
