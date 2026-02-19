"use client";

import React, { FC } from "react";

interface ChevronDownSvgProps {
  size?: number;
  className?: string;
}

const ChevronDownSvg: FC<ChevronDownSvgProps> = ({ size = 16, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronDownSvg;
