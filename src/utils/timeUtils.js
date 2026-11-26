/**
 * Common Duration & Working Hours Formatting Utility
 * Converts decimal hours to user-friendly "X hr Y min" / "X min" format consistently.
 */

/**
 * Format decimal hours into human readable hours and minutes format.
 * Examples:
 *  0.25 -> "15 min"
 *  0.50 -> "30 min"
 *  0.75 -> "45 min"
 *  0.79 -> "47 min"
 *  1.00 -> "1 hr"
 *  1.50 -> "1 hr 30 min"
 *  2.75 -> "2 hr 45 min"
 *  8.00 -> "8 hr"
 *
 * @param {number|string} hoursInput - Decimal hours (e.g. 0.79, 8.5)
 * @param {object} options - Configuration options
 * @returns {string} Formatted duration string
 */
export function formatDuration(hoursInput, options = {}) {
  const { fallback = '—', showZero = true } = options;

  if (hoursInput === null || hoursInput === undefined || hoursInput === '') {
    return fallback;
  }

  const num = parseFloat(hoursInput);
  if (isNaN(num) || num < 0) {
    return fallback;
  }

  if (num === 0) {
    return showZero ? '0 min' : fallback;
  }

  // Calculate total minutes rounded to nearest integer
  const totalMinutes = Math.round(num * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return showZero ? '0 min' : fallback;
  }

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

/**
 * Calculate duration between two timestamps and format as hours and minutes.
 * @param {string|Date} checkIn - Check-in ISO string or Date
 * @param {string|Date} checkOut - Check-out ISO string or Date
 * @returns {string} Formatted duration or fallback
 */
export function calculateDurationFromTimestamps(checkIn, checkOut, fallback = '—') {
  if (!checkIn || !checkOut) return fallback;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end.getTime() - start.getTime();

  if (isNaN(diffMs) || diffMs <= 0) {
    return fallback;
  }

  const decimalHours = diffMs / (1000 * 60 * 60);
  return formatDuration(decimalHours, { fallback });
}

export default {
  formatDuration,
  calculateDurationFromTimestamps
};
