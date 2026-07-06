import { prisma } from "@/lib/prisma";

/**
 * 获取公开博客文章列表（支持分页、分类、标签、关键词筛选）
 *
 * @query category - 分类 slug（可选）
 * @query tag - 标签 slug（可选）
 * @query keyword - 关键词搜索标题/摘要（可选）
 * @query page - 页码，默认 1（可选）
 * @query pageSize - 每页条数，默认 10，最大 50（可选）
 * @returns { code: 0, message: "success", data: { items: Post[], total: number, page: number, pageSize: number } }
 */
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
