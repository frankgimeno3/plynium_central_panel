"use client";

/* eslint-disable react-hooks/set-state-in-effect -- This hook mirrors route changes into manually toggleable menu state. */
import { useEffect, useState } from "react";

export function useLeftnavSectionState(pathname: string) {
  const [isDirectorySelected, setIsDirectorySelected] = useState(false);
  const [isContentsSelected, setIsContentsSelected] = useState(false);
  const [isAccountManagementSelected, setIsAccountManagementSelected] = useState(false);
  const [isProductionSelected, setIsProductionSelected] = useState(false);
  const [isPublicationsSelected, setIsPublicationsSelected] = useState(false);
  const [isAdministrationSelected, setIsAdministrationSelected] = useState(false);
  const [isFrankSelected, setIsFrankSelected] = useState(false);
  const [isFrankPmSelected, setIsFrankPmSelected] = useState(false);
  const [isFrankSrmSelected, setIsFrankSrmSelected] = useState(false);
  const [isFrankAutoWikiSelected, setIsFrankAutoWikiSelected] = useState(false);

  const inContents = pathname.startsWith("/logged/pages/network/contents");
  const inAccountManagement = pathname.startsWith("/logged/pages/account-management");
  const inProduction = pathname.startsWith("/logged/pages/production");
  const inPublications = pathname.startsWith("/logged/pages/production/publications");
  const inAdministration = pathname.startsWith("/logged/pages/administration");
  const inNetwork = pathname.startsWith("/logged/pages/network");
  const inFrank = pathname.startsWith("/logged/pages/frank");
  const inFrankPm = pathname.startsWith("/logged/pages/frank/pm");
  const inFrankSrm = pathname.startsWith("/logged/pages/frank/srm");
  const inFrankAutoWiki = pathname.startsWith("/logged/pages/frank/auto-wiki");

  useEffect(() => {
    setIsContentsSelected(inContents);
    setIsAccountManagementSelected(inAccountManagement);
    setIsProductionSelected(inProduction);
    setIsPublicationsSelected(inPublications);
    setIsAdministrationSelected(inAdministration);
    setIsDirectorySelected(inNetwork);
    setIsFrankSelected(inFrank);
    setIsFrankPmSelected(inFrankPm);
    setIsFrankSrmSelected(inFrankSrm);
    setIsFrankAutoWikiSelected(inFrankAutoWiki);
  }, [
    pathname,
    inContents,
    inAccountManagement,
    inProduction,
    inPublications,
    inAdministration,
    inNetwork,
    inFrank,
    inFrankPm,
    inFrankSrm,
    inFrankAutoWiki,
  ]);

  return {
    inContents,
    inAccountManagement,
    inProduction,
    inPublications,
    inAdministration,
    inNetwork,
    inFrank,
    inFrankPm,
    inFrankSrm,
    inFrankAutoWiki,
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
    isFrankSelected,
    setIsFrankSelected,
    isFrankPmSelected,
    setIsFrankPmSelected,
    isFrankSrmSelected,
    setIsFrankSrmSelected,
    isFrankAutoWikiSelected,
    setIsFrankAutoWikiSelected,
  };
}
