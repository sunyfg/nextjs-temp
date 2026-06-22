import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EditClient from "./edit-client";

export const metadata = {
  title: "编辑文章",
  description: "编辑博客文章",
};

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const isNew = id === "new";

  let initialData: Record<string, unknown> | null = null;

  if (!isNew) {
    const postId = Number(id);
    if (isNaN(postId)) notFound();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        category: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    if (!post || post.deletedAt) notFound();

    initialData = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary ?? "",
      coverImage: post.coverImage ?? "",
      content: post.content,
      status: post.status,
      isTop: post.isTop,
      isRecommend: post.isRecommend,
      categoryId: post.categoryId ?? null,
      tagIds: post.tags.map((pt) => pt.tag.id),
      seoTitle: post.seoTitle ?? "",
      seoKeywords: post.seoKeywords ?? "",
      seoDescription: post.seoDescription ?? "",
      publishedAt: post.publishedAt?.toISOString() ?? null,
    };
  }

  const categories = await prisma.category.findMany({
    where: { visible: true },
    orderBy: [{ sort: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const tags = await prisma.tag.findMany({
    orderBy: { id: "desc" },
    select: { id: true, name: true },
  });

  return (
    <EditClient
      initialData={initialData}
      isNew={isNew}
      categories={categories}
      tags={tags}
    />
  );
}
