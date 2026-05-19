"use client";

import React, { FC } from "react";
import { IssuesDataTable, type IssuesDataTableProps } from "../../../issues_page_components/IssuesDataTable";

export type ForecastedIssuesTableProps = IssuesDataTableProps;

export const ForecastedIssuesTable: FC<ForecastedIssuesTableProps> = (props) => (
  <IssuesDataTable {...props} />
);
