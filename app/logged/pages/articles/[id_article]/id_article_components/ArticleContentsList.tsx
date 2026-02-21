"use client";

import React, { FC } from "react"; 
import ArticleContentCard from "./ArticleContentCard";
import ContentNotFound from "./ContentNotFound";
import ContentRenderer from "./ContentRenderer";

interface ArticleContentsListProps {
  contentsIds: string[];
  contentsData: any[];
  onEditContentField: (args: {
    contentId: string;
    field: "center" | "left" | "right";
    initialValue: string;
    modalTitle: string;
  }) => void;
  onAddContent: (position: number | null, content?: any) => void;
  onEditContentBlock?: (content: any) => void;
  onDeleteContent?: (contentId: string) => void;
}

const ArticleContentsList: FC<ArticleContentsListProps> = ({
  contentsIds,
  contentsData,
  onEditContentField,
  onAddContent,
  onEditContentBlock,
  onDeleteContent,
}) => {
  const findContentDataById = (contentId: string) => {
    return contentsData.find(
      (contentItem: any) => contentItem.content_id === contentId
    );
  };

  const handleEditField = (args: {
    contentId: string;
    field: "center" | "left" | "right";
    value: string;
    isImage?: boolean;
  }) => {
    const { contentId, field, value, isImage } = args;

    const modalTitle = isImage ? "Edit image url" : "Edit contents";

    onEditContentField({
      contentId,
      field,
      initialValue: value ?? "",
      modalTitle,
    });
  };

  return (
    <section className="mt-8 flex flex-col gap-6">
      <p className="text-sm text-gray-600">
        Hover between contents to add a new one. You can edit each field with the pencil or edit the whole block.
      </p>
      {contentsIds.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-950 hover:bg-blue-50"
          onClick={() => onAddContent(null)}
        >
          <p className="text-gray-500">Click to add the first content</p>
        </div>
      ) : (
        contentsIds.map((contentId, index) => {
          const contentData = findContentDataById(contentId);

          return (
            <React.Fragment key={contentId}>
              {/* Hover zone before content */}
              <div
                className="group relative h-4 -mb-2 z-10"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (rect.height < 20) {
                    e.currentTarget.style.height = "40px";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.height = "16px";
                }}
              >
                <div className="hidden group-hover:flex items-center justify-center h-full bg-blue-100 border-2 border-dashed border-blue-300 rounded cursor-pointer">
                  <button
                    onClick={() => onAddContent(index)}
                    className="text-blue-950 font-semibold"
                  >
                    + Add content here
                  </button>
                </div>
              </div>

              {/* Content card */}
              {!contentData ? (
                <ArticleContentCard>
                  <ContentNotFound contentId={contentId} />
                </ArticleContentCard>
              ) : (
                <ArticleContentCard>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-end gap-2">
                      {onEditContentBlock && (
                        <button
                          type="button"
                          onClick={() => onEditContentBlock(contentData)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit block
                        </button>
                      )}
                      {onDeleteContent && (
                        <button
                          type="button"
                          onClick={() => onDeleteContent(contentId)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <ContentRenderer
                      contentId={contentId}
                      contentType={contentData.content_type}
                      contentContent={contentData.content_content}
                      onEditField={handleEditField}
                    />
                  </div>
                </ArticleContentCard>
              )}
            </React.Fragment>
          );
        })
      )}

      {/* Add button at the end */}
      {contentsIds.length > 0 && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-950 hover:bg-blue-50"
          onClick={() => onAddContent(null)}
        >
          <p className="text-gray-500">+ Add content at the end</p>
        </div>
      )}
    </section>
  );
};

export default ArticleContentsList;
