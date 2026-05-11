import React, { FC } from "react";

type ArticleSubpageActionAlertsProps = {
  actionError: string | null;
  actionMessage: string | null;
};

export const ArticleSubpageActionAlerts: FC<ArticleSubpageActionAlertsProps> = ({
  actionError,
  actionMessage,
}) => {
  return (
    <>
      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {actionMessage}
        </div>
      ) : null}
    </>
  );
};
