"use client";

import { FC } from "react";
import ChevronDownSvg from "../../../svg/ChevronDownSvg";
import ChevronRightSvg from "../../../svg/ChevronRightSvg";

type NavSectionTriggerProps = {
  label: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
};

const NavSectionTrigger: FC<NavSectionTriggerProps> = ({
  label,
  isOpen,
  isActive,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2 rounded-r-lg border-l-2 py-2 pl-2.5 pr-3 text-left transition-colors ${
      isActive
        ? "border-blue-500 bg-blue-950/40 font-semibold text-gray-100"
        : "border-transparent text-gray-300 hover:bg-gray-800 hover:text-gray-100"
    }`}
    aria-expanded={isOpen}
  >
    <span className="flex shrink-0 text-gray-500 group-hover:text-gray-400" aria-hidden>
      {isOpen ? <ChevronDownSvg size={18} /> : <ChevronRightSvg size={18} />}
    </span>
    <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
  </button>
);

export default NavSectionTrigger;
