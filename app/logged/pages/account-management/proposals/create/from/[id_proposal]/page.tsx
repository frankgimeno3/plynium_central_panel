"use client";

import React, { Suspense, use } from "react";
import { CreateProposalPageContent } from "../../CreateProposalWizard";

type PageProps = {
  params: Promise<{ id_proposal: string }>;
};

function CreateProposalVariationPage({ params }: PageProps) {
  const { id_proposal } = use(params);
  return <CreateProposalPageContent variationFromProposalId={id_proposal} />;
}

export default function CreateProposalFromProposalRoute(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <CreateProposalVariationPage params={props.params} />
    </Suspense>
  );
}
