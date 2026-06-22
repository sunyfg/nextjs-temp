import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BlogsClient from "./blogs-client";

export const metadata = {
  title: "博客管理",
  description: "博客文章管理",
};

export default async function BlogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <BlogsClient />;
}
