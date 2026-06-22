import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
