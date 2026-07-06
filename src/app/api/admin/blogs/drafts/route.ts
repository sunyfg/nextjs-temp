import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/blogs/drafts - 获取博客草稿
 * @auth 需要登录（401）
 * @query postId - 关联的文章ID（与slug二选一）
 * @query slug - 文章URL别名（与postId二选一）
 * @returns { code: 0, data: PostDraft | null }
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 401, message: "Unauthorized" });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId")?.trim();
  const slug = searchParams.get("slug")?.trim();

  // Must have either postId or slug
  if (!postId && !slug) {
    return Response.json({ code: 400, message: "postId or slug is required" });
  }

  // Get blog user for this session
  const blogUser = await prisma.blogUser.findFirst({
    orderBy: { id: "asc" },
  });
  if (!blogUser) {
    return Response.json({ code: 404, message: "blog user not found" });
  }

  const where: Record<string, unknown> = { authorId: blogUser.id };

  if (postId) {
    // For existing posts: lookup draft by postId
    where.postId = Number(postId);
    // OR fall back to slug + authorId
    const draft = await prisma.postDraft.findFirst({ where: { postId: Number(postId), authorId: blogUser.id } });
    if (draft) {
      return Response.json({ code: 0, message: "success", data: draft });
    }
    // Fall back to slug lookup using the post's slug
    const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
    if (post?.slug) {
      const slugDraft = await prisma.postDraft.findUnique({
        where: { authorId_slug: { authorId: blogUser.id, slug: post.slug } },
      });
      if (slugDraft) {
        return Response.json({ code: 0, message: "success", data: slugDraft });
      }
    }
  }

  if (slug) {
    const draft = await prisma.postDraft.findUnique({
      where: { authorId_slug: { authorId: blogUser.id, slug } },
    });
    if (draft) {
      return Response.json({ code: 0, message: "success", data: draft });
    }
  }

  return Response.json({ code: 0, message: "success", data: null });
}

/**
 * POST /api/admin/blogs/drafts - 创建/更新草稿（upsert，按 authorId+slug 唯一）
 * @auth 需要登录（401）
 * @body title - 标题（必填）
 * @body slug - URL别名（必填，用于upsert标识）
 * @body summary - 摘要
 * @body coverImage - 封面图
 * @body content - HTML内容
 * @body isTop - 是否置顶
 * @body isRecommend - 是否推荐
 * @body categoryId - 分类ID
 * @body tagIds - 标签ID数组
 * @body postId - 关联的文章ID（编辑已有文章时传入）
 * @returns { code: 0, data: PostDraft }
 */
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

  // Get blog user for this session
  const blogUser = await prisma.blogUser.findFirst({
    orderBy: { id: "asc" },
  });
  if (!blogUser) {
    return Response.json({ code: 404, message: "blog user not found" });
  }

  const authorId = body.authorId ? Number(body.authorId) : blogUser.id;
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

  // Upsert draft: use authorId + slug as unique identifier
  const draft = await prisma.postDraft.upsert({
    where: { authorId_slug: { authorId, slug: body.slug } },
    create: {
      postId: body.postId ? Number(body.postId) : null,
      title: body.title,
      slug: body.slug,
      summary: typeof body.summary === "string" ? body.summary : null,
      coverImage: typeof body.coverImage === "string" ? body.coverImage : null,
      content: body.content || "",
      contentText: body.content ? stripHtml(body.content).slice(0, 5000) : null,
      isTop: body.isTop === true,
      isRecommend: body.isRecommend === true,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : null,
      seoKeywords: typeof body.seoKeywords === "string" ? body.seoKeywords : null,
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription : null,
      tagIds: Array.isArray(body.tagIds) ? JSON.stringify(body.tagIds) : null,
      authorId,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
    },
    update: {
      title: body.title,
      summary: typeof body.summary === "string" ? body.summary : null,
      coverImage: typeof body.coverImage === "string" ? body.coverImage : null,
      content: body.content || "",
      contentText: body.content ? stripHtml(body.content).slice(0, 5000) : null,
      isTop: body.isTop === true,
      isRecommend: body.isRecommend === true,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : null,
      seoKeywords: typeof body.seoKeywords === "string" ? body.seoKeywords : null,
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription : null,
      tagIds: Array.isArray(body.tagIds) ? JSON.stringify(body.tagIds) : null,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      postId: body.postId ? Number(body.postId) : null,
    },
  });

  return Response.json({ code: 0, message: "草稿保存成功", data: draft });
}
