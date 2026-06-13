"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Code2, Heading2, Italic, List, MousePointerClick, Type, Undo2 } from "lucide-react";
import { templateVariables } from "@/lib/email-defaults";

type TemplatePreset = {
  label: string;
  value: string;
};

export function RichTemplateEditor({
  name,
  defaultValue,
  onChange,
  presets = [],
}: {
  name: string;
  defaultValue: string;
  onChange?: (html: string) => void;
  presets?: TemplatePreset[];
}) {
  const [html, setHtml] = useState(defaultValue || "<p></p>");
  const [mode, setMode] = useState<"rich" | "html">(isLayoutHtml(defaultValue) ? "html" : "rich");
  const inputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: defaultValue || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const nextHtml = editor.getHTML();
      updateHtml(nextHtml);
    },
    editorProps: {
      attributes: {
        class: "rich-editor-surface",
      },
    },
  });

  function updateHtml(nextHtml: string) {
    if (inputRef.current) inputRef.current.value = nextHtml;
    setHtml(nextHtml);
    onChange?.(nextHtml);
  }

  function applyPreset(preset: TemplatePreset) {
    setMode("html");
    updateHtml(preset.value);
  }

  function switchToRichText() {
    setMode("rich");
    editor?.commands.setContent(html || "<p></p>", { emitUpdate: false });
  }

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" onClick={switchToRichText} className={mode === "rich" ? "is-active" : ""} aria-label="富文本模式">
          <Type size={16} />
        </button>
        <button type="button" onClick={() => setMode("html")} className={mode === "html" ? "is-active" : ""} aria-label="HTML 源码模式">
          <Code2 size={16} />
        </button>
        {presets.map((preset) => (
          <button
            type="button"
            className="rich-toolbar-preset"
            key={preset.label}
            onClick={() => applyPreset(preset)}
            aria-label={preset.label}
            title={preset.label}
          >
            <MousePointerClick size={16} />
            <span>{preset.label}</span>
          </button>
        ))}
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="加粗" disabled={mode !== "rich"}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="斜体" disabled={mode !== "rich"}>
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="标题" disabled={mode !== "rich"}>
          <Heading2 size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="列表" disabled={mode !== "rich"}>
          <List size={16} />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().undo().run()} aria-label="撤销" disabled={mode !== "rich"}>
          <Undo2 size={16} />
        </button>
        <span>{templateVariables.join(" ")}</span>
      </div>
      <div className="rich-editor-body">
        {mode === "rich" ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            className="rich-editor-source"
            value={html}
            onChange={(event) => updateHtml(event.target.value)}
            spellCheck={false}
          />
        )}
      </div>
      <input ref={inputRef} name={name} defaultValue={html} readOnly hidden />
    </div>
  );
}

function isLayoutHtml(value: string) {
  return /<(table|tbody|tr|td|div|span)\b/i.test(value);
}
