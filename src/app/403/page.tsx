import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <div className="w-full max-w-sm text-center">
        {/* Shield lock icon */}
        <svg
          className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
          <path d="M12 11v2" />
          <circle cx="12" cy="14" r="1" />
          <path d="M9 11v-1a3 3 0 1 1 6 0v1" />
        </svg>

        <h1 className="mt-6 text-7xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
          403
        </h1>

        <p className="mt-3 text-lg font-medium text-zinc-600 dark:text-zinc-400">
          无权访问管理后台
        </p>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400 dark:text-zinc-500">
          您的账号没有访问此页面的权限。
          <br />
          请联系管理员获取相应权限。
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            切换到其他账号
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
