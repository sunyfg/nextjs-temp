"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "./tiptap-editor";

interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

interface EditClientProps {
  initialData: Record<string, unknown> | null;
  isNew: boolean;
  categories: Category[];
  tags: Tag[];
}

interface FormState {
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  content: string;
  status: string;
  isTop: boolean;
  isRecommend: boolean;
  categoryId: number | null;
  tagIds: number[];
  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  summary: "",
  coverImage: "",
  content: "",
  status: "DRAFT",
  isTop: false,
  isRecommend: false,
  categoryId: null,
  tagIds: [],
  seoTitle: "",
  seoKeywords: "",
  seoDescription: "",
};

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditClient({ initialData, isNew, categories, tags }: EditClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => {
    if (!initialData) return emptyForm;
    return {
      title: (initialData.title as string) ?? "",
      slug: (initialData.slug as string) ?? "",
      summary: (initialData.summary as string) ?? "",
      coverImage: (initialData.coverImage as string) ?? "",
      content: (initialData.content as string) ?? "",
      status: (initialData.status as string) ?? "DRAFT",
      isTop: (initialData.isTop as boolean) ?? false,
      isRecommend: (initialData.isRecommend as boolean) ?? false,
      categoryId: (initialData.categoryId as number | null) ?? null,
      tagIds: (initialData.tagIds as number[]) ?? [],
      seoTitle: (initialData.seoTitle as string) ?? "",
      seoKeywords: (initialData.seoKeywords as string) ?? "",
      seoDescription: (initialData.seoDescription as string) ?? "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [showSeo, setShowSeo] = useState(false);

  // Auto-generate slug for new posts
  const isAutoSlugging = useRef(true);
  useEffect(() => {
    if (isNew && isAutoSlugging.current && form.title) {
      isAutoSlugging.current = true;
      const slug = toSlug(form.title);
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.title, isNew]);

  // Debounced content for auto-save indicator (optional)
  const [saved, setSaved] = useState(true);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleTag(tagId: number) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  }

  async function handleSave(status?: string) {
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      status: status ?? form.status,
    };

    const url = isNew
      ? "/api/admin/blogs"
      : `/api/admin/blogs/${initialData!.id}`;

    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.code === 0) {
        setSaved(true);
        router.push("/admin/blogs");
      } else {
        setError(json.message || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  // Preview in new tab
  const handlePreview = useCallback(() => {
    const blogSlug = isNew ? form.slug : (initialData?.slug as string) || form.slug;
    if (blogSlug) {
      window.open(`/blog/${blogSlug}`, "_blank");
    }
  }, [form.slug, initialData, isNew]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {isNew ? "写文章" : "编辑文章"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/blogs")}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            预览
          </button>
          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            保存草稿
          </button>
          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            发布文章
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Title */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">文章标题 *</label>
            <input
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="输入文章标题"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </fieldset>

          {/* Slug */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">
              访问路径 slug *
            </label>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                isAutoSlugging.current = false;
                updateField("slug", e.target.value);
              }}
              placeholder="article-url-slug"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </fieldset>

          {/* Summary */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">文章摘要</label>
            <textarea
              value={form.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              rows={2}
              placeholder="文章摘要，用于列表页展示"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </fieldset>

          {/* Cover Image */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">封面图</label>
            <div className="flex items-center gap-3">
              <input
                value={form.coverImage}
                onChange={(e) => updateField("coverImage", e.target.value)}
                placeholder="输入图片 URL"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              {form.coverImage && (
                <img
                  src={form.coverImage}
                  alt="cover preview"
                  className="h-12 w-20 flex-shrink-0 rounded object-cover border border-zinc-200 dark:border-zinc-700"
                />
              )}
            </div>
          </fieldset>

          {/* Rich Text Content */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">文章内容</label>
            <TiptapEditor
              content={form.content}
              onChange={(html) => updateField("content", html)}
            />
          </fieldset>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">文章状态</label>
            <p className="text-sm font-medium text-black dark:text-zinc-50">
              {form.status === "PUBLISHED" ? "已发布" : "草稿"}
            </p>
          </fieldset>

          {/* Category */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">文章分类</label>
            <select
              value={form.categoryId ?? ""}
              onChange={(e) =>
                updateField("categoryId", e.target.value ? Number(e.target.value) : null)
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="">未分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </fieldset>

          {/* Tags */}
          <fieldset className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">文章标签</label>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
              {tags.length === 0 && (
                <p className="p-2 text-xs text-zinc-400">暂无标签</p>
              )}
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                  />
                  <span className="text-black dark:text-zinc-50">{tag.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Options */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isTop}
                onChange={(e) => updateField("isTop", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-black dark:text-zinc-50">置顶</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRecommend}
                onChange={(e) => updateField("isRecommend", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-black dark:text-zinc-50">推荐</span>
            </label>
          </fieldset>

          {/* SEO */}
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showSeo ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            SEO 设置
          </button>

          {showSeo && (
            <div className="flex flex-col gap-3">
              <fieldset className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">SEO 标题</label>
                <input
                  value={form.seoTitle}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  placeholder="自定义 SEO 标题"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </fieldset>
              <fieldset className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">SEO 关键词</label>
                <input
                  value={form.seoKeywords}
                  onChange={(e) => updateField("seoKeywords", e.target.value)}
                  placeholder="关键词，逗号分隔"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </fieldset>
              <fieldset className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">SEO 描述</label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  rows={2}
                  placeholder="SEO 描述"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </fieldset>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
