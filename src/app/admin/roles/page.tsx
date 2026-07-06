import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RolesClient from "./roles-client";

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <RolesClient />;
}
