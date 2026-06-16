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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await checkRoleAdmin();
  if (err) return err;

  const { id } = await params;
  const roleId = Number(id);
  if (isNaN(roleId)) {
    return Response.json({ code: 400, message: "无效的角色 ID" });
  }

  const role = await prisma.sysRole.findUnique({ where: { id: roleId } });
  if (!role) {
    return Response.json({ code: 404, message: "角色不存在" });
  }

  const rolePermissions = await prisma.sysRolePermission.findMany({
    where: { roleId },
    select: { permissionId: true },
  });

  return Response.json({
    code: 0,
    message: "success",
    data: { permissionIds: rolePermissions.map((rp) => rp.permissionId) },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await checkRoleAdmin();
  if (err) return err;

  const { id } = await params;
  const roleId = Number(id);
  if (isNaN(roleId)) {
    return Response.json({ code: 400, message: "无效的角色 ID" });
  }

  const role = await prisma.sysRole.findUnique({ where: { id: roleId } });
  if (!role) {
    return Response.json({ code: 404, message: "角色不存在" });
  }

  const body = await request.json();
  if (!Array.isArray(body.permissionIds)) {
    return Response.json({ code: 400, message: "permissionIds must be an array" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.sysRolePermission.deleteMany({ where: { roleId } });
    if (body.permissionIds.length > 0) {
      await tx.sysRolePermission.createMany({
        data: body.permissionIds.map((permissionId: number) => ({
          roleId,
          permissionId,
        })),
      });
    }
  });

  return Response.json({ code: 0, message: "权限配置成功" });
}
