import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const MANAGE_USERS_ROLES = ['admin', 'editor'] as const;

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

/**
 * Fetch the current authenticated user from the database.
 * Returns `null` if not logged in or user not found.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  console.log('🚀 ~ getCurrentUser ~ session:', session);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log('🚀 ~ getCurrentUser ~ user:', user);
  return user;
}

/**
 * Fetch the current authenticated user's role from the database.
 * Returns `null` if not logged in or user not found.
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Check whether the current user's role is in the allowed list.
 * Returns `{ authorized, role }`.
 */
export async function authorizeByRole(
  allowedRoles: readonly string[],
): Promise<{ authorized: boolean; role: string | null }> {
  const role = await getCurrentUserRole();
  return { authorized: role !== null && allowedRoles.includes(role), role };
}
