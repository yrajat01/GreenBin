/**
 * GreenBin System Constants
 * Defines role definitions, bin statuses, and issue categories.
 */

const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  STAFF: 'staff',
  ADMIN: 'admin',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

const BIN_STATUS = Object.freeze({
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  SMELL_REPORTED: 'smell_reported',
});

const REPORT_STATUS = Object.freeze({
  PENDING: 'pending',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
});

const ISSUE_TYPES = Object.freeze([
  'Foul Smell',
  'Overflowing',
  'Damaged Bin',
  'Vandalism',
  'Other',
]);

const ZONES = Object.freeze(['Zone-A', 'Zone-B', 'Zone-C']);

module.exports = {
  ROLES,
  ALL_ROLES,
  BIN_STATUS,
  REPORT_STATUS,
  ISSUE_TYPES,
  ZONES,
};

