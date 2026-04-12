/**
 * Shared Decimal math utilities for fee and payment calculations.
 * Uses decimal.js to avoid JavaScript float precision errors.
 * Import this wherever financial arithmetic is performed.
 */
const Decimal = require('decimal.js');

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert any value to a Decimal instance.
 * Null / undefined / empty string → Decimal(0).
 */
const toDecimal = (v) => new Decimal(v == null || v === '' ? 0 : v);

/**
 * Round a value to 2 decimal places and return a Decimal.
 * Use this for storing/comparing monetary values.
 */
const money = (v) => toDecimal(v).toDecimalPlaces(2);

/**
 * Calculate total discount for a fee given a list of scholarship objects.
 * Scholarships are applied in order; discount is capped at originalAmount.
 *
 * @param {Decimal|number|string} originalAmount
 * @param {Array<{type: 'fixed'|'percentage', value: any}>} scholarships
 * @returns {Decimal} rounded discount amount
 */
const applyDiscounts = (originalAmount, scholarships) => {
  const base = money(originalAmount);
  let discount = new Decimal(0);

  for (const s of scholarships) {
    if (s.type === 'percentage') {
      discount = discount.add(base.mul(toDecimal(s.value)).div(100));
    } else {
      discount = discount.add(toDecimal(s.value));
    }
  }

  // Discount cannot exceed the original amount
  return money(Decimal.min(discount, base));
};

module.exports = { Decimal, toDecimal, money, applyDiscounts };
