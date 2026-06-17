"use client";

import { useSession } from "next-auth/react";

export function usePermission() {
  const { data: session } = useSession();

  const permissions = session?.user?.permissionCodes ?? [];
  const roles = session?.user?.roleCodes ?? [];

  function hasPermission(code: string) {
    if (roles.includes("super_admin")) {
      return true;
    }
    return permissions.includes(code);
  }

  function hasAnyPermission(codes: string[]) {
    if (roles.includes("super_admin")) {
      return true;
    }
    return codes.some((code) => permissions.includes(code));
  }

  function hasAllPermissions(codes: string[]) {
    if (roles.includes("super_admin")) {
      return true;
    }
    return codes.every((code) => permissions.includes(code));
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
