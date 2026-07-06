"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FullPageSkeleton } from "@/app/admin/_components/table-skeleton";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  sort: 0,
  visible: true,
};

type FormFields = typeof emptyForm;

export default function CategoriesClient() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
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

  const fetchCategories = useCallback(async (name?: string) => {
    const params = name ? `?name=${encodeURIComponent(name)}` : "";
    const res = await fetch(`/api/admin/categories${params}`);
    const json = await res.json();
    if (json.code === 0) setCategories(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories(debouncedSearch);
  }, [fetchCategories, debouncedSearch]);

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

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.code === 0) {
      setForm(emptyForm);
      setShowCreateModal(false);
      fetchCategories();
    } else {
      setError(json.message || "创建失败");
    }
  }

  function startEdit(category: Category) {
    setEditingCategory(category);
    setError("");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const sort = Number(formData.get("sort"));
    const visible = formData.get("visible") === "on";

    const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description: description || null, sort, visible }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingCategory(null);
      fetchCategories();
    } else {
      setError(json.message || "更新失败");
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeletingCategory(null);
      fetchCategories();
    } else {
      alert(json.message || "删除失败");
    }
  }

  if (loading) {
    return <FullPageSkeleton withToolbar />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        分类管理
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        管理博客文章分类。
      </p>

      {/* Toolbar: search + create */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="搜索分类名称..."
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
          + 新增分类
        </button>
      </div>

      {/* Categories table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">名称</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Slug</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">描述</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">排序</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">可见</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {categories.map((cat) => (
              <tr key={cat.id} className="bg-white dark:bg-black">
                <td className="px-4 py-3 text-black dark:text-zinc-50">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {cat.slug}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {cat.description || "-"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{cat.sort}</td>
                <td className="px-4 py-3">
                  {cat.visible ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      可见
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      隐藏
                    </span>
                  )}
                </td>
                <td className="flex gap-2 px-4 py-3">
                  <button
                    onClick={() => startEdit(cat)}
                    className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                  暂无分类
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
              新增分类
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
                <fieldset className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">排序</label>
                  <input
                    type="number"
                    value={form.sort}
                    onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">可见</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={form.visible}
                      onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="text-sm text-black dark:text-zinc-50">
                      {form.visible ? "可见" : "隐藏"}
                    </span>
                  </label>
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
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              编辑分类
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
                    defaultValue={editingCategory.name}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Slug *</label>
                  <input
                    name="slug"
                    required
                    defaultValue={editingCategory.slug}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 font-mono text-xs"
                  />
                </fieldset>
                <fieldset className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">描述</label>
                  <textarea
                    name="description"
                    defaultValue={editingCategory.description ?? ""}
                    rows={2}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zig-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">排序</label>
                  <input
                    name="sort"
                    type="number"
                    defaultValue={editingCategory.sort}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </fieldset>
                <fieldset className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">可见</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
                    <input
                      name="visible"
                      type="checkbox"
                      defaultChecked={editingCategory.visible}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="text-sm text-black dark:text-zinc-50">
                      {editingCategory.visible ? "可见" : "隐藏"}
                    </span>
                  </label>
                </fieldset>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingCategory(null); setError(""); }}
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
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
              确认删除
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              确定要删除分类{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {deletingCategory.name}
              </span>
              {" "}吗？该分类下的文章将会失去分类关联。此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingCategory(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deletingCategory.id)}
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
