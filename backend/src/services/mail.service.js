let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  // Optional fallback if nodemailer is not yet installed in node_modules
}

let cachedTransport = null;
let lastConfigHash = '';

function smtpConfigured() {
  return Boolean(nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (!smtpConfigured()) return null;
  const currentHash = `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}:${process.env.SMTP_USER}:${process.env.SMTP_PASS}`;
  if (cachedTransport && lastConfigHash === currentHash) return cachedTransport;

  lastConfigHash = currentHash;
  const rawPass = (process.env.SMTP_PASS || '').trim();
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: rawPass
    }
  });

  return cachedTransport;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'SunPower Solutions <noreply@sunpowersolutions.com>';
  const transporter = getTransport();

  if (!transporter) {
    console.warn(`[SMTP not configured] To: ${to} | ${subject}\n${text || ''}`);
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log(`[SMTP sent] To: ${to} | ID: ${info?.messageId || 'ok'}`);
    return { delivered: true, messageId: info?.messageId };
  } catch (err) {
    console.error(`[SMTP send error to ${to}]:`, err.message);
    return { delivered: false, reason: 'smtp_send_error', error: err.message };
  }
}

async function sendPasswordResetOtp({ to, name, otp }) {
  const subject = 'SunPower Solutions password reset code';
  const text = `Hello ${name || 'there'},\n\nYour SunPower Solutions password reset code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:16px">
      <h2 style="color:#f59e0b;margin:0 0 12px">SunPower Solutions</h2>
      <p>Hello ${name || 'there'},</p>
      <p>Use this one-time code to reset your account password:</p>
      <p style="font-size:28px;letter-spacing:8px;font-weight:700;color:#f8fafc;background:#1e293b;padding:16px 20px;border-radius:12px;text-align:center">${otp}</p>
      <p style="color:#94a3b8;font-size:13px">This code expires in 10 minutes. If you did not request a reset, you can ignore this email.</p>
    </div>
  `;
  return sendMail({ to, subject, html, text });
}

module.exports = {
  smtpConfigured,
  sendMail,
  sendPasswordResetOtp
};
