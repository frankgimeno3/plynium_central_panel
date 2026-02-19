"use client";

import React, { FC } from 'react';
import AdvertisementTable from './advertisement_components/AdvertisementTable';

interface AdvertisementProps {}

const Advertisement: FC<AdvertisementProps> = () => {
  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Advertisement Requests</p>
      </div>
      <div className="px-6 py-6">
        <AdvertisementTable />
      </div>
    </div>
  );
};

export default Advertisement;