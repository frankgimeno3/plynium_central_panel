"use client";

import { FC, use } from "react";
import { MagazineDetailPage } from "./magazine_detail_components/MagazineDetailPage";

const MagazineDetailRoutePage: FC<{ params: Promise<{ id_magazine: string }> }> = ({ params }) => {
  const { id_magazine } = use(params);
  return <MagazineDetailPage magazineId={id_magazine} />;
};

export default MagazineDetailRoutePage;
