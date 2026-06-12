import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-6xl font-bold tracking-tight text-black dark:text-zinc-50">
          404
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Page not found.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Go home
        </Link>
      </main>
    </div>
  );
}
