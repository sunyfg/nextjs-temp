import { config } from 'dotenv';

// Load the base .env first (shared defaults)
config();

// Then override with environment-specific file based on APP_ENV
const appEnv = process.env['APP_ENV'] || 'local';
const envFiles: Record<string, string> = {
  local: '.env.local',
  test: '.env.test',
  prod: '.env.prod',
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

  const admin = await prisma.user.upsert({
    where: { email: 'admin@qq.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@qq.com',
      hashedPassword,
      role: 'admin',
      age: 30,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@qq.com' },
    update: {},
    create: {
      name: 'Editor',
      email: 'editor@qq.com',
      hashedPassword,
      role: 'editor',
      age: 28,
    },
  });

  const posts = await prisma.post.createMany({
    data: [
      { title: 'Hello World', content: 'First blog post' },
      { title: 'Getting Started', content: 'Welcome to the blog' },
    ],
    skipDuplicates: true,
  });

  console.log(`Seeded: ${[admin, editor].length} users, ${posts.count} posts`);
  console.log('Default password for all users: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
