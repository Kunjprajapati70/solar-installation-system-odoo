const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../../models/User');

async function syncAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const emails = [
    { email: 'kunjoza04@gmail.com', name: 'Kunj Prajapati', userId: 'ADM-KUNJ' },
    { email: 'adminpayroll360@gmail.com', name: 'System Administrator', userId: 'ADM-PAYROLL' }
  ];

  for (const item of emails) {
    let u = await User.findOne({ email: item.email });
    if (!u) {
      u = new User({
        userId: item.userId,
        name: item.name,
        email: item.email,
        password: 'Admin@2026Solar!',
        role: 'admin',
        department: 'Executive Administration',
        phone: '+91 9876543210',
        status: 'active',
        isActive: true,
        mustChangePassword: false
      });
      await u.save();
      console.log(`✓ Created Admin user account for ${item.email} (${item.userId})`);
    } else {
      console.log(`✓ User account for ${item.email} already exists (${u.userId || u.role})`);
    }
  }

  await mongoose.disconnect();
}

syncAdmin().catch(console.error);
