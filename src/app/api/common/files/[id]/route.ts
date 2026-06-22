import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/file-upload";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { id } = await params;
  const fileId = Number(id);
  if (isNaN(fileId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const file = await prisma.cmsFile.findUnique({ where: { id: fileId } });
  if (!file || file.deleted) {
    return Response.json({ code: 404, message: "文件不存在" });
  }

  return Response.json({ code: 0, message: "success", data: file });
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
  const fileId = Number(id);
  if (isNaN(fileId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.cmsFile.findUnique({ where: { id: fileId } });
  if (!existing || existing.deleted) {
    return Response.json({ code: 404, message: "文件不存在" });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    data.displayName = body.displayName || null;
  }
  if (body.remark !== undefined) {
    data.remark = body.remark || null;
  }
  if (body.isPublic !== undefined) {
    data.isPublic = body.isPublic === true;
  }
  if (body.status !== undefined) {
    data.status = Number(body.status);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ code: 400, message: "没有需要更新的字段" });
  }

  const updated = await prisma.cmsFile.update({
    where: { id: fileId },
    data,
  });

  return Response.json({ code: 0, message: "更新成功", data: updated });
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
  const fileId = Number(id);
  if (isNaN(fileId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.cmsFile.findUnique({ where: { id: fileId } });
  if (!existing || existing.deleted) {
    return Response.json({ code: 404, message: "文件不存在" });
  }

  // Soft delete in DB
  await prisma.cmsFile.update({
    where: { id: fileId },
    data: { deleted: true },
  });

  // Remove file from disk
  if (existing.absolutePath) {
    await deleteUploadedFile(existing.absolutePath);
  }

  return Response.json({ code: 0, message: "删除成功" });
}
