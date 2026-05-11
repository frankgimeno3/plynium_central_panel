"use client";

import type { NotificationComment as PanelTicketComment } from "@/app/contents/notifications.types";

type Props = {
  sortedComments: PanelTicketComment[];
  newComment: string;
  onNewCommentChange: (v: string) => void;
  onAddComment: () => void;
  isAddingComment: boolean;
  formatDate: (dateString: string) => string;
};

export default function CompanyRequestCommentsSection({
  sortedComments,
  newComment,
  onNewCommentChange,
  onAddComment,
  isAddingComment,
  formatDate,
}: Props) {
  return (
    <div className="flex flex-col w-full">
      <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments</h2>
        <div className="mb-6">
          <label htmlFor="newComment" className="block text-sm font-medium text-gray-700 mb-2">
            Add Comment
          </label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900"
            placeholder="Enter your comment here..."
          />
          <button
            type="button"
            onClick={() => void onAddComment()}
            disabled={!newComment.trim() || isAddingComment}
            className={`mt-3 px-4 py-2 rounded-md text-white font-medium ${
              !newComment.trim() || isAddingComment
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-950 hover:bg-blue-950/80 cursor-pointer"
            }`}
          >
            {isAddingComment ? "Adding..." : "Add Comment"}
          </button>
        </div>
        <div className="space-y-4">
          {sortedComments.length === 0 ? (
            <p className="text-gray-500 italic">No comments yet.</p>
          ) : (
            sortedComments.map((comment, index) => (
              <div
                key={`${comment.date}-${index}`}
                className="border-l-4 border-blue-950 pl-4 py-2 bg-gray-50 rounded-r"
              >
                <p className="text-sm font-medium text-gray-900">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(comment.date)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
