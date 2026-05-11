"use client";

import React, { FC, useEffect, useState } from "react";
import { parseDateFields } from "@/app/logged/logged_components/date_components/DateInputs";
import { EditContentsModalFooter } from "./modal_edit_contents_components/EditContentsModalFooter";
import { EditContentsValueArea } from "./modal_edit_contents_components/EditContentsValueArea";
import type { EditContentsModalProps } from "./modal_edit_contents_components/types";

export type { EditContentsModalProps } from "./modal_edit_contents_components/types";

const EditContentsModal: FC<EditContentsModalProps> = ({
  isOpen,
  initialValue,
  title = "Edit contents",
  onSave,
  onCancel,
  isRichText,
}) => {
  const [currentValue, setCurrentValue] = useState<string>(initialValue);
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");
  const useRichEditor = isRichText ?? title === "Edit contents";

  useEffect(() => {
    if (isOpen) {
      setCurrentValue(initialValue);
      const p = parseDateFields(initialValue);
      setDateDay(p.day);
      setDateMonth(p.month);
      setDateYear(p.year);
    }
  }, [initialValue, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter" && !event.shiftKey) {
        const hasChanged = currentValue !== initialValue;
        if (hasChanged) {
          event.preventDefault();
          onSave(currentValue);
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel, currentValue, initialValue, onSave]);

  if (!isOpen) {
    return null;
  }

  const isDateField = title.toLowerCase().includes("date");
  const hasChanged = currentValue !== initialValue;

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleSaveClick = () => {
    if (!hasChanged) return;
    onSave(currentValue);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={handleModalClick}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          onClick={onCancel}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">{title}</h2>

        <EditContentsValueArea
          isDateField={isDateField}
          useRichEditor={useRichEditor}
          currentValue={currentValue}
          onChangeCurrentValue={setCurrentValue}
          dateDay={dateDay}
          dateMonth={dateMonth}
          dateYear={dateYear}
          setDateDay={setDateDay}
          setDateMonth={setDateMonth}
          setDateYear={setDateYear}
        />

        <EditContentsModalFooter hasChanged={hasChanged} onCancel={onCancel} onSaveClick={handleSaveClick} />
      </div>
    </div>
  );
};

export default EditContentsModal;
