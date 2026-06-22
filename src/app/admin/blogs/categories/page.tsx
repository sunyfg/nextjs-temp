import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CategoriesClient from "./categories-client";

export const metadata = {
  title: "分类管理",
  description: "博客分类管理",
};

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <CategoriesClient />;
}
