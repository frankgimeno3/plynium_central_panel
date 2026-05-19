import type { ContentsManagerSubTabMeta } from "./types";

export const CONTENTS_MANAGER_SUB_TABS: ContentsManagerSubTabMeta[] = [
  {
    id: "should_be_in_magazine",
    label: "Should be in magazine",
    description:
      "Projects contracted for this publication: assign each one to a slot and attach media when needed.",
  },
  {
    id: "selected_contents",
    label: "Publication Selected Contents",
    description:
      "Portal articles already selected for this publication: assign slots, link projects, and open the Article Builder.",
  },
  {
    id: "available_articles",
    label: "Available portal articles",
    description:
      "Articles already published in the portal that can be adapted into magazine pages.",
  },
];
