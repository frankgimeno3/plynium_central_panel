"use client";

import React, { FC } from "react";
import PencilSvg from "@/app/logged/logged_components/svg/PencilSvg";

interface PublicationInfoProps {
  date: string;
  revista: string;
  número: number | string;
  onEditDate: () => void;
  onEditRevista: () => void;
  onEditNumero: () => void;
}

const PublicationInfo: FC<PublicationInfoProps> = ({
  date,
  revista,
  número,
  onEditDate,
  onEditRevista,
  onEditNumero,
}) => {
  return (
    <section className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-700">Publication Details</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Fecha */}
          <div className="relative flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="mb-1 text-sm font-medium text-gray-500">Date</label>
            <div className="relative flex flex-row items-center">
              <p className="text-base text-gray-700">{date}</p>
              <div className="absolute bottom-0 right-0">
                <PencilSvg size="10" onClick={onEditDate} />
              </div>
            </div>
          </div>

          {/* Magazine */}
          <div className="relative flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="mb-1 text-sm font-medium text-gray-500">Magazine</label>
            <div className="relative flex flex-row items-center">
              <p className="text-base text-gray-700">{revista}</p>
              <div className="absolute bottom-0 right-0">
                <PencilSvg size="10" onClick={onEditRevista} />
              </div>
            </div>
          </div>

          {/* Number */}
          <div className="relative flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="mb-1 text-sm font-medium text-gray-500">Number</label>
            <div className="relative flex flex-row items-center">
              <p className="text-base text-gray-700">{número}</p>
              <div className="absolute bottom-0 right-0">
                <PencilSvg size="10" onClick={onEditNumero} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicationInfo;

