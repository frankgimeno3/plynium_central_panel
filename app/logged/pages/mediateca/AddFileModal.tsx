"use client";

import React, { FC, useState, useRef } from "react";

type FileType = "pdf" | "image";

interface AddFileModalProps {
  open: boolean;
  onClose: () => void;
  folderPath: string;
  onSuccess: () => void;
}

const ACCEPT_BY_TYPE: Record<FileType, string> = {
  pdf: ".pdf,application/pdf",
  image: "image/*,.jpg,.jpeg,.png,.gif,.webp",
};

const AddFileModal: FC<AddFileModalProps> = ({ open, onClose, folderPath, onSuccess }) => {
  const [step, setStep] = useState<"type" | "attach" | "success">("type");
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("type");
    setFileType(null);
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChooseType = (type: FileType) => {
    setFileType(type);
    setFile(null);
    setError(null);
    setStep("attach");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setError(null);
  };

  const validateAndSubmit = () => {
    setError(null);
    if (!file) {
      setError("Please select a file.");
      return;
    }
    if (fileType === "pdf") {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file.");
        return;
      }
    } else {
      const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!imageTypes.includes(file.type)) {
        setError("Please select an image (JPEG, PNG, GIF or WebP).");
        return;
      }
    }
    // Mock: in a real app you would upload the file
    setStep("success");
  };

  const handleContinue = () => {
    onSuccess();
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
        {step === "type" && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add file</h3>
            <p className="text-sm text-gray-600 mb-4">Choose file type:</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChooseType("pdf")}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors text-sm font-medium text-gray-800"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => handleChooseType("image")}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors text-sm font-medium text-gray-800"
              >
                Image
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === "attach" && fileType && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add file</h3>
            <p className="text-sm text-gray-600 mb-2">Type: <span className="font-medium capitalize">{fileType}</span></p>
            <p className="text-xs text-gray-500 mb-4">Folder: <span className="font-mono">{folderPath || "(root)"}</span></p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_BY_TYPE[fileType]}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 text-sm font-medium text-gray-700"
              >
                Attach
              </button>
              {file && (
                <p className="text-sm text-gray-600 truncate" title={file.name}>
                  Selected: {file.name}
                </p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={() => { setStep("type"); setFileType(null); setFile(null); setError(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={validateAndSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
              >
                Upload
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success</h3>
            <p className="text-sm text-gray-600 mb-4">File has been added to the folder.</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleContinue}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddFileModal;
