"use client";

import React, { FC } from 'react';
import AdvertisementTable from '../advertisement_components/AdvertisementTable';

interface QuotationsProps {}

const Quotations: FC<QuotationsProps> = () => {
  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Advertisement Quotations</p>
      </div>
      <div className="px-6 py-6">
        <AdvertisementTable />
      </div>
    </div>
  );
};

export default Quotations;
