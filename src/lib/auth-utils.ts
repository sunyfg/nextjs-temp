import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const MANAGE_USERS_ROLES = ["admin", "editor"] as const;

/**
 * Fetch the current authenticated user's role from the database.
 * Returns `null` if not logged in or user not found.
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
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
