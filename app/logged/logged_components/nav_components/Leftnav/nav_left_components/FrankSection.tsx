"use client";

import { FC } from "react";
import NavGroupTrigger from "./NavGroupTrigger";
import NavLink from "./NavLink";
import NavSectionTrigger from "./NavSectionTrigger";

type FrankSectionProps = {
  pathname: string;
  inFrank: boolean;
  inFrankPm: boolean;
  inFrankSrm: boolean;
  inFrankAutoWiki: boolean;
  isFrankSelected: boolean;
  setIsFrankSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
  isFrankPmSelected: boolean;
  setIsFrankPmSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
  isFrankSrmSelected: boolean;
  setIsFrankSrmSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
  isFrankAutoWikiSelected: boolean;
  setIsFrankAutoWikiSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const FRANK_PM_LINKS = [
  {
    href: "/logged/pages/frank/pm/proyectos",
    label: "Proyectos",
    prefix: "/logged/pages/frank/pm/proyectos",
  },
  {
    href: "/logged/pages/frank/pm/tareas",
    label: "Tareas",
    prefix: "/logged/pages/frank/pm/tareas",
  },
] as const;

const FRANK_SRM_LINKS = [
  {
    href: "/logged/pages/frank/srm/entidades",
    label: "Entidades",
    prefix: "/logged/pages/frank/srm/entidades",
  },
] as const;

const FRANK_AUTO_WIKI_LINKS = [
  {
    href: "/logged/pages/frank/auto-wiki/documentacion",
    label: "Documentación",
    prefix: "/logged/pages/frank/auto-wiki/documentacion",
  },
  {
    href: "/logged/pages/frank/auto-wiki/estado-actual-temas",
    label: "Estado actual temas",
    prefix: "/logged/pages/frank/auto-wiki/estado-actual-temas",
  },
] as const;

const FrankSection: FC<FrankSectionProps> = ({
  pathname,
  inFrank,
  inFrankPm,
  inFrankSrm,
  inFrankAutoWiki,
  isFrankSelected,
  setIsFrankSelected,
  isFrankPmSelected,
  setIsFrankPmSelected,
  isFrankSrmSelected,
  setIsFrankSrmSelected,
  isFrankAutoWikiSelected,
  setIsFrankAutoWikiSelected,
}) => (
  <div className="px-3">
    <NavSectionTrigger
      label="Frank"
      isOpen={isFrankSelected}
      isActive={inFrank}
      onClick={() => setIsFrankSelected(!isFrankSelected)}
    />
    {isFrankSelected ? (
      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-700 bg-gray-800/50 pl-2 pr-3 pt-2 pb-3">
        <div className="flex flex-col gap-0.5">
          <NavGroupTrigger
            label="PM"
            isOpen={isFrankPmSelected}
            isActive={inFrankPm}
            onClick={() => setIsFrankPmSelected(!isFrankPmSelected)}
          />
          {isFrankPmSelected ? (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-600 pl-2">
              {FRANK_PM_LINKS.map((item) => (
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
        <div className="flex flex-col gap-0.5">
          <NavGroupTrigger
            label="SRM"
            isOpen={isFrankSrmSelected}
            isActive={inFrankSrm}
            onClick={() => setIsFrankSrmSelected(!isFrankSrmSelected)}
          />
          {isFrankSrmSelected ? (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-600 pl-2">
              {FRANK_SRM_LINKS.map((item) => (
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
        <div className="flex flex-col gap-0.5">
          <NavGroupTrigger
            label="Auto-Wiki"
            isOpen={isFrankAutoWikiSelected}
            isActive={inFrankAutoWiki}
            onClick={() => setIsFrankAutoWikiSelected(!isFrankAutoWikiSelected)}
          />
          {isFrankAutoWikiSelected ? (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-600 pl-2">
              {FRANK_AUTO_WIKI_LINKS.map((item) => (
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
      </div>
    ) : null}
  </div>
);

export default FrankSection;
