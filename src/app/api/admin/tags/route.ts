import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
