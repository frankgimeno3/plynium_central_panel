import { Suspense } from "react";
import TicketsPage from "./TicketsPage/TicketsPage";

export default function TicketsRoutePage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading...</div>}>
      <TicketsPage />
    </Suspense>
  );
}
