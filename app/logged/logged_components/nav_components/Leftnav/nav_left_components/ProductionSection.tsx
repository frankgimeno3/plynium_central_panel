"use client";

import { FC } from "react";
import NavGroupTrigger from "./NavGroupTrigger";
import NavLink from "./NavLink";
import NavSectionTrigger from "./NavSectionTrigger";

type ProductionSectionProps = {
  pathname: string;
  inProduction: boolean;
  inPublications: boolean;
  isProductionSelected: boolean;
  setIsProductionSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
  isPublicationsSelected: boolean;
  setIsPublicationsSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const PRODUCTION_LINKS = [
  {
    href: "/logged/pages/production/services",
    label: "Services",
    prefix: "/logged/pages/production/services",
  },
  {
    href: "/logged/pages/production/newsletters",
    label: "Newsletters",
    prefix: "/logged/pages/production/newsletters",
  },
] as const;

const PUBLICATION_LINKS = [
  {
    href: "/logged/pages/production/publications/magazines",
    label: "Magazine titles",
    prefix: "/logged/pages/production/publications/magazines",
  },
  {
    href: "/logged/pages/production/publications/issues",
    label: "Issues",
    prefix: "/logged/pages/production/publications/issues",
  },
  {
    href: "/logged/pages/production/publications/preferential-pages",
    label: "Preferential pages",
    prefix: "/logged/pages/production/publications/preferential-pages",
  },
] as const;

const ProductionSection: FC<ProductionSectionProps> = ({
  pathname,
  inProduction,
  inPublications,
  isProductionSelected,
  setIsProductionSelected,
  isPublicationsSelected,
  setIsPublicationsSelected,
}) => (
  <div className="px-3">
    <NavSectionTrigger
      label="Production"
      isOpen={isProductionSelected}
      isActive={inProduction}
      onClick={() => setIsProductionSelected(!isProductionSelected)}
    />
    {isProductionSelected ? (
      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-700 bg-gray-800/50 pl-2 pr-3 pt-2 pb-3">
        {PRODUCTION_LINKS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname.startsWith(item.prefix)}
          />
        ))}
        <div className="flex flex-col gap-0.5">
          <NavGroupTrigger
            label="Publications"
            isOpen={isPublicationsSelected}
            isActive={inPublications}
            onClick={() => setIsPublicationsSelected(!isPublicationsSelected)}
          />
          {isPublicationsSelected ? (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-600 pl-2">
              {PUBLICATION_LINKS.map((item) => (
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

export default ProductionSection;
