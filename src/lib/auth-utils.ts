import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const MANAGE_USERS_ROLES = ['admin', 'editor'] as const;
export const MANAGE_ROLES_ROLES = ['admin'] as const;
export const MANAGE_PERMISSIONS_ROLES = ['admin'] as const;

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  roleCodes: string[];
};

/**
 * Fetch the current authenticated user with their role codes.
 * Returns `null` if not logged in or user not found.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      userRoles: {
        select: { role: { select: { roleCode: true } } },
      },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleCodes: user.userRoles.map((ur) => ur.role.roleCode),
  };
}

/**
 * Fetch the current authenticated user's role codes.
 * Returns `null` if not logged in.
 */
export async function getCurrentUserRoleCodes(): Promise<string[] | null> {
  const user = await getCurrentUser();
  return user?.roleCodes ?? null;
}

/**
 * Check whether the current user has any of the allowed roles.
 * Super admin bypasses all permission checks.
 * Returns `{ authorized, roleCodes }`.
 */
export async function authorizeByRole(
  allowedRoleCodes: readonly string[],
): Promise<{ authorized: boolean; roleCodes: string[] | null }> {
  const roleCodes = await getCurrentUserRoleCodes();
  if (roleCodes === null) return { authorized: false, roleCodes: null };
  if (roleCodes.includes('super_admin')) return { authorized: true, roleCodes };
  return {
    authorized: roleCodes.some((r) => allowedRoleCodes.includes(r)),
    roleCodes,
  };
}

/**
 * Check whether the current user has the 'admin' role (for delete operations etc.).
 * Super admin also qualifies.
 */
export async function isAdmin(): Promise<boolean> {
  const roleCodes = await getCurrentUserRoleCodes();
  if (roleCodes === null) return false;
  return roleCodes.includes('admin') || roleCodes.includes('super_admin');
}
