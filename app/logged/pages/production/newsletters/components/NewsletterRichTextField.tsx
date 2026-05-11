"use client";

import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

type NewsletterRichTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  labelClassName?: string;
};

export function NewsletterRichTextField({
  label,
  value,
  onChange,
  placeholder,
  minHeight = "120px",
  className = "",
  labelClassName = "block text-xs text-gray-500 uppercase mb-1",
}: NewsletterRichTextFieldProps) {
  return (
    <div className={className}>
      <label className={labelClassName}>{label}</label>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
      />
    </div>
  );
}
