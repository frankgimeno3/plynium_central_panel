"use client";

import React, { Suspense, use } from "react";
import { CreateProposalPageContent } from "../CreateProposalWizard";

type PageProps = {
  params: Promise<{ id_proposal: string }>;
};

function ResumeCreateProposalPage({ params }: PageProps) {
  const { id_proposal } = use(params);
  return <CreateProposalPageContent resumeProposalId={id_proposal} />;
}

export default function CreateProposalWithIdPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <ResumeCreateProposalPage params={props.params} />
    </Suspense>
  );
}
