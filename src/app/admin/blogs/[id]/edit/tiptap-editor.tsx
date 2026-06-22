"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

type ToolbarButton = {
  label: string;
  action: () => void;
  isActive: boolean;
  title?: string;
};

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const buttons: ToolbarButton[] = [
    { label: "B", action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), title: "粗体" },
    { label: "I", action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), title: "斜体" },
    { label: "U", action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline"), title: "下划线" },
    { label: "S", action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), title: "删除线" },
    { label: "|", action: () => {}, isActive: false, title: "" },
    { label: "H1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive("heading", { level: 1 }), title: "标题1" },
    { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }), title: "标题2" },
    { label: "H3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive("heading", { level: 3 }), title: "标题3" },
    { label: "|", action: () => {}, isActive: false, title: "" },
    { label: "•", action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList"), title: "无序列表" },
    { label: "1.", action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList"), title: "有序列表" },
    { label: "❝", action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote"), title: "引用" },
    { label: "</>", action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive("codeBlock"), title: "代码块" },
    { label: "—", action: () => editor.chain().focus().setHorizontalRule().run(), isActive: false, title: "分割线" },
    { label: "|", action: () => {}, isActive: false, title: "" },
    { label: "↩", action: () => editor.chain().focus().undo().run(), isActive: false, title: "撤销" },
    { label: "↪", action: () => editor.chain().focus().redo().run(), isActive: false, title: "重做" },
  ];

  function addLink() {
    const url = prompt("输入链接地址：");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  function addImage() {
    const url = prompt("输入图片地址：");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
      {buttons.map((btn, i) =>
        btn.label === "|" ? (
          <span key={i} className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
        ) : (
          <button
            key={i}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              btn.isActive
                ? "bg-zinc-800 text-white dark:bg-white dark:text-black"
                : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {btn.label}
          </button>
        ),
      )}
      <span className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
      <button
        type="button"
        onClick={addLink}
        title="插入链接"
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          editor.isActive("link")
            ? "bg-zinc-800 text-white dark:bg-white dark:text-black"
            : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        🔗
      </button>
      <button
        type="button"
        onClick={addImage}
        title="插入图片"
        className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        🖼
      </button>
    </div>
  );
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800" },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded" },
      }),
      Placeholder.configure({
        placeholder: "开始撰写文章内容...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-zinc dark:prose-invert max-w-none min-h-[400px] px-4 py-3 outline-none text-sm",
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
