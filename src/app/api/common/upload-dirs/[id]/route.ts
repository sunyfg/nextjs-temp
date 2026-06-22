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
  const dirId = Number(id);
  if (isNaN(dirId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.cmsUploadDir.findUnique({ where: { id: dirId } });
  if (!existing) {
    return Response.json({ code: 404, message: "目录不存在" });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name) {
      return Response.json({ code: 400, message: "name is required" });
    }
    data.name = body.name;
  }
  if (body.dir !== undefined) {
    if (typeof body.dir !== "string" || !body.dir) {
      return Response.json({ code: 400, message: "dir is required" });
    }
    if (body.dir !== existing.dir) {
      const dup = await prisma.cmsUploadDir.findUnique({ where: { dir: body.dir } });
      if (dup) {
        return Response.json({ code: 409, message: "目录标识已存在" });
      }
    }
    data.dir = body.dir;
  }
  if (body.description !== undefined) {
    data.description = body.description || null;
  }
  if (body.maxSize !== undefined) {
    data.maxSize = typeof body.maxSize === "number" ? body.maxSize : null;
  }
  if (body.allowTypes !== undefined) {
    data.allowTypes = body.allowTypes || null;
  }
  if (body.enabled !== undefined) {
    data.enabled = body.enabled === true;
  }
  if (body.sort !== undefined) {
    data.sort = Number(body.sort);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ code: 400, message: "没有需要更新的字段" });
  }

  const updated = await prisma.cmsUploadDir.update({
    where: { id: dirId },
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
  const dirId = Number(id);
  if (isNaN(dirId)) {
    return Response.json({ code: 400, message: "invalid id" });
  }

  const existing = await prisma.cmsUploadDir.findUnique({ where: { id: dirId } });
  if (!existing) {
    return Response.json({ code: 404, message: "目录不存在" });
  }

  await prisma.cmsUploadDir.delete({ where: { id: dirId } });

  return Response.json({ code: 0, message: "删除成功" });
}
