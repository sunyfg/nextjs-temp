import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Blog posts",
};

interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  category: { id: number; name: string; slug: string } | null;
  tags: { id: number; name: string; slug: string }[];
  author: { id: number; username: string; displayName: string | null };
  publishedAt: string;
  viewCount: number;
}

interface ListData {
  items: Post[];
  total: number;
  page: number;
  pageSize: number;
}

async function getPosts(): Promise<ListData> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/blogs`, { cache: "no-store" });
    const json = await res.json();
    return json.code === 0 ? json.data : { items: [], total: 0, page: 1, pageSize: 10 };
  } catch {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogList() {
  const data = await getPosts();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col px-6 py-16 sm:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Blog
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Thoughts, stories, and ideas.
        </p>

        <div className="mt-10 flex flex-col gap-8">
          {data.items.map((post) => (
            <article key={post.id} className="group">
              <Link href={`/blogs/${post.slug}`}>
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="mb-4 h-48 w-full rounded-xl object-cover"
                  />
                )}
                <h2 className="text-xl font-semibold text-black transition-colors group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-400">
                  {post.title}
                </h2>
                {post.summary && (
                  <p className="mt-2 line-clamp-2 text-zinc-600 dark:text-zinc-400">
                    {post.summary}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                  {post.category && (
                    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {post.category.name}
                    </span>
                  )}
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-zinc-400 dark:text-zinc-500"
                    >
                      #{tag.name}
                    </span>
                  ))}
                  <time>{formatDate(post.publishedAt)}</time>
                </div>
              </Link>
            </article>
          ))}
          {data.items.length === 0 && (
            <p className="py-12 text-center text-zinc-500 dark:text-zinc-400">
              No posts yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
