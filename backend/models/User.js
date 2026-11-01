const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Please provide user name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide user email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'sales', 'technician', 'customer'],
      default: 'customer'
    },
    department: {
      type: String,
      trim: true,
      default: 'Operations'
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_approval', 'rejected'],
      default: 'active'
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    passwordResetOtpHash: {
      type: String,
      select: false
    },
    passwordResetOtpExpires: Date,
    passwordResetOtpAttempts: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDetails: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
      },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      requestDate: { type: Date, default: Date.now },
      reviewDate: Date,
      rejectionReason: String,
      notes: String
    },
    // Technician specific metadata
    technicianDetails: {
      specialization: [String],
      rating: { type: Number, default: 4.8 },
      totalJobsCompleted: { type: Number, default: 0 },
      activeJobsCount: { type: Number, default: 0 },
      certification: String
    }
  },
  { timestamps: true }
);

// Auto-generate userId if not provided
UserSchema.pre('validate', function (next) {
  if (!this.userId) {
    const prefix = this.role ? this.role.substring(0, 3).toUpperCase() : 'USR';
    this.userId = `${prefix}-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
