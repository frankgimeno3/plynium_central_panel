"use client";

import React, { FC } from "react";
import CreateFolderModal from "@/app/logged/pages/mediateca/CreateFolderModal";
import AddFileModal from "@/app/logged/pages/mediateca/AddFileModal";
import RenameMediaModal from "@/app/logged/pages/mediateca/RenameMediaModal";
import ChangeFolderMediaModal from "@/app/logged/pages/mediateca/ChangeFolderMediaModal";
import type { MediatecaContent } from "./types";

export type MediatecaModalDialogsProps = {
  currentPath: string;
  createFolderOpen: boolean;
  setCreateFolderOpen: (v: boolean) => void;
  addFileOpen: boolean;
  setAddFileOpen: (v: boolean) => void;
  renameTarget: MediatecaContent | null;
  setRenameTarget: (v: MediatecaContent | null) => void;
  folderTarget: MediatecaContent | null;
  setFolderTarget: (v: MediatecaContent | null) => void;
  onReloadCurrentPath: () => void;
};

export const MediatecaModalDialogs: FC<MediatecaModalDialogsProps> = ({
  currentPath,
  createFolderOpen,
  setCreateFolderOpen,
  addFileOpen,
  setAddFileOpen,
  renameTarget,
  setRenameTarget,
  folderTarget,
  setFolderTarget,
  onReloadCurrentPath,
}) => (
  <>
    <CreateFolderModal
      open={createFolderOpen}
      onClose={() => setCreateFolderOpen(false)}
      parentPath={currentPath}
      onSuccess={() => {
        setCreateFolderOpen(false);
        onReloadCurrentPath();
      }}
    />
    <AddFileModal
      open={addFileOpen}
      onClose={() => setAddFileOpen(false)}
      folderPath={currentPath}
      onSuccess={() => {
        setAddFileOpen(false);
        onReloadCurrentPath();
      }}
    />
    <RenameMediaModal
      open={renameTarget != null}
      onClose={() => setRenameTarget(null)}
      item={renameTarget}
      onSuccess={() => {
        void onReloadCurrentPath();
        setRenameTarget(null);
      }}
    />
    <ChangeFolderMediaModal
      open={folderTarget != null}
      onClose={() => setFolderTarget(null)}
      mediaId={folderTarget?.id ?? ""}
      fileFolderPath={folderTarget?.folderPath ?? currentPath}
      onSuccess={() => {
        void onReloadCurrentPath();
        setFolderTarget(null);
      }}
    />
  </>
);
