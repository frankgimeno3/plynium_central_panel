"use client";

import { Suspense, use } from "react";
import { CreateContactPageContent } from "../../CreateContactWizard";

type PageProps = {
  params: Promise<{ id_proposal: string }>;
};

function CreateContactFromProposalPage({ params }: PageProps) {
  const { id_proposal } = use(params);
  return <CreateContactPageContent fromProposalId={id_proposal} />;
}

export default function CreateContactFromProposalRoute(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <CreateContactFromProposalPage params={props.params} />
    </Suspense>
  );
}
