/**
 * Client Role Constants
 */

export const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  STAFF: 'staff',
  ADMIN: 'admin',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.CITIZEN]: 'Citizen',
  [ROLES.STAFF]: 'Field Staff',
  [ROLES.ADMIN]: 'Administrator',
});

export const ROLE_PATHS = Object.freeze({
  [ROLES.CITIZEN]: '/citizen',
  [ROLES.STAFF]: '/staff/route',
  [ROLES.ADMIN]: '/admin',
});

