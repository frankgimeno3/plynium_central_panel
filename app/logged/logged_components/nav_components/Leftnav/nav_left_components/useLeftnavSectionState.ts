"use client";

import { useEffect, useState } from "react";

export function useLeftnavSectionState(pathname: string) {
  const [isDirectorySelected, setIsDirectorySelected] = useState(false);
  const [isContentsSelected, setIsContentsSelected] = useState(false);
  const [isAccountManagementSelected, setIsAccountManagementSelected] = useState(false);
  const [isProductionSelected, setIsProductionSelected] = useState(false);
  const [isPublicationsSelected, setIsPublicationsSelected] = useState(false);
  const [isAdministrationSelected, setIsAdministrationSelected] = useState(false);

  const inContents = pathname.startsWith("/logged/pages/network/contents");
  const inAccountManagement = pathname.startsWith("/logged/pages/account-management");
  const inProduction = pathname.startsWith("/logged/pages/production");
  const inPublications = pathname.startsWith("/logged/pages/production/publications");
  const inAdministration = pathname.startsWith("/logged/pages/administration");
  const inNetwork = pathname.startsWith("/logged/pages/network");

  useEffect(() => {
    setIsContentsSelected(inContents);
    setIsAccountManagementSelected(inAccountManagement);
    setIsProductionSelected(inProduction);
    setIsPublicationsSelected(inPublications);
    setIsAdministrationSelected(inAdministration);
    setIsDirectorySelected(inNetwork);
  }, [pathname, inContents, inAccountManagement, inProduction, inPublications, inAdministration, inNetwork]);

  return {
    inContents,
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
  };
}
