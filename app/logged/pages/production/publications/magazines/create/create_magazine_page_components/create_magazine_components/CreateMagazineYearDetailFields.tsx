"use client";

import React, { FC } from "react";

type Props = {
  startingYear: string;
  periodicity: string;
  subscriberNumber: string;
  currentYear: number;
  onStartingYearChange: (v: string) => void;
  onPeriodicityChange: (v: string) => void;
  onSubscriberNumberChange: (v: string) => void;
};

export const CreateMagazineYearDetailFields: FC<Props> = ({
  startingYear,
  periodicity,
  subscriberNumber,
  currentYear,
  onStartingYearChange,
  onPeriodicityChange,
  onSubscriberNumberChange,
}) => (
  <>
    <div>
      <label htmlFor="create-mag-start-year" className="block text-xs text-gray-600 mb-1">
        Starting year
      </label>
      <input
        id="create-mag-start-year"
        type="number"
        value={startingYear}
        onChange={(e) => onStartingYearChange(e.target.value)}
        min={1900}
        max={2100}
        className="w-full max-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={String(currentYear)}
      />
    </div>

    <div>
      <label htmlFor="create-mag-periodicity" className="block text-xs text-gray-600 mb-1">
        Periodicity
      </label>
      <input
        id="create-mag-periodicity"
        type="text"
        value={periodicity}
        onChange={(e) => onPeriodicityChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g. monthly, quarterly"
      />
    </div>

    <div>
      <label htmlFor="create-mag-subscribers" className="block text-xs text-gray-600 mb-1">
        Subscriber number
      </label>
      <input
        id="create-mag-subscribers"
        type="number"
        min={0}
        value={subscriberNumber}
        onChange={(e) => onSubscriberNumberChange(e.target.value)}
        className="w-full max-w-[160px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Optional"
      />
    </div>
  </>
);
