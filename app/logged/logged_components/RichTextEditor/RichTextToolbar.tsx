"use client";

import React, { FC, useRef } from "react";

interface RichTextToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onCommand?: () => void;
}

const RichTextToolbar: FC<RichTextToolbarProps> = ({
  editorRef,
  onCommand,
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

  return (
    <div
      className="flex flex-wrap items-center gap-1 border border-gray-300 border-b-0 rounded-t-xl bg-gray-100 px-2 py-1"
      role="toolbar"
      aria-label="Formato de texto"
    >
      <button
        type="button"
        title="Negrita"
        onMouseDown={(e) => handleMouseDown(e, () => runCommand("bold"))}
        className="min-w-[28px] rounded px-2 py-1 font-bold hover:bg-gray-200"
      >
        B
      </button>
      <button
        type="button"
        title="Cursiva"
        onMouseDown={(e) => handleMouseDown(e, () => runCommand("italic"))}
        className="min-w-[28px] rounded px-2 py-1 italic hover:bg-gray-200"
      >
        I
      </button>

      <span className="mx-1 h-5 w-px bg-gray-400" aria-hidden />

      <button
        type="button"
        title="Alinear a la izquierda"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyLeft"))
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        ←
      </button>
      <button
        type="button"
        title="Centrar"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyCenter"))
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        ⊟
      </button>
      <button
        type="button"
        title="Alinear a la derecha"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyRight"))
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        →
      </button>
      <button
        type="button"
        title="Justificado"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("justifyFull"))
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        ≡
      </button>

      <span className="mx-1 h-5 w-px bg-gray-400" aria-hidden />

      <button
        type="button"
        title="Lista con viñetas"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("insertUnorderedList"))
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        •
      </button>
      <button
        type="button"
        title="Lista con letras (a, b, c...)"
        onMouseDown={(e) =>
          handleMouseDown(e, handleListOrderedLetters)
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        a/b/c
      </button>
      <button
        type="button"
        title="Lista numerada"
        onMouseDown={(e) =>
          handleMouseDown(e, () => runCommand("insertOrderedList"))
        }
        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
      >
        1.2.3
      </button>
    </div>
  );
};

export default RichTextToolbar;
