"use client";

import { type ReactNode, use, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";

const BASE = "/logged/pages/production/publications/flatplans";

const PUBLISH_CONFIRM_PHRASE = "Yes, the issue is ready for publication.";

export default function FlatplanByIdLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id_flatplan: string }>;
}) {
  const { id_flatplan } = use(params);
  const pathname = usePathname();
  const { setPageMeta } = usePageContent();

  const [publishOpen, setPublishOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [publishPhrase, setPublishPhrase] = useState("");

  const detailPath = `${BASE}/${id_flatplan}`;
  const normalizedPath = pathname?.replace(/\/$/, "") ?? "";
  const isFlatplanSlotPage =
    normalizedPath !== detailPath && normalizedPath.startsWith(`${detailPath}/`);

  const openPublish = useCallback(() => {
    setPublishPhrase("");
    setPublishOpen(true);
  }, []);

  const openPdf = useCallback(() => setPdfOpen(true), []);

  useEffect(() => {
    const navButton = isFlatplanSlotPage
      ? { label: "Volver al planillo", href: detailPath }
      : { label: "Back to Flatplans", href: BASE };

    setPageMeta({
      buttons: [
        { label: "Publish flatplan", onClick: openPublish },
        { label: "Download current flatplan as a PDF", onClick: openPdf },
        navButton,
      ],
    });
  }, [setPageMeta, detailPath, isFlatplanSlotPage, openPublish, openPdf]);

  const publishPhraseOk = publishPhrase === PUBLISH_CONFIRM_PHRASE;

  return (
    <>
      {children}

      {publishOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPublishOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-flatplan-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="publish-flatplan-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              Publish flatplan?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This action marks the issue as ready for publication. To confirm, type the
              following sentence exactly:
            </p>
            <p className="text-sm font-medium text-gray-800 mb-2 font-mono bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              {PUBLISH_CONFIRM_PHRASE}
            </p>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Confirmation
            </label>
            <input
              type="text"
              value={publishPhrase}
              onChange={(e) => setPublishPhrase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4"
              placeholder="Type the sentence above"
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPublishOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!publishPhraseOk}
                onClick={() => {
                  setPublishOpen(false);
                  setPublishPhrase("");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm publication
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPdfOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-flatplan-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="pdf-flatplan-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              Download flatplan as PDF
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              When generation is available, the exported file will appear below. For now this
              is a placeholder.
            </p>
            <div className="mb-4 flex min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-500">
              PDF download preview will appear here
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPdfOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setPdfOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Click to confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
