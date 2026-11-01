const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const nodemailer = require('nodemailer');

async function testSmtp() {
  console.log('==============================================');
  console.log('SunPower Solutions SMTP Verification Test');
  console.log('==============================================');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '587');
  console.log('SMTP_USER:', process.env.SMTP_USER || '(not set)');
  console.log('SMTP_FROM:', process.env.SMTP_FROM || '(not set)');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('\n✗ Incomplete SMTP settings in backend/.env.');
    console.error('Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
    process.exit(1);
  }

  const rawPass = (process.env.SMTP_PASS || '').trim();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: rawPass
    }
  });

  try {
    console.log('\nConnecting and authenticating with mail server...');
    await transporter.verify();
    console.log('✓ SMTP server connection and authentication successful!');

    const targetRecipient = process.env.SMTP_USER;
    console.log(`Sending diagnostic verification email to ${targetRecipient}...`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: targetRecipient,
      subject: 'SunPower Solutions SMTP Diagnostic Success',
      text: 'Congratulations! Your SMTP settings are properly configured and emails can be dispatched reliably.'
    });

    console.log(`✓ Email delivered successfully! Message ID: ${info.messageId}`);
    console.log('==============================================');
    console.log('SMTP STATUS: OPERATIONAL & READY');
    console.log('==============================================');
  } catch (err) {
    console.error('\n✗ SMTP Error:', err.message);
    if (err.response) console.error('Server response:', err.response);
    process.exit(1);
  }
}

testSmtp();
