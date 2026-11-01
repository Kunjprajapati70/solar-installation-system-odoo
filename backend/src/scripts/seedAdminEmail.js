const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../../models/User');

async function syncAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const targetEmail = (process.env.SMTP_USER || 'adminpayroll360@gmail.com').toLowerCase().trim();

  let u = await User.findOne({ email: targetEmail });
  if (!u) {
    u = new User({
      userId: 'ADM-PAYROLL',
      name: 'System Administrator',
      email: targetEmail,
      password: 'Admin@2026Payroll!',
      role: 'admin',
      department: 'Executive Administration',
      phone: '+91 9876543210',
      status: 'active',
      isActive: true,
      mustChangePassword: false
    });
    await u.save();
    console.log(`✓ Created Admin user account for ${targetEmail}`);
  } else {
    console.log(`✓ User account for ${targetEmail} already exists (role: ${u.role})`);
  }
  await mongoose.disconnect();
}

syncAdmin().catch(console.error);
