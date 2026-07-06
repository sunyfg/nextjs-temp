import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/tags - 获取标签列表
 * @auth 需要登录（401）
 * @query name - 按名称搜索（可选）
 * @returns { code: 0, message: "success", data: Tag[] }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() || "";

  const tags = await prisma.tag.findMany({
    where: name ? { name: { contains: name } } : undefined,
    orderBy: { id: "desc" },
  });

  return Response.json({ code: 0, message: "success", data: tags });
}

/**
 * POST /api/admin/tags - 创建标签
 * @auth 需要登录（401）
 * @body name (string) - 标签名称（必填）
 * @body slug (string) - 标签别名（必填，需唯一，重复返回 409）
 * @returns { code: 0, message: "标签创建成功", data: Tag }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ code: 400, message: "name is required" });
  }
  if (!body.slug || typeof body.slug !== "string") {
    return Response.json({ code: 400, message: "slug is required" });
  }

  const existing = await prisma.tag.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return Response.json({ code: 409, message: "slug 已存在" });
  }

  const tag = await prisma.tag.create({
    data: {
      name: body.name,
      slug: body.slug,
    },
  });

  return Response.json({ code: 0, message: "标签创建成功", data: tag });
}
