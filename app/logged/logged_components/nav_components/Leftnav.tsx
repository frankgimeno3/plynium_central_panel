"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, useState, useEffect } from "react";
import ChevronDownSvg from "../svg/ChevronDownSvg";
import ChevronRightSvg from "../svg/ChevronRightSvg";
import { PLYNIUM_NETWORK_LINKS, PLYNIUM_NETWORK_GROUPS } from "./navRouteIndex";

interface LeftnavProps {}

/** Level 0: main section toggle (e.g. Plynium Network, Account Management) */
const SectionTrigger: FC<{
  label: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isOpen, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2 rounded-r-lg border-l-2 py-3 pl-3 pr-4 text-left transition-colors ${
      isActive
        ? "border-blue-600 bg-blue-50/80 font-semibold text-gray-900"
        : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
    aria-expanded={isOpen}
  >
    <span className="flex shrink-0 text-gray-400 group-hover:text-gray-500" aria-hidden>
      {isOpen ? <ChevronDownSvg size={18} /> : <ChevronRightSvg size={18} />}
    </span>
    <span className="text-[15px]">{label}</span>
  </button>
);

/** Level 1: expandable group inside a section (e.g. Contents, Requests) */
const GroupTrigger: FC<{
  label: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isOpen, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2 rounded-md py-2 pl-2 pr-3 text-left text-sm transition-colors ${
      isActive ? "font-medium text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
    aria-expanded={isOpen}
  >
    <span className="flex shrink-0 text-gray-400" aria-hidden>
      {isOpen ? <ChevronDownSvg size={14} /> : <ChevronRightSvg size={14} />}
    </span>
    <span>{label}</span>
  </button>
);

/** Level 2: nav link */
const NavLink: FC<{
  href: string;
  label: string;
  active: boolean;
}> = ({ href, label, active }) => (
  <Link
    href={href}
    className={`flex min-h-[36px] items-center rounded-r-md border-l-2 py-2 pl-3 pr-4 text-sm transition-colors ${
      active
        ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
        : "border-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    {label}
  </Link>
);

const Leftnav: FC<LeftnavProps> = () => {
  const pathname = usePathname();
  const [isDirectorySelected, setIsDirectorySelected] = useState(false);
  const [isContentsSelected, setIsContentsSelected] = useState(false);
  const [isAccountManagementSelected, setIsAccountManagementSelected] = useState(false);
  const [isProductionSelected, setIsProductionSelected] = useState(false);
  const [isRequestsSelected, setIsRequestsSelected] = useState(false);
  const [isAdministrationSelected, setIsAdministrationSelected] = useState(false);

  const inContents = pathname.startsWith("/logged/pages/network/contents");
  const inAccountManagement = pathname.startsWith("/logged/pages/account-management");
  const inProduction = pathname.startsWith("/logged/pages/production");
  const inRequests = pathname.startsWith("/logged/pages/network/requests");
  const inAdministration = pathname.startsWith("/logged/pages/administration");
  const inNetwork = pathname.startsWith("/logged/pages/network");

  useEffect(() => {
    setIsContentsSelected(inContents);
    setIsAccountManagementSelected(inAccountManagement);
    setIsProductionSelected(inProduction);
    setIsRequestsSelected(inRequests);
    setIsAdministrationSelected(inAdministration);
    setIsDirectorySelected(inNetwork);
  }, [pathname, inContents, inAccountManagement, inProduction, inRequests, inAdministration, inNetwork]);

  return (
    <nav
      className="flex h-full min-h-screen w-[280px] min-w-[280px] shrink-0 flex-col bg-white"
      aria-label="Main navigation"
    >
      <div className="flex flex-col gap-0.5 py-4">
        {/* ——— Plynium Network ——— */}
        <div className="group px-3">
          <SectionTrigger
            label="Plynium Network"
            isOpen={isDirectorySelected}
            isActive={inNetwork}
            onClick={() => setIsDirectorySelected(!isDirectorySelected)}
          />
          {isDirectorySelected && (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-200/80 bg-gray-50/50 pl-2 pr-3 pt-2 pb-3">
              {PLYNIUM_NETWORK_GROUPS.map((group) => (
                <div key={group.pathPrefix} className="flex flex-col gap-0.5">
                  <GroupTrigger
                    label={group.label}
                    isOpen={
                      group.pathPrefix.includes("contents")
                        ? isContentsSelected
                        : isRequestsSelected
                    }
                    isActive={pathname.startsWith(group.pathPrefix)}
                    onClick={() =>
                      group.pathPrefix.includes("contents")
                        ? setIsContentsSelected(!isContentsSelected)
                        : setIsRequestsSelected(!isRequestsSelected)
                    }
                  />
                  {(group.pathPrefix.includes("contents") ? isContentsSelected : isRequestsSelected) && (
                    <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-200/60 pl-2">
                      {PLYNIUM_NETWORK_LINKS.slice(group.linkStart, group.linkEnd).map((item) => (
                        <NavLink
                          key={item.href}
                          href={item.href}
                          label={item.label}
                          active={pathname.startsWith(item.href)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Direct links (no sub-group): Directory, Portals, Users */}
              <div className="mt-1 flex flex-col gap-0.5 border-t border-gray-200/60 pt-2">
                {PLYNIUM_NETWORK_LINKS.slice(
                  PLYNIUM_NETWORK_GROUPS[PLYNIUM_NETWORK_GROUPS.length - 1].linkEnd
                ).map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    active={pathname.startsWith(item.href)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ——— Account Management ——— */}
        <div className="px-3">
          <SectionTrigger
            label="Account Management"
            isOpen={isAccountManagementSelected}
            isActive={inAccountManagement}
            onClick={() => setIsAccountManagementSelected(!isAccountManagementSelected)}
          />
          {isAccountManagementSelected && (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-200/80 bg-gray-50/50 pl-2 pr-3 pt-2 pb-3">
              <NavLink
                href="/logged/pages/account-management/customers_db"
                label="Customers DB"
                active={pathname.startsWith("/logged/pages/account-management/customers_db")}
              />
              <NavLink
                href="/logged/pages/account-management/contacts_db"
                label="Contacts DB"
                active={pathname.startsWith("/logged/pages/account-management/contacts_db")}
              />
              <NavLink
                href="/logged/pages/account-management/proposals"
                label="Proposals"
                active={pathname.startsWith("/logged/pages/account-management/proposals")}
              />
              <NavLink
                href="/logged/pages/account-management/contracts"
                label="Contracts"
                active={pathname.startsWith("/logged/pages/account-management/contracts")}
              />
            </div>
          )}
        </div>

        {/* ——— Production ——— */}
        <div className="px-3">
          <SectionTrigger
            label="Production"
            isOpen={isProductionSelected}
            isActive={inProduction}
            onClick={() => setIsProductionSelected(!isProductionSelected)}
          />
          {isProductionSelected && (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-200/80 bg-gray-50/50 pl-2 pr-3 pt-2 pb-3">
              <NavLink
                href="/logged/pages/production/projects"
                label="Projects"
                active={pathname.startsWith("/logged/pages/production/projects")}
              />
              <NavLink
                href="/logged/pages/production/services"
                label="Services"
                active={pathname.startsWith("/logged/pages/production/services")}
              />
              <NavLink
                href="/logged/pages/production/newsletter_management"
                label="Newsletter Management"
                active={pathname.startsWith("/logged/pages/production/newsletter_management")}
              />
              <NavLink
                href="/logged/pages/production/publications_management"
                label="Publications Management"
                active={pathname.startsWith("/logged/pages/production/publications_management")}
              />
            </div>
          )}
        </div>

        {/* ——— Administration ——— */}
        <div className="px-3">
          <SectionTrigger
            label="Administration"
            isOpen={isAdministrationSelected}
            isActive={inAdministration}
            onClick={() => setIsAdministrationSelected(!isAdministrationSelected)}
          />
          {isAdministrationSelected && (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-200/80 bg-gray-50/50 pl-2 pr-3 pt-2 pb-3">
              <NavLink
                href="/logged/pages/administration"
                label="Orders"
                active={pathname === "/logged/pages/administration"}
              />
              <NavLink
                href="/logged/pages/administration/banks"
                label="Banks"
                active={pathname.startsWith("/logged/pages/administration/banks")}
              />
              <NavLink
                href="/logged/pages/administration/issued-invoices"
                label="Issued invoices"
                active={pathname.startsWith("/logged/pages/administration/issued-invoices")}
              />
              <NavLink
                href="/logged/pages/administration/provider-invoices"
                label="Provider invoices"
                active={pathname.startsWith("/logged/pages/administration/provider-invoices")}
              />
              <NavLink
                href="/logged/pages/administration/providers"
                label="Providers"
                active={pathname.startsWith("/logged/pages/administration/providers")}
              />
              <NavLink
                href="/logged/pages/administration/agents"
                label="Agents"
                active={pathname.startsWith("/logged/pages/administration/agents")}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Leftnav;
