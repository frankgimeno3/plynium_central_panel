"use client";

import { FC } from "react";
import NavLink from "./NavLink";
import NavSectionTrigger from "./NavSectionTrigger";

type AccountManagementSectionProps = {
  pathname: string;
  inAccountManagement: boolean;
  isAccountManagementSelected: boolean;
  setIsAccountManagementSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const ACCOUNT_LINKS = [
  {
    href: "/logged/pages/account-management/customers_db",
    label: "Customers DB",
    prefix: "/logged/pages/account-management/customers_db",
  },
  {
    href: "/logged/pages/account-management/contacts_db",
    label: "Contacts DB",
    prefix: "/logged/pages/account-management/contacts_db",
  },
  {
    href: "/logged/pages/account-management/proposals",
    label: "Proposals",
    prefix: "/logged/pages/account-management/proposals",
  },
  {
    href: "/logged/pages/account-management/contracts",
    label: "Contracts",
    prefix: "/logged/pages/account-management/contracts",
  },
  {
    href: "/logged/pages/account-management/projects",
    label: "Projects",
    prefix: "/logged/pages/account-management/projects",
  },
] as const;

const AccountManagementSection: FC<AccountManagementSectionProps> = ({
  pathname,
  inAccountManagement,
  isAccountManagementSelected,
  setIsAccountManagementSelected,
}) => (
  <div className="px-3">
    <NavSectionTrigger
      label="Account Management"
      isOpen={isAccountManagementSelected}
      isActive={inAccountManagement}
      onClick={() => setIsAccountManagementSelected(!isAccountManagementSelected)}
    />
    {isAccountManagementSelected ? (
      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-700 bg-gray-800/50 pl-2 pr-3 pt-2 pb-3">
        {ACCOUNT_LINKS.map((item) => (
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

export default AccountManagementSection;
