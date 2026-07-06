"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FullPageSkeleton } from "@/app/admin/_components/table-skeleton";
import { message } from "antd";

interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "",
  slug: "",
};

type FormFields = typeof emptyForm;

export default function TagsClient() {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchName);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchName]);

  const fetchTags = useCallback(async (name?: string) => {
    const params = name ? `?name=${encodeURIComponent(name)}` : "";
    const res = await fetch(`/api/admin/tags${params}`);
    const json = await res.json();
    if (json.code === 0) setTags(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTags(debouncedSearch);
  }, [fetchTags, debouncedSearch]);

  // Auto-generate slug from name
  function toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string, isCreate: boolean) {
    if (isCreate) {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: toSlug(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, name: value }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.code === 0) {
      setForm(emptyForm);
      setShowCreateModal(false);
      fetchTags();
    } else {
      setError(json.message || "创建失败");
    }
  }

  function startEdit(tag: Tag) {
    setEditingTag(tag);
    setError("");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTag) return;
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    const res = await fetch(`/api/admin/tags/${editingTag.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingTag(null);
      fetchTags();
    } else {
      setError(json.message || "更新失败");
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/tags/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeletingTag(null);
      fetchTags();
    } else {
      message.error(json.message || "删除失败");
    }
  }

  if (loading) {
    return <FullPageSkeleton withToolbar />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        标签管理
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        管理博客文章标签。
      </p>

      {/* Toolbar: search + create */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="搜索标签名称..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 pl-9 text-sm text-black outline-none transition-colors focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="shrink-0 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + 新增标签
        </button>
      </div>

      {/* Tags table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">名称</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Slug</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tags.map((tag) => (
              <tr key={tag.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3 text-black dark:text-zinc-50">{tag.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {tag.slug}
                </td>
                <td className="flex gap-2 px-4 py-3">
                  <button
                    onClick={() => startEdit(tag)}
                    className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeletingTag(tag)}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {tags.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-400">
                  暂无标签
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              新增标签
            </h3>
            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">名称 *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value, true)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Slug *</label>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setForm(emptyForm); setError(""); }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              编辑标签
            </h3>
            <form onSubmit={handleUpdate} className="mt-4 flex flex-col gap-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">名称 *</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingTag.name}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Slug *</label>
                  <input
                    name="slug"
                    required
                    defaultValue={editingTag.slug}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 font-mono text-xs"
                  />
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingTag(null); setError(""); }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              确认删除
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              确定要删除标签{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {deletingTag.name}
              </span>
              {" "}吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingTag(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingTag.id)}
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
