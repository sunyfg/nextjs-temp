import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  content: string;
  status: string;
  isTop: boolean;
  isRecommend: boolean;
  viewCount: number;
  seoTitle: string | null;
  seoKeywords: string | null;
  seoDescription: string | null;
  publishedAt: string;
  createdAt: string;
  category: { id: number; name: string; slug: string } | null;
  tags: { id: number; name: string; slug: string }[];
  author: { id: number; username: string; displayName: string | null };
}

async function getPost(id: string): Promise<Post | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/blogs/${id}`, { cache: "no-store" });
    const json = await res.json();
    return json.code === 0 ? json.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.summary || "",
    keywords: post.seoKeywords || undefined,
    openGraph: post.coverImage
      ? { images: [post.coverImage] }
      : undefined,
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPost({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <article className="flex w-full max-w-3xl flex-col px-6 py-16 sm:px-16">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-zinc-500 dark:text-zinc-500">
          <Link
            href="/blogs"
            className="hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800 dark:text-zinc-300">
            {post.title}
          </span>
        </nav>

        {/* Cover image */}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="mb-8 w-full rounded-xl object-cover"
          />
        )}

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-500">
          <span>
            {post.author.displayName || post.author.username}
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <time>{formatDate(post.publishedAt)}</time>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span>{post.viewCount} views</span>
          {post.category && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {post.category.name}
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs text-zinc-400 dark:text-zinc-500"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {post.summary && (
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 italic">
            {post.summary}
          </p>
        )}

        {/* Content */}
        <div
          className="mt-8 prose prose-zinc dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer nav */}
        <div className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <Link
            href="/blogs"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  );
}
