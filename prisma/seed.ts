import { config } from 'dotenv';

// Load the base .env first (shared defaults)
config();

// Then override with environment-specific file based on APP_ENV
const appEnv = process.env['APP_ENV'] || 'local';
const envFiles: Record<string, string> = {
  local: '.env.local',
  test: '.env.test',
  prod: '.env.production',
};
const envFile = envFiles[appEnv];
if (envFile) {
  config({ path: envFile, override: true });
}

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env['DATABASE_URL']!),
});

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Seed roles first
  const roleDefs = [
    { roleCode: 'super_admin', roleName: '超级管理员', description: '系统超级管理员', sortOrder: 1 },
    { roleCode: 'admin', roleName: '系统管理员', description: '系统管理员', sortOrder: 2 },
    { roleCode: 'manager', roleName: '管理人员', description: '管理人员', sortOrder: 3 },
    { roleCode: 'dept_admin', roleName: '部门管理员', description: '部门管理员', sortOrder: 4 },
    { roleCode: 'staff', roleName: '员工', description: '普通员工', sortOrder: 5 },
    { roleCode: 'editor', roleName: '编辑者', description: '可编辑内容', sortOrder: 6 },
    { roleCode: 'viewer', roleName: '只读用户', description: '只读用户，无编辑权限', sortOrder: 7 },
    { roleCode: 'auditor', roleName: '审计员', description: '审计员', sortOrder: 8 },
  ] as const;

  const roles = await Promise.all(
    roleDefs.map((r) =>
      prisma.sysRole.upsert({
        where: { roleCode: r.roleCode },
        update: { roleName: r.roleName, description: r.description, sortOrder: r.sortOrder },
        create: { ...r },
      }),
    ),
  );

  const adminRole = roles.find((r) => r.roleCode === 'super_admin')!;
  const editorRole = roles.find((r) => r.roleCode === 'editor')!;

  // Seed users with role assignments
  const admin = await prisma.user.upsert({
    where: { email: 'admin@123.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@123.com',
      hashedPassword,
      age: 30,
    },
  });
  // Assign admin role
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      name: 'Editor',
      email: 'editor@example.com',
      hashedPassword,
      age: 28,
    },
  });
  // Assign editor role
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: editor.id, roleId: editorRole.id } },
    update: {},
    create: { userId: editor.id, roleId: editorRole.id },
  });

  console.log(`Seeded: 2 users, ${roles.length} roles`);
  console.log('Default password for all users: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
