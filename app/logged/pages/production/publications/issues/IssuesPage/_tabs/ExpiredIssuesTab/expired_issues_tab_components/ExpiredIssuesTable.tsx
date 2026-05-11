"use client";

import React, { FC } from "react";
import { IssuesDataTable, type IssuesDataTableProps } from "../../../issues_page_components/IssuesDataTable";

export type ExpiredIssuesTableProps = IssuesDataTableProps;

export const ExpiredIssuesTable: FC<ExpiredIssuesTableProps> = (props) => (
  <IssuesDataTable {...props} />
);
