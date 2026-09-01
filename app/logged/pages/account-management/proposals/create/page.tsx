"use client";

import { Suspense } from "react";
import { CreateProposalPageContent } from "./CreateProposalWizard";

export default function CreateProposalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <CreateProposalPageContent />
    </Suspense>
  );
}
