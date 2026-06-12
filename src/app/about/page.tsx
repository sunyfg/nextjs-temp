import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about this Next.js application",
};

export default function About() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          About
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This is the about page. Edit <code className="font-mono text-sm text-zinc-800 dark:text-zinc-200">src/app/about/page.tsx</code> to get started.
        </p>
      </main>
    </div>
  );
}
