import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PermissionsClient from "./permissions-client";

export default async function PermissionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <PermissionsClient />;
}
