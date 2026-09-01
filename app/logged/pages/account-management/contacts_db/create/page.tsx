"use client";

import { Suspense } from "react";
import { CreateContactPageContent } from "./CreateContactWizard";

export default function CreateContactPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <CreateContactPageContent />
    </Suspense>
  );
}
