"use client";

interface ArticleCompanyDateSectionProps {
  company: string;
  date: string;
  onEditCompany: () => void;
  onEditDate: () => void;
}

export default function ArticleCompanyDateSection({
  company,
  date,
  onEditCompany,
  onEditDate,
}: ArticleCompanyDateSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-500">Company</label>
        <div
          onClick={onEditCompany}
          className="relative flex flex-row items-center rounded-lg border border-gray-200 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <p className="text-base text-gray-700 flex-1">
            {company || "Not specified"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-500">Date</label>
        <div
          onClick={onEditDate}
          className="relative flex flex-row items-center rounded-lg border border-gray-200 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <p className="text-base text-gray-700 flex-1">
            {date || "Not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}

