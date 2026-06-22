import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category")?.trim() || "";
  const tagSlug = searchParams.get("tag")?.trim() || "";
  const keyword = searchParams.get("keyword")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 10));

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    deletedAt: null,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (tagSlug) {
    where.tags = { some: { tag: { slug: tagSlug } } };
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { summary: { contains: keyword } },
    ];
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where: where as never }),
    prisma.post.findMany({
      where: where as never,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
        author: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
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
    category: p.category,
    tags: p.tags.map((pt) => pt.tag),
    author: p.author,
    publishedAt: p.publishedAt,
    viewCount: p.viewCount,
  }));

  return Response.json({
    code: 0,
    message: "success",
    data: { items: data, total, page, pageSize },
  });
}
