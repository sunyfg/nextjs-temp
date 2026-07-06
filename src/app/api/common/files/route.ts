import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { saveUploadedFile } from "@/lib/file-upload";

/**
 * 获取文件列表（需登录）
 *
 * @auth 需要用户登录
 * @query keyword - 搜索关键词（可选，匹配原始文件名、显示名称、备注）
 * @query mimeType - MIME 类型前缀筛选（可选）
 * @query subDir - 子目录筛选（可选）
 * @query page - 页码，默认 1（可选）
 * @query pageSize - 每页条数，默认 20，最大 100（可选）
 * @returns { code: 0, message: "success", data: { items: CmsFile[], total: number, page: number, pageSize: number } }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "";
  const mimeType = searchParams.get("mimeType")?.trim() || "";
  const subDir = searchParams.get("subDir")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const where: Prisma.CmsFileWhereInput = { deleted: false };

  if (keyword) {
    where.OR = [
      { originalName: { contains: keyword } },
      { displayName: { contains: keyword } },
      { remark: { contains: keyword } },
    ];
  }

  if (mimeType) {
    where.mimeType = { startsWith: mimeType };
  }

  if (subDir) {
    where.subDir = subDir;
  }

  const [total, files] = await Promise.all([
    prisma.cmsFile.count({ where }),
    prisma.cmsFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return Response.json({
    code: 0,
    message: "success",
    data: { items: files, total, page, pageSize },
  });
}

/**
 * 上传文件（需登录）
 *
 * @auth 需要用户登录
 * @body form-data: file (File), subDir (string, 可选), displayName (string, 可选), remark (string, 可选)
 * @returns { code: 0, message: "上传成功", data: CmsFile }
 * @throws { code: 400, message: "file is required" | 文件上传失败错误消息 }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ code: 400, message: "file is required" });
  }

  const subDir = (formData.get("subDir") as string)?.trim() || "";
  const displayName = (formData.get("displayName") as string)?.trim() || null;
  const remark = (formData.get("remark") as string)?.trim() || null;

  let result;
  try {
    result = await saveUploadedFile(file, { subDir: subDir || undefined });
  } catch (err) {
    return Response.json({
      code: 400,
      message: err instanceof Error ? err.message : "文件上传失败",
    });
  }

  const record = await prisma.cmsFile.create({
    data: {
      filename: result.filename,
      originalName: result.originalName,
      displayName,
      ext: result.ext,
      mimeType: result.mimeType,
      size: result.size,
      sizeText: result.sizeText,
      rootDir: result.rootDir,
      subDir: result.subDir || null,
      relativePath: result.relativePath,
      absolutePath: result.absolutePath,
      accessUrl: result.accessUrl,
      remark,
      createUserId: session.user.id,
      createUserName: session.user.name || session.user.email || undefined,
    },
  });

  return Response.json({
    code: 0,
    message: "上传成功",
    data: record,
  });
}
