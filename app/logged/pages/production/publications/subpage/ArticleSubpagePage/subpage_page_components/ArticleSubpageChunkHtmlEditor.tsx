import React, { FC } from "react";

type ArticleSubpageChunkHtmlEditorProps = {
  chunkHtml: string;
  onChange: (html: string) => void;
  onBlur: (html: string) => void;
};

export const ArticleSubpageChunkHtmlEditor: FC<ArticleSubpageChunkHtmlEditorProps> = ({
  chunkHtml,
  onChange,
  onBlur,
}) => {
  return (
    <>
      <textarea
        rows={5}
        value={chunkHtml}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        placeholder="<p>Write HTML here…</p>"
        className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-700">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Live preview</p>
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: chunkHtml || "<em class='text-gray-400'>(empty)</em>",
          }}
        />
      </div>
    </>
  );
};
