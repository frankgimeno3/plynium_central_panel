"use client";

import { FC } from "react";
import NavGroupTrigger from "./NavGroupTrigger";
import NavLink from "./NavLink";
import NavSectionTrigger from "./NavSectionTrigger";
import {
  PLYNIUM_NETWORK_GROUPS,
  PLYNIUM_NETWORK_LINKS,
  isPlyniumNetworkDirectoryLeafActive,
} from "./navRouteIndex";

type PlyniumNetworkSectionProps = {
  pathname: string;
  inNetwork: boolean;
  isDirectorySelected: boolean;
  setIsDirectorySelected: (value: boolean | ((prev: boolean) => boolean)) => void;
  isContentsSelected: boolean;
  setIsContentsSelected: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const PlyniumNetworkSection: FC<PlyniumNetworkSectionProps> = ({
  pathname,
  inNetwork,
  isDirectorySelected,
  setIsDirectorySelected,
  isContentsSelected,
  setIsContentsSelected,
}) => (
  <div className="group px-3">
    <NavSectionTrigger
      label="Plynium Network"
      isOpen={isDirectorySelected}
      isActive={inNetwork}
      onClick={() => setIsDirectorySelected(!isDirectorySelected)}
    />
    {isDirectorySelected ? (
      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-700 bg-gray-800/50 pl-2 pr-3 pt-2 pb-3">
        {PLYNIUM_NETWORK_GROUPS.map((group) => (
          <div key={group.pathPrefix} className="flex flex-col gap-0.5">
            <NavGroupTrigger
              label={group.label}
              isOpen={isContentsSelected}
              isActive={pathname.startsWith(group.pathPrefix)}
              onClick={() => setIsContentsSelected(!isContentsSelected)}
            />
            {isContentsSelected ? (
              <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-600 pl-2">
                {PLYNIUM_NETWORK_LINKS.slice(group.linkStart, group.linkEnd).map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    active={pathname.startsWith(item.href)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <div className="mt-1 flex flex-col gap-0.5 border-t border-gray-700 pt-2">
          {PLYNIUM_NETWORK_LINKS.slice(
            PLYNIUM_NETWORK_GROUPS[PLYNIUM_NETWORK_GROUPS.length - 1].linkEnd
          ).map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isPlyniumNetworkDirectoryLeafActive(item.href, pathname)}
            />
          ))}
        </div>
      </div>
    ) : null}
  </div>
);

export default PlyniumNetworkSection;
