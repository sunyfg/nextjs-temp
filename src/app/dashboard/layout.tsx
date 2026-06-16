import Link from "next/link";
import { getCurrentUser, MANAGE_USERS_ROLES, MANAGE_ROLES_ROLES, MANAGE_PERMISSIONS_ROLES } from "@/lib/auth-utils";
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

  const navItems = [
    { href: "/dashboard", label: "数据分析" },
    ...(canManageUsers ? [{ href: "/dashboard/users", label: "用户管理" }] : []),
    ...(canManageRoles
      ? [
          { href: "/dashboard/roles", label: "角色管理" },
          ...(canManagePermissions ? [{ href: "/dashboard/permissions", label: "权限管理" }] : []),
        ]
      : []),
    { href: "/dashboard/settings", label: "系统设置" },
  ];

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <UserMenu user={user} />
          </div>
        )}
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
