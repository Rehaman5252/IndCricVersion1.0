// admin-credentials.ts
// Central store of built-in admin credentials + exported AdminSession type.

export interface AdminSession {
  email: string;
  displayName: string;
  role: string; // e.g. 'superadmin' | 'quiz_manager' | 'submissions_moderator'
  permissions: string[]; // e.g. ['*'] or ['quiz:create','quiz:view']
  userId?: string;
}

// Hard-coded credentials (for local/dev use only).
// Do NOT use this in production — replace with a secure auth system.
export const ADMIN_CREDENTIALS = {
  superadmin: {
    email: "rehamansyed07@gmail.com",
    password: "Indcric@100",
    displayName: "Rehaman Syed",
    role: "superadmin",
    permissions: ["*"],
  },
  subadmins: [
    {
      email: "rahul@indcric.com",
      password: "Rahul@123",
      displayName: "Rahul Kumar",
      role: "quiz_manager",
      permissions: ["quiz:create", "quiz:edit", "quiz:delete"],
    },
    {
      email: "admin@indcric.com",
      password: "Admin@123",
      displayName: "Admin User",
      role: "submissions_moderator",
      permissions: ["submissions:approve", "submissions:reject"],
    },
  ],
};

/**
 * Convenience helper: validate credentials and return an AdminSession (or null).
 * Use this for a local/dev login flow. This is synchronous and simple.
 */
export function validateAdminCredentials(email: string, password: string): AdminSession | null {
  if (
    email === ADMIN_CREDENTIALS.superadmin.email &&
    password === ADMIN_CREDENTIALS.superadmin.password
  ) {
    const s = ADMIN_CREDENTIALS.superadmin;
    return {
      email: s.email,
      displayName: s.displayName,
      role: s.role,
      permissions: s.permissions,
    };
  }

  const found = ADMIN_CREDENTIALS.subadmins.find(
    (a) => a.email === email && a.password === password
  );

  if (found) {
    return {
      email: found.email,
      displayName: found.displayName,
      role: found.role,
      permissions: found.permissions,
    };
  }

  return null;
}
