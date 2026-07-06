import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type MenuNode = {
  id: number;
  parentId: number;
  permissionName: string;
  permissionCode: string | null;
  type: string;
  path: string | null;
  component: string | null;
  icon: string | null;
  visible: number;
  status: number;
  sortOrder: number;
  children: MenuNode[];
};

function buildMenuTree(
  perms: { id: number; parentId: number; type: string }[],
): MenuNode[] {
  const map = new Map<number, MenuNode>();
  const roots: MenuNode[] = [];

  for (const p of perms) {
    map.set(p.id, { ...p, children: [] } as unknown as MenuNode);
  }
  for (const p of perms) {
    const node = map.get(p.id)!;
    if (p.parentId === 0 || !map.has(p.parentId)) {
      roots.push(node);
    } else {
      map.get(p.parentId)!.children.push(node);
    }
  }
  return roots;
}

/**
 * GET /api/user/me - 获取当前登录用户信息、角色、权限编码和菜单树
 * @auth 需要用户登录
 * @returns { code: 0, data: { user, roles, permissions: string[], menus: MenuNode[] } }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return Response.json({ code: 404, message: "User not found" });
  }

  const roleCodes = user.userRoles.map((ur) => ur.role.roleCode);
  const isSuperAdmin = roleCodes.includes("super_admin");

  // Get permissions the user has access to (all for super_admin)
  let permissionRows: {
    id: number;
    parentId: number;
    permissionName: string;
    permissionCode: string | null;
    type: string;
    path: string | null;
    component: string | null;
    icon: string | null;
    visible: number;
    status: number;
    sortOrder: number;
  }[];

  if (isSuperAdmin) {
    permissionRows = await prisma.sysPermission.findMany({
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });
  } else {
    const roleIds = user.userRoles.map((ur) => ur.role.id);
    const rolePerms = await prisma.sysRolePermission.findMany({
      where: { roleId: { in: roleIds } },
      select: { permissionId: true },
    });
    const permIds = rolePerms.map((rp) => rp.permissionId);
    permissionRows = await prisma.sysPermission.findMany({
      where: { id: { in: permIds } },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });
  }

  return Response.json({
    code: 0,
    message: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        image: user.image,
        phone: user.phone,
        status: user.status,
        isSuperAdmin: user.isSuperAdmin,
      },
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        roleCode: ur.role.roleCode,
        roleName: ur.role.roleName,
      })),
      permissions: permissionRows
        .map((p) => p.permissionCode)
        .filter((c): c is string => c !== null),
      menus: buildMenuTree(permissionRows.filter((p) => p.type === "CATALOG" || p.type === "MENU")),
    },
  });
}
