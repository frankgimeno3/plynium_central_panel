import type { articleInterface } from "@/app/contents/interfaces";
import type { ProjectRow } from "@/app/logged/logged_components/modals/ProjectSelectModal";

export type AddContentSelection =
  | { kind: "article"; articles: articleInterface[] }
  | { kind: "sponsored"; articles: articleInterface[] }
  | {
      kind: "banner";
      imageUrl: string;
      mediaId: string;
      mediaName: string;
      project: ProjectRow;
    };
