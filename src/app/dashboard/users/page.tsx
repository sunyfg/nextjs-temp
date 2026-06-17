import { redirect } from "next/navigation";
import { auth } from "@/auth";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <UsersClient />;
}
