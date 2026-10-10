// Role model: superadmin > admin > analyst (reporters are a separate, public tier).
// These helpers only decide what the UI offers. The backend must enforce the same rules.
export const ROLE_LABEL = { superadmin: 'Super admin', admin: 'Admin', analyst: 'Analyst', reporter: 'Reporter' };
export const STAFF_ROLES = ['superadmin', 'admin', 'analyst'];
export const isStaffRole = (r) => STAFF_ROLES.includes(r);
export const canManageTeam = (r) => r === 'admin' || r === 'superadmin';

// Roles the signed-in person may give to a NEW account.
export const creatableRoles = (actorRole) => (actorRole === 'superadmin' ? ['admin', 'analyst'] : actorRole === 'admin' ? ['analyst'] : []);

// Roles the signed-in person may switch an EXISTING account to. Only a super admin changes roles;
// nobody changes their own role, and super admin accounts are never edited from the app.
export function assignableRoles(actor, target) {
  if (!actor || !target || target.id === actor.id || target.role === 'superadmin') return [];
  return actor.role === 'superadmin' ? ['admin', 'analyst'] : [];
}
