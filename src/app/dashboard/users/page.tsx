import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { authorizeByRole, MANAGE_USERS_ROLES } from "@/lib/auth-utils";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { authorized } = await authorizeByRole(MANAGE_USERS_ROLES);
  if (!authorized) {
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
