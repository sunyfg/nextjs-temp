import { redirect } from "next/navigation";
import { auth } from "@/auth";
import FilesClient from "./files-client";

export const metadata = {
  title: "文件管理",
  description: "上传文件管理",
};

export default async function FilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return <FilesClient />;
}
