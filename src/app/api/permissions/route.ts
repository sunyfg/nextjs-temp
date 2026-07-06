import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MANAGE_PERMISSIONS_ROLES } from "@/lib/auth-utils";

async function checkPermissionAdmin() {
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
  const authorized = roleCodes.includes("super_admin") || roleCodes.some((r) => (MANAGE_PERMISSIONS_ROLES as readonly string[]).includes(r));
  if (!authorized) {
    return Response.json({ code: 403, message: "无权限管理权限" });
  }
  return null;
}

/**
 * GET /api/permissions - 获取所有权限项列表，按父级ID和排序号升序排列
 * @returns SysPermission[]
 */
export async function GET() {
  const permissions = await prisma.sysPermission.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] });
  return Response.json({ code: 0, message: "success", data: permissions });
}

/**
 * POST /api/permissions - 创建新的权限项
 * @requires MANAGE_PERMISSIONS_ROLES 权限
 * @body { permissionName: string, type: "CATALOG"|"MENU"|"BUTTON"|"API", parentId?: number, permissionCode?: string, path?: string, component?: string, icon?: string, visible?: number, status?: number, sortOrder?: number }
 * @returns SysPermission
 */
export async function POST(request: Request) {
  const err = await checkPermissionAdmin();
  if (err) return err;

  const body = await request.json();

  if (!body.permissionName || typeof body.permissionName !== "string") {
    return Response.json({ code: 400, message: "permissionName is required" });
  }
  if (!body.type || !["CATALOG", "MENU", "BUTTON", "API"].includes(body.type)) {
    return Response.json({ code: 400, message: "type must be CATALOG, MENU, BUTTON, or API" });
  }

  const permission = await prisma.sysPermission.create({
    data: {
      parentId: typeof body.parentId === "number" ? body.parentId : 0,
      permissionName: body.permissionName,
      permissionCode: typeof body.permissionCode === "string" ? body.permissionCode : null,
      type: body.type,
      path: typeof body.path === "string" ? body.path : null,
      component: typeof body.component === "string" ? body.component : null,
      icon: typeof body.icon === "string" ? body.icon : null,
      visible: typeof body.visible === "number" ? body.visible : 1,
      status: typeof body.status === "number" ? body.status : 1,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });

  return Response.json({ code: 0, message: "权限创建成功", data: permission });
}

/**
 * PUT /api/permissions - 更新指定权限项
 * @requires MANAGE_PERMISSIONS_ROLES 权限
 * @body { id: number, permissionName?: string, type?: "CATALOG"|"MENU"|"BUTTON"|"API", parentId?: number, permissionCode?: string, path?: string, component?: string, icon?: string, visible?: number, status?: number, sortOrder?: number }
 * @returns SysPermission
 */
export async function PUT(request: Request) {
  const err = await checkPermissionAdmin();
  if (err) return err;

  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const existing = await prisma.sysPermission.findUnique({ where: { id: body.id } });
  if (!existing) {
    return Response.json({ code: 404, message: "权限不存在" });
  }

  const permission = await prisma.sysPermission.update({
    where: { id: body.id },
    data: {
      ...(body.parentId !== undefined && { parentId: body.parentId }),
      ...(body.permissionName !== undefined && { permissionName: body.permissionName }),
      ...(body.permissionCode !== undefined && { permissionCode: body.permissionCode || null }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.path !== undefined && { path: body.path || null }),
      ...(body.component !== undefined && { component: body.component || null }),
      ...(body.icon !== undefined && { icon: body.icon || null }),
      ...(body.visible !== undefined && { visible: body.visible }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return Response.json({ code: 0, message: "权限更新成功", data: permission });
}

/**
 * DELETE /api/permissions - 删除指定权限项
 * @requires MANAGE_PERMISSIONS_ROLES 权限
 * @body { id: number }
 * @returns { code: 0, message: "权限删除成功" }
 */
export async function DELETE(request: Request) {
  const err = await checkPermissionAdmin();
  if (err) return err;

  const body = await request.json();

  if (!body.id) {
    return Response.json({ code: 400, message: "id is required" });
  }

  const existing = await prisma.sysPermission.findUnique({ where: { id: body.id } });
  if (!existing) {
    return Response.json({ code: 404, message: "权限不存在" });
  }

  await prisma.sysPermission.delete({ where: { id: body.id } });
  return Response.json({ code: 0, message: "权限删除成功" });
}
