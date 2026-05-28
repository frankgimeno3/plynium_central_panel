"use client";

import React from "react";

import { PAGE_THUMB_ASPECT } from "../constants";

function PageBoxFrame({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full ${className}`}
      style={{ aspectRatio: PAGE_THUMB_ASPECT }}
    >
      {children}
    </div>
  );
}

export function StartsOnRightPlaceholder() {
  return (
    <PageBoxFrame className="rounded-sm border border-gray-200/70 bg-white/40 shadow-md">
      <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium text-gray-500">
        the article starts on a right page
      </div>
    </PageBoxFrame>
  );
}

export function AddNewPagePlaceholder({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <PageBoxFrame className="rounded-sm border border-dashed border-gray-300 bg-white/40 shadow-md transition group-hover:border-blue-400 group-hover:bg-white/70">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <span
            aria-hidden
            className="text-5xl font-light leading-none text-gray-400 transition group-hover:text-blue-500"
          >
            +
          </span>
          <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-600">
            {disabled ? "Adding page…" : "Click to add a new page on the article"}
          </span>
        </div>
      </PageBoxFrame>
    </button>
  );
}

export function EmptyPlaceholder() {
  return <PageBoxFrame className="opacity-0" />;
}

