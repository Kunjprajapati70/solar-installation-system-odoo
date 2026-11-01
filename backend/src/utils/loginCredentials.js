const User = require('../../models/User');

const USER_ID_PATTERN = /^[A-Za-z0-9._-]{4,32}$/;

function normalizeUserId(userId) {
  return String(userId || '').trim();
}

function validateUserId(userId) {
  const id = normalizeUserId(userId);
  if (!id) return 'User ID is required.';
  if (!USER_ID_PATTERN.test(id)) {
    return 'User ID must be 4–32 characters using letters, numbers, dot, underscore, or hyphen.';
  }
  return null;
}

function validatePassword(password) {
  if (!password || String(password).length < 6) {
    return 'Password is required and must be at least 6 characters.';
  }
  return null;
}

async function assertUniqueLogin({ userId, email, excludeUserId }) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanUserId = normalizeUserId(userId);

  const emailQuery = { email: cleanEmail };
  const userIdQuery = { userId: new RegExp(`^${cleanUserId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  if (excludeUserId) {
    emailQuery._id = { $ne: excludeUserId };
    userIdQuery._id = { $ne: excludeUserId };
  }

  const [emailHit, idHit] = await Promise.all([
    User.findOne(emailQuery).select('_id email'),
    User.findOne(userIdQuery).select('_id userId')
  ]);

  if (emailHit) {
    const err = new Error('A user with this email address already exists.');
    err.statusCode = 400;
    throw err;
  }
  if (idHit) {
    const err = new Error('This User ID is already taken. Choose a different login ID.');
    err.statusCode = 400;
    throw err;
  }
}

module.exports = {
  normalizeUserId,
  validateUserId,
  validatePassword,
  assertUniqueLogin
};
