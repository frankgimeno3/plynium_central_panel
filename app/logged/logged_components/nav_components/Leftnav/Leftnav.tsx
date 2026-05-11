"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";
import AccountManagementSection from "./nav_left_components/AccountManagementSection";
import AdministrationSection from "./nav_left_components/AdministrationSection";
import PlyniumNetworkSection from "./nav_left_components/PlyniumNetworkSection";
import ProductionSection from "./nav_left_components/ProductionSection";
import { useLeftnavSectionState } from "./nav_left_components/useLeftnavSectionState";

const Leftnav: FC = () => {
  const pathname = usePathname();
  const {
    inAccountManagement,
    inProduction,
    inPublications,
    inAdministration,
    inNetwork,
    isDirectorySelected,
    setIsDirectorySelected,
    isContentsSelected,
    setIsContentsSelected,
    isAccountManagementSelected,
    setIsAccountManagementSelected,
    isProductionSelected,
    setIsProductionSelected,
    isPublicationsSelected,
    setIsPublicationsSelected,
    isAdministrationSelected,
    setIsAdministrationSelected,
  } = useLeftnavSectionState(pathname);

  return (
    <nav
      className="flex h-full min-h-screen w-[220px] min-w-[220px] shrink-0 flex-col bg-gray-900 md:w-[240px] md:min-w-[240px]"
      aria-label="Main navigation"
    >
      <div className="flex flex-col gap-0.5 py-2 md:py-3">
        <PlyniumNetworkSection
          pathname={pathname}
          inNetwork={inNetwork}
          isDirectorySelected={isDirectorySelected}
          setIsDirectorySelected={setIsDirectorySelected}
          isContentsSelected={isContentsSelected}
          setIsContentsSelected={setIsContentsSelected}
        />
        <AccountManagementSection
          pathname={pathname}
          inAccountManagement={inAccountManagement}
          isAccountManagementSelected={isAccountManagementSelected}
          setIsAccountManagementSelected={setIsAccountManagementSelected}
        />
        <ProductionSection
          pathname={pathname}
          inProduction={inProduction}
          inPublications={inPublications}
          isProductionSelected={isProductionSelected}
          setIsProductionSelected={setIsProductionSelected}
          isPublicationsSelected={isPublicationsSelected}
          setIsPublicationsSelected={setIsPublicationsSelected}
        />
        <AdministrationSection
          pathname={pathname}
          inAdministration={inAdministration}
          isAdministrationSelected={isAdministrationSelected}
          setIsAdministrationSelected={setIsAdministrationSelected}
        />
      </div>
    </nav>
  );
};

export default Leftnav;
