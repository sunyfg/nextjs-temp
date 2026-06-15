import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !["admin", "editor"].includes(user.role)) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="text-zinc-500 dark:text-zinc-400">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <UsersClient />;
}
