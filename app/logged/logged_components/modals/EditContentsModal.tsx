"use client";

import React, { FC, useEffect, useState } from "react";
import { DateInputs, parseDateFields, buildDateStr } from "@/app/logged/logged_components/DateInputs";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

interface EditContentsModalProps {
  isOpen: boolean;
  initialValue: string;
  title?: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  isRichText?: boolean;
}

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
  // Rich text (B, I, lists, alignment) only for content text fields, not for title/subtitle/company/date/image URL
  const useRichEditor = isRichText ?? (title === "Edit contents");

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
        // Enter guarda (Shift+Enter crea nueva línea en textarea)
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

  // Detectar si es un campo de fecha basándose en el título
  const isDateField = title.toLowerCase().includes("date") || title.toLowerCase().includes("fecha");

  const hasChanged = currentValue !== initialValue;

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleSaveClick = () => {
    if (!hasChanged) {
      return;
    }
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
        {/* Botón de cerrar (X) */}
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          onClick={onCancel}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          {title}
        </h2>

        {isDateField ? (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Fecha</div>
            <DateInputs
              day={dateDay}
              month={dateMonth}
              year={dateYear}
              onDayChange={(v) => {
                setDateDay(v);
                setCurrentValue(buildDateStr(v, dateMonth, dateYear));
              }}
              onMonthChange={(v) => {
                setDateMonth(v);
                setCurrentValue(buildDateStr(dateDay, v, dateYear));
              }}
              onYearChange={(v) => {
                setDateYear(v);
                setCurrentValue(buildDateStr(dateDay, dateMonth, v));
              }}
            />
          </div>
        ) : useRichEditor ? (
          <div className="mb-4">
            <RichTextEditor
              value={currentValue}
              onChange={setCurrentValue}
              placeholder="Escriba aquí..."
              minHeight="192px"
            />
          </div>
        ) : (
          <textarea
            className="mb-4 h-48 w-full resize-none rounded-md border border-gray-300 p-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={currentValue}
            onChange={(event) => setCurrentValue(event.target.value)}
          />
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!hasChanged}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white
              ${
                hasChanged
                  ? "cursor-pointer bg-blue-600 hover:bg-blue-700"
                  : "cursor-not-allowed bg-blue-300"
              }`}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditContentsModal;
