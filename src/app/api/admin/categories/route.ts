import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/categories - 获取分类列表
 * @auth 需要登录（401）
 * @query name - 按名称搜索（可选）
 * @returns { code: 0, message: "success", data: Category[] }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() || "";

  const categories = await prisma.category.findMany({
    where: name ? { name: { contains: name } } : undefined,
    orderBy: [{ sort: "asc" }, { id: "asc" }],
  });

  return Response.json({ code: 0, message: "success", data: categories });
}

/**
 * POST /api/admin/categories - 创建分类
 * @auth 需要登录（401）
 * @body name (string) - 分类名称（必填）
 * @body slug (string) - 分类别名（必填，需唯一，重复返回 409）
 * @body description (string) - 描述（可选）
 * @body sort (number) - 排序值（可选，默认 0）
 * @body visible (boolean) - 是否可见（可选，默认 true）
 * @returns { code: 0, message: "分类创建成功", data: Category }
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

  const existing = await prisma.category.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return Response.json({ code: 409, message: "slug 已存在" });
  }

  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: typeof body.description === "string" ? body.description : null,
      sort: typeof body.sort === "number" ? body.sort : 0,
      visible: body.visible === false ? false : true,
    },
  });

  return Response.json({ code: 0, message: "分类创建成功", data: category });
}
