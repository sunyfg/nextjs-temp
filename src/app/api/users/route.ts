import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() || "";

  const users = await prisma.user.findMany({
    where: name
      ? { name: { contains: name } }
      : undefined,
    include: {
      userRoles: {
        include: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    age: u.age,
    image: u.image,
    phone: u.phone,
    status: u.status,
    isSuperAdmin: u.isSuperAdmin,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    roles: u.userRoles.map((ur) => ({ id: ur.role.id, roleCode: ur.role.roleCode, roleName: ur.role.roleName })),
  }));
  return Response.json({ code: 0, message: "success", data });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ code: 400, message: "name is required" });
  }
  if (!body.email || typeof body.email !== "string") {
    return Response.json({ code: 400, message: "email is required" });
  }

  const hashedPassword =
    body.password && typeof body.password === "string" && body.password.length >= 6
      ? await bcrypt.hash(body.password, 10)
      : undefined;

  const roleIds: number[] = Array.isArray(body.roleIds) ? body.roleIds : [];

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      hashedPassword,
      image: typeof body.image === "string" ? body.image : undefined,
      age: typeof body.age === "number" ? body.age : 0,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      userRoles: {
        create: roleIds.map((roleId) => ({ roleId })),
      },
    },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  return Response.json({
    code: 0,
    message: "用户创建成功",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      roles: user.userRoles.map((ur) => ({ id: ur.role.id, roleCode: ur.role.roleCode, roleName: ur.role.roleName })),
    },
  });
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

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.age !== undefined && { age: body.age }),
        ...(hashedPassword !== undefined && { hashedPassword }),
        ...(body.image !== undefined && { image: body.image || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
      },
    });

    // Replace roles if roleIds provided
    if (Array.isArray(body.roleIds)) {
      await tx.sysUserRole.deleteMany({ where: { userId: body.id } });
      if (body.roleIds.length > 0) {
        await tx.sysUserRole.createMany({
          data: body.roleIds.map((roleId: number) => ({ userId: body.id, roleId })),
        });
      }
    }

    return updated;
  });

  return Response.json({ code: 0, message: "用户更新成功", data: user });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const permCodes = session.user.permissionCodes ?? [];
  if (!permCodes.includes("system:user:delete")) {
    return Response.json({ code: 403, message: "无删除用户权限" });
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
