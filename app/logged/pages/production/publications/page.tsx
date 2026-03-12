"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PublicationsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/logged/pages/production/publications/magazines");
  }, [router]);
  return (
    <div className="flex min-h-[200px] items-center justify-center text-gray-500">
      Redirecting to Magazines…
    </div>
  );
}
