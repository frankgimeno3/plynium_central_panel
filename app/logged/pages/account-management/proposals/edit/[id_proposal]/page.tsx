"use client";

import React, { Suspense, use } from "react";
import { EditProposalPageContent } from "../EditProposalPageContent";

type PageProps = {
  params: Promise<{ id_proposal: string }>;
};

function EditProposalPage({ params }: PageProps) {
  const { id_proposal } = use(params);
  return <EditProposalPageContent editProposalId={id_proposal} />;
}

export default function EditProposalRoute(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <EditProposalPage params={props.params} />
    </Suspense>
  );
}
