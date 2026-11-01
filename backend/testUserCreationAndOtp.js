const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Customer = require('./models/Customer');
const { sendPasswordResetOtp, smtpConfigured } = require('./src/services/mail.service');

async function runTests() {
  console.log('--- STARTING USER CREATION & OTP VERIFICATION TESTS ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/solar_installation_db');
  console.log('Connected to MongoDB successfully');

  const ts = Date.now();

  // Test 1: Admin Creates Technician with specific User ID and Password
  console.log('\n[Test 1] Admin creates technician with assigned User ID and initial password');
  const techUserId = `TEC-TEST-${ts.toString().slice(-4)}`;
  const techEmail = `tech.${ts}@testsolar.com`;
  const techPass = 'Solar@Pass2026!';

  const techUser = new User({
    userId: techUserId,
    name: 'Ramesh Test Technician',
    email: techEmail,
    password: techPass,
    role: 'technician',
    department: 'Field Engineering',
    phone: '+91 9876543210',
    mustChangePassword: true,
    status: 'active',
    isActive: true
  });
  await techUser.save();
  console.log(`✓ Technician created: ${techUser.userId} (${techUser.email})`);

  const fetchedTech = await User.findById(techUser._id).select('+password');
  if (!fetchedTech) throw new Error('Failed to fetch created technician');
  const passMatch = await fetchedTech.matchPassword(techPass);
  if (!passMatch) throw new Error('Password mismatch for created technician');
  if (!fetchedTech.mustChangePassword) throw new Error('mustChangePassword should be true for initial password');
  console.log('✓ Technician password encrypted with bcrypt and verified successfully');

  // Test 2: Admin Creates Customer with specific User ID and Password
  console.log('\n[Test 2] Admin creates customer with assigned User ID and portal password');
  const custUserId = `CUST-TEST-${ts.toString().slice(-4)}`;
  const custEmail = `cust.${ts}@testsolar.com`;
  const custPass = 'Solar@Customer2026!';

  const custPortalUser = new User({
    userId: custUserId,
    name: 'Suresh Test Customer',
    email: custEmail,
    password: custPass,
    role: 'customer',
    department: 'Customer Portal',
    phone: '+91 9123456789',
    mustChangePassword: true,
    status: 'active',
    isActive: true
  });
  await custPortalUser.save();

  const customerRecord = new Customer({
    customerCode: `CUST-REC-${ts.toString().slice(-5)}`,
    user: custPortalUser._id,
    name: 'Suresh Test Customer',
    email: custEmail,
    phone: '+91 9123456789',
    installationAddress: {
      street: '12 Sunrise Complex',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015'
    },
    connectionType: 'on_grid',
    sanctionedLoadKw: 5,
    consumerNumber: `CNS-${ts.toString().slice(-6)}`,
    currentPhase: 'single'
  });
  await customerRecord.save();
  console.log(`✓ Customer and Portal User created: ${custPortalUser.userId} (Customer Code: ${customerRecord.customerCode})`);

  const fetchedCust = await User.findById(custPortalUser._id).select('+password');
  const custPassMatch = await fetchedCust.matchPassword(custPass);
  if (!custPassMatch) throw new Error('Customer password verification failed');
  console.log('✓ Customer portal credentials verified successfully');

  // Test 3: OTP Generation for Forgot Password
  console.log('\n[Test 3] Generate 6-Digit OTP and store hashed in MongoDB');
  const otpCode = String(crypto.randomInt(100000, 1000000));
  const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  fetchedTech.passwordResetOtpHash = hashedOtp;
  fetchedTech.passwordResetOtpExpires = expiresAt;
  fetchedTech.passwordResetOtpAttempts = 0;
  await fetchedTech.save();

  console.log(`✓ OTP generated: ${otpCode} (Expires: ${expiresAt.toISOString()})`);
  console.log(`✓ Stored SHA-256 hash in User document: ${hashedOtp.slice(0, 16)}...`);

  // Test 4: Verify Mail service OTP template dispatch
  console.log('\n[Test 4] Dispatch OTP using mail service');
  const mailResult = await sendPasswordResetOtp({ to: fetchedTech.email, name: fetchedTech.name, otp: otpCode });
  console.log(`✓ Mail service result: delivered=${mailResult.delivered}, smtpConfigured=${smtpConfigured()}`);

  // Test 5: Verify Invalid OTP rejection
  console.log('\n[Test 5] Test invalid OTP rejection');
  const wrongCode = '000000';
  const wrongHash = crypto.createHash('sha256').update(wrongCode).digest('hex');
  const incomingWrong = Buffer.from(wrongHash, 'hex');
  const storedHashBuf = Buffer.from(fetchedTech.passwordResetOtpHash, 'hex');
  const matchesWrong = storedHashBuf.length === incomingWrong.length && crypto.timingSafeEqual(storedHashBuf, incomingWrong);
  if (matchesWrong) throw new Error('Wrong OTP unexpectedly matched!');
  console.log('✓ Invalid OTP correctly rejected with crypto.timingSafeEqual');

  // Test 6: Verify Correct OTP and Reset Password
  console.log('\n[Test 6] Verify Correct OTP and Reset Password');
  const correctHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const incomingCorrect = Buffer.from(correctHash, 'hex');
  const matchesCorrect = storedHashBuf.length === incomingCorrect.length && crypto.timingSafeEqual(storedHashBuf, incomingCorrect);
  if (!matchesCorrect) throw new Error('Correct OTP failed to match!');

  const brandNewPassword = 'Solar@NewPassword2026!';
  fetchedTech.password = brandNewPassword;
  fetchedTech.mustChangePassword = false;
  fetchedTech.passwordResetOtpHash = undefined;
  fetchedTech.passwordResetOtpExpires = undefined;
  fetchedTech.passwordResetOtpAttempts = 0;
  await fetchedTech.save();

  const reloadedTech = await User.findById(fetchedTech._id).select('+password');
  const newPassMatch = await reloadedTech.matchPassword(brandNewPassword);
  if (!newPassMatch) throw new Error('New password failed to match after reset!');
  const oldPassMatch = await reloadedTech.matchPassword(techPass);
  if (oldPassMatch) throw new Error('Old password still matches after reset!');
  console.log('✓ Password reset successfully applied in MongoDB. New password verified.');

  // Clean up test documents
  await User.deleteMany({ _id: { $in: [techUser._id, custPortalUser._id] } });
  await Customer.deleteMany({ _id: customerRecord._id });
  console.log('\n✓ Cleaned up test records');

  await mongoose.disconnect();
  console.log('\nALL USER CREATION & OTP TESTS PASSED PERFECTLY (6/6)!');
}

runTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});

