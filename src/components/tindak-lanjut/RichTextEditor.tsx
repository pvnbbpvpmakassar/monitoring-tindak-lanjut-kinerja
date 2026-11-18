"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Strikethrough, Heading2, List, ListOrdered, Quote, Undo2, Redo2 } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2],
        },
      }),
      Placeholder.configure({
        placeholder: "Tuliskan rekomendasi hasil pemeriksaan...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: [
          "min-h-[180px] px-4 py-3 outline-none",
          "text-sm leading-7 text-slate-700",
          "[&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-800",
          "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
          "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6",
          "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#15406A]",
          "[&_blockquote]:bg-slate-50 [&_blockquote]:py-2 [&_blockquote]:pl-4",
          "[&_blockquote]:italic [&_blockquote]:text-slate-600",
          "[&_p]:mb-2",
        ].join(" "),
      },
    },
  });

  if (!editor) {
    return <div className="min-h-[180px] animate-pulse rounded-b-xl bg-slate-50" />;
  }

  const buttons = [
    {
      label: "Bold",
      active: editor.isActive("bold"),
      icon: <Bold size={16} />,
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      active: editor.isActive("italic"),
      icon: <Italic size={16} />,
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Strikethrough",
      active: editor.isActive("strike"),
      icon: <Strikethrough size={16} />,
      action: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Heading 2",
      active: editor.isActive("heading", { level: 2 }),
      icon: <Heading2 size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bullet List",
      active: editor.isActive("bulletList"),
      icon: <List size={16} />,
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered List",
      active: editor.isActive("orderedList"),
      icon: <ListOrdered size={16} />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Blockquote",
      active: editor.isActive("blockquote"),
      icon: <Quote size={16} />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 transition focus-within:border-[#15406A] focus-within:ring-2 focus-within:ring-[#15406A]/10">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            title={button.label}
            aria-label={button.label}
            aria-pressed={button.active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.action}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${button.active ? "bg-blue-100 text-[#15406A]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
          >
            {button.icon}
          </button>
        ))}

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <Undo2 size={16} />
        </button>

        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
