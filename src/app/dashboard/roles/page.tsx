import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { authorizeByRole, MANAGE_ROLES_ROLES } from "@/lib/auth-utils";
import RolesClient from "./roles-client";

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { authorized } = await authorizeByRole(MANAGE_ROLES_ROLES);
  if (!authorized) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="text-zinc-500 dark:text-zinc-400">
          您没有权限访问此页面
        </p>
      </div>
    );
  }

  return <RolesClient />;
}
