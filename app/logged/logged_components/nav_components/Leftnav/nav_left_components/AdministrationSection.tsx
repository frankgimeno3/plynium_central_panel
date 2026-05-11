"use client";

import { FC } from "react";
import NavLink from "./NavLink";
import NavSectionTrigger from "./NavSectionTrigger";

type AdministrationSectionProps = {
  pathname: string;
  inAdministration: boolean;
  isAdministrationSelected: boolean;
  setIsAdministrationSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const ADMINISTRATION_LINKS = [
  {
    href: "/logged/pages/administration/orders",
    label: "Orders",
    prefix: "/logged/pages/administration/orders",
  },
  {
    href: "/logged/pages/administration/banks",
    label: "Banks",
    prefix: "/logged/pages/administration/banks",
  },
  {
    href: "/logged/pages/administration/issued-invoices",
    label: "Issued invoices",
    prefix: "/logged/pages/administration/issued-invoices",
  },
  {
    href: "/logged/pages/administration/provider-invoices",
    label: "Provider invoices",
    prefix: "/logged/pages/administration/provider-invoices",
  },
  {
    href: "/logged/pages/administration/providers",
    label: "Providers",
    prefix: "/logged/pages/administration/providers",
  },
  {
    href: "/logged/pages/administration/agents",
    label: "Agents",
    prefix: "/logged/pages/administration/agents",
  },
] as const;

const AdministrationSection: FC<AdministrationSectionProps> = ({
  pathname,
  inAdministration,
  isAdministrationSelected,
  setIsAdministrationSelected,
}) => (
  <div className="px-3">
    <NavSectionTrigger
      label="Administration"
      isOpen={isAdministrationSelected}
      isActive={inAdministration}
      onClick={() => setIsAdministrationSelected(!isAdministrationSelected)}
    />
    {isAdministrationSelected ? (
      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-700 bg-gray-800/50 pl-2 pr-3 pt-2 pb-3">
        {ADMINISTRATION_LINKS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname.startsWith(item.prefix)}
          />
        ))}
      </div>
    ) : null}
  </div>
);

export default AdministrationSection;
