"use client";

import React, { FC, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const CreateArticleFromCompanyPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const raw = (params as any)?.company_id;
  const companyId = decodeURIComponent(Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")).trim();

  useEffect(() => {
    if (!companyId) return;
    router.replace(`/logged/pages/network/contents/articles/create?companyId=${encodeURIComponent(companyId)}`);
  }, [companyId, router]);

  return null;
};

export default CreateArticleFromCompanyPage;