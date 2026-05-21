"use client";

import React, { FC, useRef } from "react";

interface RichTextToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onCommand?: () => void;
  /** Detached floating toolbar (rounded box) vs. attached to editor chrome. */
  variant?: "attached" | "floating";
}

const RichTextToolbar: FC<RichTextToolbarProps> = ({
  editorRef,
  onCommand,
  variant = "attached",
}) => {
  const runCommand = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? "");
    onCommand?.();
  };

  const handleListOrderedLetters = () => {
    editorRef.current?.focus();
    document.execCommand("insertOrderedList", false, "");
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (sel && sel.rangeCount > 0 && editor) {
      let node: Node | null = sel.anchorNode;
      while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "OL") {
          (node as HTMLOListElement).setAttribute("type", "a");
          break;
        }
        node = node.parentNode;
      }
    }
    onCommand?.();
  };

  const handleMouseDown = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    fn();
  };

  const isFloating = variant === "floating";
  const shellClass = isFloating
    ? "flex flex-wrap items-center gap-1 rounded-xl border border-gray-600 bg-gray-600 px-2 py-1.5 text-gray-100 shadow-lg"
    : "flex flex-wrap items-center gap-1 border border-gray-300 border-b-0 rounded-t-xl bg-gray-100 px-2 py-1";
  const btnClass = isFloating
    ? "rounded px-2 py-1 text-sm text-gray-100 hover:bg-gray-500"
    : "rounded px-2 py-1 text-sm hover:bg-gray-200";
  const btnBoldClass = isFloating
    ? `${btnClass} min-w-[28px] font-bold`
    : `${btnClass} min-w-[28px] font-bold`;
  const btnItalicClass = isFloating
    ? `${btnClass} min-w-[28px] italic`
    : `${btnClass} min-w-[28px] italic`;
  const dividerClass = isFloating ? "mx-1 h-5 w-px bg-gray-400" : "mx-1 h-5 w-px bg-gray-400";

  return (
    <div
      className={shellClass}
      role="toolbar"
      aria-label="Formato de texto"
      data-pmc-rich-text-toolbar=""
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        title="Negrita"
        onMouseDown={(e) => handleMouseDown(e, () => runCommand("bold"))}
        className={btnBoldClass}
      >
        B
      </button>
      <button
        type="button"
        title="Cursiva"
        onMouseDown={(e) => handleMouseDown(e, () => runCommand("italic"))}
        className={btnItalicClass}
      >
        I
      </button>

      <span className={dividerClass} aria-hidden />

      <button
        type="button"
        title="Alinear a la izquierda"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyLeft"))
        }
        className={btnClass}
      >
        ←
      </button>
      <button
        type="button"
        title="Centrar"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyCenter"))
        }
        className={btnClass}
      >
        ⊟
      </button>
      <button
        type="button"
        title="Alinear a la derecha"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyRight"))
        }
        className={btnClass}
      >
        →
      </button>
      <button
        type="button"
        title="Justificado"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyFull"))
        }
        className={btnClass}
      >
        ≡
      </button>

      <span className={dividerClass} aria-hidden />

      <button
        type="button"
        title="Bullet list"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("insertUnorderedList"))
        }
        className={btnClass}
      >
        •
      </button>
      <button
        type="button"
        title="Lista con letras (a, b, c...)"
        onMouseDown={(e) =>
          handleMouseDown(e, handleListOrderedLetters)
        }
        className={btnClass}
      >
        a/b/c
      </button>
      <button
        type="button"
        title="Lista numerada"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("insertOrderedList"))
        }
        className={btnClass}
      >
        1.2.3
      </button>
    </div>
  );
};

export default RichTextToolbar;
