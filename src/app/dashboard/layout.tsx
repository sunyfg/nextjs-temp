import Link from "next/link";
import { getCurrentUser, MANAGE_USERS_ROLES } from "@/lib/auth-utils";
import UserMenu from "./user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const canManageUsers = user !== null && (MANAGE_USERS_ROLES as readonly string[]).includes(user.role);

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    ...(canManageUsers ? [{ href: "/dashboard/users", label: "Users" }] : []),
    { href: "/dashboard/settings", label: "Settings" },
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
