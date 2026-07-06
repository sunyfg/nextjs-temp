import { prisma } from "@/lib/prisma";

/**
 * 获取公开博客文章详情（支持数字 ID 或 slug 查询）
 * 同时递增文章浏览次数
 *
 * @param id - 文章数字 ID 或 slug（路径参数）
 * @returns { code: 0, message: "success", data: Post }
 * @throws { code: 404, message: "Post not found" }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const postId = Number(id);
  const isNumeric = !isNaN(postId) && String(postId) === id;

  const where = isNumeric
    ? { id: postId, status: "PUBLISHED" as const, deletedAt: null }
    : { slug: id, status: "PUBLISHED" as const, deletedAt: null };

  const post = await prisma.post.findFirst({
    where: where as never,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
      author: { select: { id: true, username: true, displayName: true } },
    },
  });

  if (!post) {
    return Response.json({ code: 404, message: "Post not found" });
  }

  // Increment view count
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return Response.json({
    code: 0,
    message: "success",
    data: {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    },
  });
}
