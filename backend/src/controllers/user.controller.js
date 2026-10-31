const User = require('../../models/User');
const ApiResponse = require('../utils/apiResponse');

class UserController {
  static async listUsers(req, res, next) {
    try {
      const { role } = req.query;
      const query = {};
      if (role) query.role = role;

      const users = await User.find(query).select('-password').sort({ createdAt: -1 });
      return ApiResponse.success(res, users);
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req, res, next) {
    try {
      const { name, email, password, role, phone, address, technicianDetails } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return ApiResponse.badRequest(res, 'User already exists with this email.');
      }

      const user = new User({
        name,
        email: email.toLowerCase().trim(),
        password: password || 'SunPower@2026',
        role: role || 'sales',
        phone,
        address,
        technicianDetails
      });

      await user.save();
      return ApiResponse.created(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }, 'User account created.');
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found.');
      }

      const { name, phone, address, role, isActive, password, technicianDetails } = req.body;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
      if (technicianDetails) user.technicianDetails = technicianDetails;
      if (password && password.length >= 6) user.password = password;

      await user.save();
      return ApiResponse.success(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }, 'User updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found.');
      }

      await User.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'User deleted.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
