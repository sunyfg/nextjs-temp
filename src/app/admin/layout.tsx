import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import SidebarNav from './_components/sidebar-nav';
import type { NavItem } from './_components/sidebar-nav';
import UserMenu from './_components/user-menu';

type PermRow = {
  id: number;
  parentId: number;
  permissionName: string;
  permissionCode: string | null;
  type: string;
  path: string | null;
  sortOrder: number;
};

function buildMenuTree(perms: PermRow[]) {
  const map = new Map<number, PermRow & { children: PermRow[] }>();
  const roots: (PermRow & { children: PermRow[] })[] = [];

  for (const p of perms) {
    map.set(p.id, { ...p, children: [] });
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

function toNavItems(nodes: (PermRow & { children: PermRow[] })[]): NavItem[] {
  const items: NavItem[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      const children = node.children
        .filter((c) => c.type === 'MENU' && c.path)
        .map((c) => ({ href: c.path!, label: c.permissionName }));
      if (children.length > 0) {
        items.push({ label: node.permissionName, children });
      } else if (node.path) {
        items.push({ href: node.path, label: node.permissionName });
      }
    } else if (node.path) {
      items.push({ href: node.path, label: node.permissionName });
    }
  }
  return items;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const roleCodes = user?.roleCodes ?? [];
  const isSuperAdmin = roleCodes.includes('super_admin');

  // Fetch permissions the user has access to
  let menuPerms: PermRow[];

  if (isSuperAdmin) {
    menuPerms = await prisma.sysPermission.findMany({
      where: { type: { in: ['CATALOG', 'MENU'] } },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    });
  } else if (user) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        userRoles: {
          select: { role: { select: { id: true } } },
        },
      },
    });
    const roleIds = userRecord?.userRoles.map((ur) => ur.role.id) ?? [];
    const rolePerms = await prisma.sysRolePermission.findMany({
      where: { roleId: { in: roleIds } },
      select: { permissionId: true },
    });
    const permIds = rolePerms.map((rp) => rp.permissionId);
    menuPerms = await prisma.sysPermission.findMany({
      where: { id: { in: permIds }, type: { in: ['CATALOG', 'MENU'] } },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    });
  } else {
    menuPerms = [];
  }

  const tree = buildMenuTree(menuPerms);
  const navItems: NavItem[] = toNavItems(tree);

  return (
    <div className='flex h-screen overflow-hidden'>
      <aside className='flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black'>
        <SidebarNav items={navItems} />
        {user && (
          <div className='mt-auto border-t border-zinc-200 p-3 dark:border-zinc-800'>
            <UserMenu user={user} />
          </div>
        )}
      </aside>
      <main className='flex-1 overflow-y-auto p-8'>{children}</main>
    </div>
  );
}
