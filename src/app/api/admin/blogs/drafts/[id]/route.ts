import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { id } = await params;
  const draftId = Number(id);
  if (isNaN(draftId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const draft = await prisma.postDraft.findUnique({ where: { id: draftId } });
  if (!draft) {
    return Response.json({ code: 404, message: "草稿不存在" });
  }

  await prisma.postDraft.delete({ where: { id: draftId } });

  return Response.json({ code: 0, message: "草稿已删除" });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { id } = await params;
  const draftId = Number(id);
  if (isNaN(draftId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.postDraft.findUnique({ where: { id: draftId } });
  if (!existing) {
    return Response.json({ code: 404, message: "草稿不存在" });
  }

  const body = await request.json();
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

  const draft = await prisma.postDraft.update({
    where: { id: draftId },
    data: {
      title: body.title !== undefined ? body.title : undefined,
      slug: body.slug !== undefined ? body.slug : undefined,
      summary: body.summary !== undefined ? (body.summary || null) : undefined,
      coverImage: body.coverImage !== undefined ? (body.coverImage || null) : undefined,
      content: body.content !== undefined ? body.content : undefined,
      contentText: body.content !== undefined
        ? stripHtml(body.content).slice(0, 5000)
        : undefined,
      isTop: body.isTop !== undefined ? body.isTop === true : undefined,
      isRecommend: body.isRecommend !== undefined ? body.isRecommend === true : undefined,
      seoTitle: body.seoTitle !== undefined ? (body.seoTitle || null) : undefined,
      seoKeywords: body.seoKeywords !== undefined ? (body.seoKeywords || null) : undefined,
      seoDescription: body.seoDescription !== undefined ? (body.seoDescription || null) : undefined,
      tagIds: Array.isArray(body.tagIds) ? JSON.stringify(body.tagIds) : undefined,
      categoryId: body.categoryId !== undefined ? (body.categoryId ? Number(body.categoryId) : null) : undefined,
    },
  });

  return Response.json({ code: 0, message: "草稿更新成功", data: draft });
}
