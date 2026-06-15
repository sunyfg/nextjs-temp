import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUserRole(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role ?? null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentUserRole();
  const canManageUsers = role === "admin" || role === "editor";

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    ...(canManageUsers ? [{ href: "/dashboard/users", label: "Users" }] : []),
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <nav className="flex flex-col gap-2">
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
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
