import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/tags/[id] - 更新标签
 * @auth 需要登录（401）
 * @param id - 标签 ID（路径参数）
 * @body name (string) - 标签名称（可选）
 * @body slug (string) - 标签别名（可选，重复返回 409）
 * @throws 404 - 标签不存在
 * @returns { code: 0, message: "标签更新成功", data: Tag }
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
  const tagId = Number(id);

  if (isNaN(tagId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!existing) {
    return Response.json({ code: 404, message: "标签不存在" });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name) {
      return Response.json({ code: 400, message: "name is required" });
    }
    data.name = body.name;
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== "string" || !body.slug) {
      return Response.json({ code: 400, message: "slug is required" });
    }
    if (body.slug !== existing.slug) {
      const slugExists = await prisma.tag.findUnique({ where: { slug: body.slug } });
      if (slugExists) {
        return Response.json({ code: 409, message: "slug 已存在" });
      }
    }
    data.slug = body.slug;
  }

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data,
  });

  return Response.json({ code: 0, message: "标签更新成功", data: tag });
}

/**
 * DELETE /api/admin/tags/[id] - 删除标签
 * @auth 需要登录（401）
 * @param id - 标签 ID（路径参数）
 * @throws 404 - 标签不存在
 * @throws 400 - 标签下有文章，无法删除
 * @returns { code: 0, message: "标签删除成功" }
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
  const tagId = Number(id);

  if (isNaN(tagId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!existing) {
    return Response.json({ code: 404, message: "标签不存在" });
  }

  // Check if tag has associated posts
  const postCount = await prisma.postTag.count({ where: { tagId } });
  if (postCount > 0) {
    return Response.json({ code: 400, message: `该标签下有 ${postCount} 篇文章，无法删除` });
  }

  await prisma.tag.delete({ where: { id: tagId } });

  return Response.json({ code: 0, message: "标签删除成功" });
}
