import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env["DATABASE_URL"]!),
});

async function main() {
  const users = await prisma.user.createMany({
    data: [
      { name: "Tom", email: "tom@example.com", role: "admin", age: 28 },
      { name: "Jack", email: "jack@example.com", role: "editor", age: 35 },
    ],
    skipDuplicates: true,
  });

  const posts = await prisma.post.createMany({
    data: [
      { title: "Hello World", content: "First blog post" },
      { title: "Getting Started", content: "Welcome to the blog" },
    ],
    skipDuplicates: true,
  });

  console.log(`Seeded: ${users.count} users, ${posts.count} posts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
