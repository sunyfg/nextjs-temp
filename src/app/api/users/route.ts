import bcrypt from "bcryptjs";
import { auth } from "@/auth";
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

  const hashedPassword =
    body.password && typeof body.password === "string" && body.password.length >= 6
      ? await bcrypt.hash(body.password, 10)
      : undefined;

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      hashedPassword,
      image: typeof body.image === "string" ? body.image : undefined,
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

  const hashedPassword =
    body.password && typeof body.password === "string" && body.password.length >= 6
      ? await bcrypt.hash(body.password, 10)
      : undefined;

  const user = await prisma.user.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(["admin", "editor", "viewer"].includes(body.role) && { role: body.role }),
      ...(body.age !== undefined && { age: body.age }),
      ...(hashedPassword !== undefined && { hashedPassword }),
      ...(body.image !== undefined && { image: body.image || null }),
    },
  });

  return Response.json({ code: 0, message: "用户更新成功", data: user });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== "admin") {
    return Response.json({ code: 403, message: "仅管理员可删除用户" });
  }

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
