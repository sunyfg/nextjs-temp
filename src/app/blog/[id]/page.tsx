import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Blog Post ${id}`,
    description: `Reading blog post ${id}`,
  };
}

export default async function BlogPost({ params }: Props) {
  const { id } = await params;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Blog Post {id}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This is the blog post page for ID: <code className="font-mono text-sm text-zinc-800 dark:text-zinc-200">{id}</code>.
        </p>
      </main>
    </div>
  );
}
