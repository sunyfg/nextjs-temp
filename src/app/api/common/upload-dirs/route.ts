import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const dirs = await prisma.cmsUploadDir.findMany({
    orderBy: [{ sort: "asc" }, { name: "asc" }],
  });

  return Response.json({ code: 0, message: "success", data: dirs });
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
  if (!body.dir || typeof body.dir !== "string") {
    return Response.json({ code: 400, message: "dir is required" });
  }

  // Check uniqueness
  const existing = await prisma.cmsUploadDir.findUnique({ where: { dir: body.dir } });
  if (existing) {
    return Response.json({ code: 409, message: "目录标识已存在" });
  }

  const dir = await prisma.cmsUploadDir.create({
    data: {
      name: body.name,
      dir: body.dir,
      description: typeof body.description === "string" ? body.description : null,
      maxSize: typeof body.maxSize === "number" ? body.maxSize : null,
      allowTypes: typeof body.allowTypes === "string" ? body.allowTypes : null,
      enabled: body.enabled !== false,
      sort: typeof body.sort === "number" ? body.sort : 0,
    },
  });

  return Response.json({ code: 0, message: "创建成功", data: dir });
}
