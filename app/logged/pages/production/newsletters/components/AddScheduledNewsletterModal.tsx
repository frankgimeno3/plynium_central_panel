"use client";

import React, { FC, useState, useEffect } from "react";
import userListsData from "@/app/contents/userLists.json";

type UserList = { userList_id: string; userListName: string; userListPortal: string; userListTopic: string };
const userLists = userListsData as UserList[];

export interface AddScheduledNewsletterForm {
  topic: string;
  estimatedPublishDate: string;
  userNewsletterListId: string;
}

interface AddScheduledNewsletterModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddScheduledNewsletterForm) => void;
}

const AddScheduledNewsletterModal: FC<AddScheduledNewsletterModalProps> = ({ open, onClose, onSubmit }) => {
  const [topic, setTopic] = useState("");
  const [estimatedPublishDate, setEstimatedPublishDate] = useState("");
  const [userNewsletterListId, setUserNewsletterListId] = useState(userLists[0]?.userList_id ?? "");

  useEffect(() => {
    if (!open) {
      setTopic("");
      setEstimatedPublishDate("");
      setUserNewsletterListId(userLists[0]?.userList_id ?? "");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !estimatedPublishDate || !userNewsletterListId) return;
    onSubmit({ topic: topic.trim(), estimatedPublishDate, userNewsletterListId });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-scheduled-newsletter-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="add-scheduled-newsletter-title" className="text-xl font-semibold text-gray-900">
            Add scheduled newsletter
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="add-nl-topic" className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              id="add-nl-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Newsletter topic"
              required
            />
          </div>
          <div>
            <label htmlFor="add-nl-date" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated publish date
            </label>
            <input
              id="add-nl-date"
              type="date"
              value={estimatedPublishDate}
              onChange={(e) => setEstimatedPublishDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="add-nl-list" className="block text-sm font-medium text-gray-700 mb-1">
              User newsletter list
            </label>
            <select
              id="add-nl-list"
              value={userNewsletterListId}
              onChange={(e) => setUserNewsletterListId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select list</option>
              {userLists.map((list) => (
                <option key={list.userList_id} value={list.userList_id}>
                  {list.userList_id} — {list.userListName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddScheduledNewsletterModal;
