/**
 * Currency Utility
 * Handles consistent money representation:
 * - Internal arithmetic in integer paise (1 INR = 100 paise) to prevent floating point inaccuracies.
 * - Conversion to rupees with 2 decimal places for API display.
 */

const rupeesToPaise = (rupees) => {
  if (rupees === null || rupees === undefined || isNaN(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
};

const paiseToRupees = (paise) => {
  if (paise === null || paise === undefined || isNaN(paise)) return 0;
  return Number((Number(paise) / 100).toFixed(2));
};

const formatINR = (amountInRupees) => {
  const num = Number(amountInRupees) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
};

module.exports = {
  rupeesToPaise,
  paiseToRupees,
  formatINR
};
