"use client";

import { FC, useEffect, useState } from "react";
import { AddTagModalForm } from "./modal_add_tag_components/AddTagModalForm";
import type { AddTagModalProps } from "./modal_add_tag_components/types";

export type { AddTagModalProps } from "./modal_add_tag_components/types";

const AddTagModal: FC<AddTagModalProps> = ({
  isOpen,
  initialValue = "",
  onSave,
  onCancel,
}) => {
  const [currentValue, setCurrentValue] = useState<string>(initialValue);

  useEffect(() => {
    if (isOpen) {
      setCurrentValue(initialValue);
    }
  }, [initialValue, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter") {
        const trimmedValue = currentValue.trim();
        const hasChanged = trimmedValue !== initialValue.trim() && trimmedValue !== "";
        if (hasChanged) {
          event.preventDefault();
          onSave(trimmedValue);
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

  const trimmedValue = currentValue.trim();
  const handleSaveClick = () => {
    const hasChanged = trimmedValue !== initialValue.trim() && trimmedValue !== "";
    if (!hasChanged) return;
    onSave(trimmedValue);
  };

  return (
    <AddTagModalForm
      currentValue={currentValue}
      initialValueTrimmedBasis={initialValue.trim()}
      onChangeValue={setCurrentValue}
      onCancel={onCancel}
      onSave={handleSaveClick}
    />
  );
};

export default AddTagModal;
