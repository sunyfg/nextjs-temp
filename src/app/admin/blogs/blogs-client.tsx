"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FullPageSkeleton } from "@/app/dashboard/table-skeleton";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Author {
  id: number;
  username: string;
  displayName: string | null;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isTop: boolean;
  isRecommend: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  category: Category | null;
  tags: Tag[];
  author: Author;
}

interface ListData {
  items: Post[];
  total: number;
  page: number;
  pageSize: number;
}

const statusLabels: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ARCHIVED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

export default function BlogsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListData | null>(null);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Cache for category filter dropdown
  const [categories, setCategories] = useState<Category[]>([]);

  // Deleting state
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [keyword]);

  // Load categories for filter dropdown
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.code === 0) setCategories(json.data);
      })
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedKeyword) params.set("keyword", debouncedKeyword);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", String(page));
    params.set("pageSize", "20");

    const res = await fetch(`/api/admin/blogs?${params}`);
    const json = await res.json();
    if (json.code === 0) setData(json.data);
    setLoading(false);
  }, [debouncedKeyword, statusFilter, categoryFilter, startDate, endDate, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Re-fetch when filters change but don't reset page from debounce
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, startDate, endDate]);

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/blogs/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeletingPost(null);
      fetchPosts();
    } else {
      alert(json.message || "删除失败");
    }
  }

  async function handleToggleStatus(post: Post) {
    const newStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await fetch(`/api/admin/blogs/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (json.code === 0) {
      fetchPosts();
    } else {
      alert(json.message || "操作失败");
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  if (loading) {
    return <FullPageSkeleton withToolbar />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            博客管理
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            管理博客文章。
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/blogs/new/edit")}
          className="shrink-0 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + 写文章
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索标题/摘要..."
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">已发布</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="开始日期"
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <span className="text-xs text-zinc-400">至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="结束日期"
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {/* Blog table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">标题</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">分类</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">标签</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">状态</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">浏览</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">置顶</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">推荐</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">发布时间</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data?.items.map((post) => (
              <tr key={post.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt=""
                        className="h-10 w-14 flex-shrink-0 rounded object-cover"
                      />
                    )}
                    <span className="font-medium text-black dark:text-zinc-50 line-clamp-2">
                      {post.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {post.category?.name || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {post.tags.length === 0 && (
                      <span className="text-xs text-zinc-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[post.status]
                    }`}
                  >
                    {statusLabels[post.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {post.viewCount}
                </td>
                <td className="px-4 py-3">
                  {post.isTop ? (
                    <span className="text-sm text-orange-500">★</span>
                  ) : (
                    <span className="text-sm text-zinc-300 dark:text-zinc-600">☆</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {post.isRecommend ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      推荐
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(post.publishedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => router.push(`/admin/blogs/${post.id}/edit`)}
                      className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                    >
                      编辑
                    </button>
                    {post.status !== "PUBLISHED" ? (
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        发布
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className="rounded bg-yellow-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-yellow-700"
                      >
                        下架
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingPost(post)}
                      className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-400">
                  暂无文章
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            共 {data.total} 条，第 {data.page}/{totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              上一页
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              确认删除
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              确定要将文章{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {deletingPost.title}
              </span>{" "}
              移至回收站吗？
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingPost(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingPost.id)}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
