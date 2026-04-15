const { addHours } = require('date-fns');

const SLA_CONFIG = {
  WATER: 48,
  ELECTRICITY: 24,
  ROADS: 168,
  GARBAGE: 72,
  PARKS: 240,
  PUBLIC_SAFETY: 12,
  OTHER: 96
};

exports.computeSlaDeadline = function(startTime, category) {
  const slaHours = SLA_CONFIG[category] || 72; // Default to OTHER
  return addHours(new Date(startTime), slaHours);
};

exports.getSlaRemainingPercent = function(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const remaining = deadlineDate.getTime() - now.getTime();
  if (remaining < 0) return 0;
  // This would typically involve total SLA time as a reference
  // But for simple visualization, assume max 7 days (168h) as base
  const total = 168 * 60 * 60 * 1000;
  return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
};
