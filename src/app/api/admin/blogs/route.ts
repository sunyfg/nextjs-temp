import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const categoryId = searchParams.get("categoryId")?.trim() || "";
  const startDate = searchParams.get("startDate")?.trim() || "";
  const endDate = searchParams.get("endDate")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const where: Prisma.PostWhereInput = { deletedAt: null };

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { summary: { contains: keyword } },
      { contentText: { contains: keyword } },
    ];
  }

  if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
    where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }

  if (categoryId && !isNaN(Number(categoryId))) {
    where.categoryId = Number(categoryId);
  }

  if (startDate || endDate) {
    where.publishedAt = {};
    if (startDate) {
      where.publishedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.publishedAt.lte = new Date(endDate);
    }
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
        author: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: [{ isTop: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    coverImage: p.coverImage,
    status: p.status,
    isTop: p.isTop,
    isRecommend: p.isRecommend,
    viewCount: p.viewCount,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    category: p.category,
    tags: p.tags.map((pt) => pt.tag),
    author: p.author,
  }));

  return Response.json({
    code: 0,
    message: "success",
    data: { items: data, total, page, pageSize },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const body = await request.json();

  if (!body.title || typeof body.title !== "string") {
    return Response.json({ code: 400, message: "title is required" });
  }
  if (!body.slug || typeof body.slug !== "string") {
    return Response.json({ code: 400, message: "slug is required" });
  }

  const existing = await prisma.post.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return Response.json({ code: 409, message: "slug 已存在" });
  }

  // Ensure author exists — find or create a blog user linked to the system user
  let authorId = body.authorId ? Number(body.authorId) : 0;
  if (!authorId) {
    const blogUser = await prisma.blogUser.findFirst({
      orderBy: { id: "asc" },
    });
    if (blogUser) {
      authorId = blogUser.id;
    } else {
      // Create a default blog user from system user info
      const sysUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const newBlogUser = await prisma.blogUser.create({
        data: {
          username: sysUser?.email?.split("@")[0] ?? "admin",
          displayName: sysUser?.name ?? "Admin",
          email: sysUser?.email ?? undefined,
        },
      });
      authorId = newBlogUser.id;
    }
  }

  // Strip HTML tags for contentText
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

  const tagIds: number[] = Array.isArray(body.tagIds) ? body.tagIds : [];

  const post = await prisma.post.create({
    data: {
      title: body.title,
      slug: body.slug,
      summary: typeof body.summary === "string" ? body.summary : null,
      coverImage: typeof body.coverImage === "string" ? body.coverImage : null,
      content: body.content || "",
      contentText: body.content ? stripHtml(body.content).slice(0, 5000) : null,
      status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      isTop: body.isTop === true,
      isRecommend: body.isRecommend === true,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : null,
      seoKeywords: typeof body.seoKeywords === "string" ? body.seoKeywords : null,
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription : null,
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      authorId,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      tags: {
        create: tagIds.map((tagId: number) => ({ tagId })),
      },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      author: { select: { id: true, username: true, displayName: true } },
    },
  });

  return Response.json({
    code: 0,
    message: "文章创建成功",
    data: {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    },
  });
}
