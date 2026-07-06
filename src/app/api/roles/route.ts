import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MANAGE_ROLES_ROLES } from "@/lib/auth-utils";

async function checkRoleAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      userRoles: {
        select: { role: { select: { roleCode: true } } },
      },
    },
  });
  const roleCodes = currentUser?.userRoles.map((ur) => ur.role.roleCode) ?? [];
  const authorized = roleCodes.includes("super_admin") || roleCodes.some((r) => (MANAGE_ROLES_ROLES as readonly string[]).includes(r));
  if (!authorized) {
    return Response.json({ code: 403, message: "无权限管理角色" });
  }
  return null;
}

/**
 * GET /api/roles - 获取所有角色列表，按排序号升序排列
 * @returns SysRole[]
 */
export async function GET() {
  const roles = await prisma.sysRole.findMany({ orderBy: { sortOrder: "asc" } });
  return Response.json({ code: 0, message: "success", data: roles });
}

/**
 * POST /api/roles - 创建新角色
 * @requires MANAGE_ROLES_ROLES 权限
 * @body { roleCode: string, roleName: string, description?: string, status?: number, sortOrder?: number }
 * @returns SysRole
 */
export async function POST(request: Request) {
  const err = await checkRoleAdmin();
  if (err) return err;

  const body = await request.json();

  if (!body.roleCode || typeof body.roleCode !== "string") {
    return Response.json({ code: 400, message: "roleCode is required" });
  }
  if (!body.roleName || typeof body.roleName !== "string") {
    return Response.json({ code: 400, message: "roleName is required" });
  }

  const existing = await prisma.sysRole.findUnique({ where: { roleCode: body.roleCode } });
  if (existing) {
    return Response.json({ code: 409, message: "角色编码已存在" });
  }

  const role = await prisma.sysRole.create({
    data: {
      roleCode: body.roleCode,
      roleName: body.roleName,
      description: typeof body.description === "string" ? body.description : null,
      status: typeof body.status === "number" ? body.status : 1,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });

  return Response.json({ code: 0, message: "角色创建成功", data: role });
}

/**
 * PUT /api/roles - 更新指定角色信息
 * @requires MANAGE_ROLES_ROLES 权限
 * @body { id: number, roleCode?: string, roleName?: string, description?: string, status?: number, sortOrder?: number }
 * @returns SysRole
 */
export async function PUT(request: Request) {
  const err = await checkRoleAdmin();
  if (err) return err;

  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const existing = await prisma.sysRole.findUnique({ where: { id: body.id } });
  if (!existing) {
    return Response.json({ code: 404, message: "角色不存在" });
  }

  if (body.roleCode && body.roleCode !== existing.roleCode) {
    const duplicate = await prisma.sysRole.findUnique({ where: { roleCode: body.roleCode } });
    if (duplicate) {
      return Response.json({ code: 409, message: "角色编码已存在" });
    }
  }

  const role = await prisma.sysRole.update({
    where: { id: body.id },
    data: {
      ...(body.roleCode !== undefined && { roleCode: body.roleCode }),
      ...(body.roleName !== undefined && { roleName: body.roleName }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return Response.json({ code: 0, message: "角色更新成功", data: role });
}

/**
 * DELETE /api/roles - 删除指定角色
 * @requires MANAGE_ROLES_ROLES 权限
 * @body { id: number }
 * @returns { code: 0, message: "角色删除成功" }
 */
export async function DELETE(request: Request) {
  const err = await checkRoleAdmin();
  if (err) return err;

  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const existing = await prisma.sysRole.findUnique({ where: { id: body.id } });
  if (!existing) {
    return Response.json({ code: 404, message: "角色不存在" });
  }

  await prisma.sysRole.delete({ where: { id: body.id } });
  return Response.json({ code: 0, message: "角色删除成功" });
}
