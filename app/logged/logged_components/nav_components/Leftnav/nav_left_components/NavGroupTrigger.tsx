"use client";

import { FC } from "react";
import ChevronDownSvg from "../../../svg/ChevronDownSvg";
import ChevronRightSvg from "../../../svg/ChevronRightSvg";

type NavGroupTriggerProps = {
  label: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
};

const NavGroupTrigger: FC<NavGroupTriggerProps> = ({ label, isOpen, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2 rounded-md py-2 pl-2 pr-3 text-left text-sm transition-colors ${
      isActive ? "font-medium text-gray-100" : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
    }`}
    aria-expanded={isOpen}
  >
    <span className="flex shrink-0 text-gray-500" aria-hidden>
      {isOpen ? <ChevronDownSvg size={14} /> : <ChevronRightSvg size={14} />}
    </span>
    <span className="uppercase">{label}</span>
  </button>
);

export default NavGroupTrigger;
