import { redirect } from "next/navigation";
import { auth } from "@/auth";
import TagsClient from "./tags-client";

export const metadata = {
  title: "标签管理",
  description: "博客标签管理",
};

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <TagsClient />;
}
