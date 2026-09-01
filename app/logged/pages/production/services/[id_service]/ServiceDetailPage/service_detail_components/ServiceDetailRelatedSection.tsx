"use client";

import React, { FC } from "react";
import Link from "next/link";
import type { RelatedServiceSummary, ServiceDetailModel } from "./service_detail_types";

type ServiceDetailRelatedSectionProps = {
  service: ServiceDetailModel;
};

function relationLabel(current: ServiceDetailModel, related: RelatedServiceSummary): string {
  const currentSpec = String(current.specifity ?? "general");
  const relatedSpec = String(related.specifity ?? "general");
  if (currentSpec === "general" && relatedSpec === "specific-related") {
    return "Specific instance of this general service";
  }
  if (currentSpec === "specific-related" && relatedSpec === "general") {
    return "General template for this service";
  }
  if (currentSpec === "specific-related" && relatedSpec === "specific-related") {
    return "Related specific service (same general parent)";
  }
  return "Related service";
}

export const ServiceDetailRelatedSection: FC<ServiceDetailRelatedSectionProps> = ({ service }) => {
  const parent = service.parent_service ?? null;
  const children = Array.isArray(service.related_services) ? service.related_services : [];
  const cards: { related: RelatedServiceSummary; relation: string }[] = [];

  if (parent) {
    cards.push({ related: parent, relation: relationLabel(service, parent) });
  }
  for (const child of children) {
    if (child.service_id === service.id_service) continue;
    cards.push({ related: child, relation: relationLabel(service, child) });
  }

  if (cards.length === 0) {
    return (
      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">Related services</p>
        <p className="text-sm text-gray-500">No related services linked to this one.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">Related services</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(({ related, relation }) => (
          <Link
            key={related.service_id}
            href={`/logged/pages/production/services/${encodeURIComponent(related.service_id)}`}
            className="block rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{relation}</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{related.name ?? related.service_full_name}</p>
            <p className="mt-1 text-xs text-gray-500 font-mono">{related.service_id}</p>
            <p className="mt-2 text-xs text-gray-600">
              {related.specifity === "general" ? "General" : "Specific-related"}
              {related.tariff_price_eur != null ? ` · €${Number(related.tariff_price_eur).toLocaleString()}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};
