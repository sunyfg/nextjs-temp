import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

async function getPost(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/blog/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.code === 0 ? json.data : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title,
    description: post.content,
  };
}

export default async function BlogPost({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {post.title}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {post.content}
        </p>
      </main>
    </div>
  );
}
