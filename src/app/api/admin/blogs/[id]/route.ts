import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/blogs/[id] - 更新博客文章
 * @auth 需要登录（401）
 * @param id - 文章ID（路径参数）
 * @body title - 标题
 * @body slug - URL别名（唯一）
 * @body summary - 摘要
 * @body coverImage - 封面图
 * @body content - HTML内容
 * @body status - 状态（DRAFT/PUBLISHED/ARCHIVED）
 * @body isTop - 是否置顶
 * @body isRecommend - 是否推荐
 * @body categoryId - 分类ID
 * @body tagIds - 标签ID数组
 * @body authorId - 作者ID
 * @body seoTitle/seoKeywords/seoDescription - SEO信息
 * @returns { code: 0, data: Post }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    return Response.json({ code: 404, message: "文章不存在" });
  }

  const body = await request.json();

  if (body.title !== undefined && (typeof body.title !== "string" || !body.title)) {
    return Response.json({ code: 400, message: "title is required" });
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== "string" || !body.slug) {
      return Response.json({ code: 400, message: "slug is required" });
    }
    if (body.slug !== existing.slug) {
      const slugExists = await prisma.post.findUnique({ where: { slug: body.slug } });
      if (slugExists) {
        return Response.json({ code: 409, message: "slug 已存在" });
      }
    }
  }

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.summary !== undefined) data.summary = body.summary || null;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
  if (body.content !== undefined) {
    data.content = body.content;
    data.contentText = stripHtml(body.content).slice(0, 5000);
  }
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "PUBLISHED" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }
  if (body.isTop !== undefined) data.isTop = body.isTop === true;
  if (body.isRecommend !== undefined) data.isRecommend = body.isRecommend === true;
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle || null;
  if (body.seoKeywords !== undefined) data.seoKeywords = body.seoKeywords || null;
  if (body.seoDescription !== undefined) data.seoDescription = body.seoDescription || null;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId ? Number(body.categoryId) : null;
  if (body.authorId !== undefined) data.authorId = Number(body.authorId);

  // Handle tag updates
  if (Array.isArray(body.tagIds)) {
    await prisma.$transaction(async (tx) => {
      await tx.postTag.deleteMany({ where: { postId } });
      if (body.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: body.tagIds.map((tagId: number) => ({ postId, tagId })),
        });
      }
      await tx.post.update({ where: { id: postId }, data });
    });
  } else {
    await prisma.post.update({ where: { id: postId }, data });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      author: { select: { id: true, username: true, displayName: true } },
    },
  });

  return Response.json({
    code: 0,
    message: "文章更新成功",
    data: {
      ...post,
      tags: post?.tags.map((pt) => pt.tag),
    },
  });
}

/**
 * DELETE /api/admin/blogs/[id] - 删除博客文章（软删除）
 * @auth 需要登录（401）
 * @param id - 文章ID（路径参数）
 * @returns { code: 0, message: "文章删除成功" }
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    return Response.json({ code: 404, message: "文章不存在" });
  }

  // Soft delete
  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  return Response.json({ code: 0, message: "文章删除成功" });
}
