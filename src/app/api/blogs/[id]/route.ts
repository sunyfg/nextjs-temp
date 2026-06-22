import { prisma } from "@/lib/prisma";

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
