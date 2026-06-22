import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
