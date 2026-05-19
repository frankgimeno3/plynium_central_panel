"use client";

import React, { FC } from "react";
import { IssuesDataTable, type IssuesDataTableProps } from "../../../issues_page_components/IssuesDataTable";

export type DevelopmentIssuesTableProps = IssuesDataTableProps;

export const DevelopmentIssuesTable: FC<DevelopmentIssuesTableProps> = (props) => (
  <IssuesDataTable {...props} />
);
