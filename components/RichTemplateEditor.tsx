"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Heading2, Italic, List, Undo2 } from "lucide-react";

export function RichTemplateEditor({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [html, setHtml] = useState(defaultValue || "<p></p>");
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: defaultValue || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-editor-surface",
      },
    },
  });

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading">
          <Heading2 size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="List">
          <List size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().undo().run()} aria-label="Undo">
          <Undo2 size={16} />
        </button>
        <span>{"{{orderId}} {{email}} {{productName}} {{totalAmount}}"}</span>
      </div>
      <EditorContent editor={editor} />
      <input name={name} value={html} readOnly hidden />
    </div>
  );
}
