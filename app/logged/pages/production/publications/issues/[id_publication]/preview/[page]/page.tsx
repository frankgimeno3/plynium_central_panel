"use client";

import { FC, use } from "react";
import { MagazinePreviewClient } from "../preview_components/MagazinePreviewClient";

const MagazinePreviewRoutePage: FC<{
    params: Promise<{ id_publication: string; page: string }>;
}> = ({ params }) => {
    const { id_publication, page } = use(params);
    return <MagazinePreviewClient publicationId={id_publication} pageToken={page} />;
};

export default MagazinePreviewRoutePage;
