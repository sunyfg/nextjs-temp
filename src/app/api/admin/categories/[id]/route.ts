import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/categories/[id] - 更新分类
 * @auth 需要登录（401）
 * @param id - 分类 ID（路径参数，无效返回 400）
 * @body name (string) - 分类名称（可选）
 * @body slug (string) - 分类别名（可选，重复返回 409）
 * @body description (string) - 描述（可选）
 * @body sort (number) - 排序值（可选）
 * @body visible (boolean) - 是否可见（可选）
 * @throws 404 - 分类不存在
 * @returns { code: 0, message: "分类更新成功", data: Category }
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
  const categoryId = Number(id);

  if (isNaN(categoryId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    return Response.json({ code: 404, message: "分类不存在" });
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
      const slugExists = await prisma.category.findUnique({ where: { slug: body.slug } });
      if (slugExists) {
        return Response.json({ code: 409, message: "slug 已存在" });
      }
    }
    data.slug = body.slug;
  }

  if (body.description !== undefined) {
    data.description = body.description || null;
  }

  if (body.sort !== undefined) {
    data.sort = typeof body.sort === "number" ? body.sort : 0;
  }

  if (body.visible !== undefined) {
    data.visible = body.visible === true || body.visible === false ? body.visible : true;
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
  });

  return Response.json({ code: 0, message: "分类更新成功", data: category });
}

/**
 * DELETE /api/admin/categories/[id] - 删除分类
 * @auth 需要登录（401）
 * @param id - 分类 ID（路径参数）
 * @throws 404 - 分类不存在
 * @throws 400 - 分类下有文章，无法删除
 * @returns { code: 0, message: "分类删除成功" }
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
  const categoryId = Number(id);

  if (isNaN(categoryId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    return Response.json({ code: 404, message: "分类不存在" });
  }

  // Check if category has posts - prevent deletion if it does
  const postCount = await prisma.post.count({ where: { categoryId } });
  if (postCount > 0) {
    return Response.json({ code: 400, message: `该分类下有 ${postCount} 篇文章，无法删除` });
  }

  await prisma.category.delete({ where: { id: categoryId } });

  return Response.json({ code: 0, message: "分类删除成功" });
}
