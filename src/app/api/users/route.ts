import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json({ code: 0, message: "success", data: users });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ code: 400, message: "name is required" });
  }
  if (!body.email || typeof body.email !== "string") {
    return Response.json({ code: 400, message: "email is required" });
  }
  if (!["admin", "editor", "viewer"].includes(body.role)) {
    return Response.json({ code: 400, message: "role must be admin, editor, or viewer" });
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      age: typeof body.age === "number" ? body.age : 0,
    },
  });

  return Response.json({ code: 0, message: "用户创建成功", data: user });
}

export async function PUT(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const existing = await prisma.user.findUnique({ where: { id: body.id } });
  if (!existing) {
    return Response.json({ code: 404, message: "用户不存在" });
  }

  const user = await prisma.user.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(["admin", "editor", "viewer"].includes(body.role) && { role: body.role }),
      ...(body.age !== undefined && { age: body.age }),
    },
  });

  return Response.json({ code: 0, message: "用户更新成功", data: user });
}

export async function DELETE(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const existing = await prisma.user.findUnique({ where: { id: body.id } });
  if (!existing) {
    return Response.json({ code: 404, message: "用户不存在" });
  }

  await prisma.user.delete({ where: { id: body.id } });
  return Response.json({ code: 0, message: "用户删除成功" });
}
