import { getCurrentUser, MANAGE_USERS_ROLES, MANAGE_ROLES_ROLES, MANAGE_PERMISSIONS_ROLES } from "@/lib/auth-utils";
import SidebarNav from "./sidebar-nav";
import type { NavItem } from "./sidebar-nav";
import UserMenu from "./user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const roleCodes = user?.roleCodes ?? [];
  const isSuperAdmin = roleCodes.includes("super_admin");
  const canManageUsers = isSuperAdmin || roleCodes.some((r) => (MANAGE_USERS_ROLES as readonly string[]).includes(r));
  const canManageRoles = isSuperAdmin || roleCodes.some((r) => (MANAGE_ROLES_ROLES as readonly string[]).includes(r));
  const canManagePermissions = isSuperAdmin || roleCodes.some((r) => (MANAGE_PERMISSIONS_ROLES as readonly string[]).includes(r));

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "数据分析" },
    ...((canManageUsers || canManageRoles || canManagePermissions)
      ? [
          {
            label: "系统管理",
            children: [
              ...(canManageUsers ? [{ href: "/dashboard/users", label: "用户管理" }] : []),
              ...(canManageRoles ? [{ href: "/dashboard/roles", label: "角色管理" }] : []),
              ...(canManagePermissions ? [{ href: "/dashboard/permissions", label: "权限管理" }] : []),
            ],
          },
        ]
      : []),
    { href: "/dashboard/settings", label: "系统设置" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <SidebarNav items={navItems} />
        {user && (
          <div className="mt-auto border-t border-zinc-200 p-3 dark:border-zinc-800">
            <UserMenu user={user} />
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
