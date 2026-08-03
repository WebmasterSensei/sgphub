"use client";
import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// ---- helpers -----------------------------------------------------

function formatCount(n: number | string | undefined) {
  if (!n && n !== 0) return "";
  const num = Number(n);
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 >= 100 ? 1 : 0) + "k";
  return String(num);
}

function toggleLike(comments: any[], id: string | number): any[] {
  return comments.map((c) => {
    if (c.$id === id || c.id === id) {
      const liked = !c.liked;
      return {
        ...c,
        liked,
        react: liked ? (c.react || 0) + 1 : Math.max((c.react || 0) - 1, 0)
      };
    }
    if (c.replies?.length) {
      return { ...c, replies: toggleLike(c.replies, id) };
    }
    return c;
  });
}

// ---- single comment row (recursive) -----------------------------------------------------

function CommentItem({
  comment,
  depth = 0,
  onLike
}: {
  comment: any;
  depth?: number;
  onLike: (id: string | number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`${depth > 0 ? "ml-4 sm:ml-6" : ""}`}>
      <div className="group flex gap-3 rounded-xl border border-transparent p-2 transition hover:border-white/10 hover:bg-white/5">
        {/* avatar */}
        <img
          src={comment.user?.avatar || "/default-avatar.png"}
          alt={comment.user?.name || "User"}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/5"
        />

        {/* content */}
        <div className="min-w-0 flex-1">
          {/* header */}
          <div className="flex items-center gap-1.5 text-[14px] sm:text-[15px]">
            <span className="truncate font-semibold text-neutral-900">
              {comment.user?.name || "Anonymous"}
            </span>
            <span className="whitespace-nowrap text-neutral-400 text-[10px] sm:text-[12px]">
              {comment.$updatedAt ? dayjs(comment.$updatedAt).fromNow() : ""}
            </span>

            <button
              className="ml-auto -mr-1 rounded-full p-1 text-neutral-400 opacity-0 transition hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* text */}
          <p className="mt-0.5 text-[12px] sm:text-[13px] leading-snug text-neutral-800 break-words">
            {comment.comments}
          </p>

          {/* image */}
          {comment.image && (
            <div className="mt-2.5 overflow-hidden rounded-xl max-w-full sm:max-w-sm">
              <img
                src={comment.image}
                alt=""
                className="h-auto max-h-72 w-full object-cover"
              />
            </div>
          )}

          {/* actions */}
          <div className="mt-1.5 flex justify-start gap-1 text-neutral-500">
            <button
              onClick={() => onLike(comment.$id || comment.id)}
              className="group/btn flex items-center gap-1.5"
              aria-label="Like"
            >
              <Heart
                className={`h-[18px] w-[18px] transition-transform group-active/btn:scale-90 ${
                  comment.liked
                    ? "fill-rose-500 stroke-rose-500"
                    : "stroke-current"
                }`}
                strokeWidth={2.8}
              />
              <span
                className={`text-[12.5px] sm:text-[13px] ${
                  comment.liked ? "text-rose-500" : ""
                }`}
              >
                {formatCount(comment.react)}
              </span>
            </button>

            <button
              className="group/btn flex items-center gap-1.5"
              aria-label="Reply"
            >
              <MessageCircle
                className="h-[18px] w-[18px] transition-transform group-active/btn:scale-90"
                strokeWidth={2.8}
              />
              <span className="text-[12.5px] sm:text-[13px]">
                {hasReplies ? formatCount(comment.replies.length) : ""}
              </span>
            </button>
          </div>

          {/* collapse toggle */}
          {hasReplies && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="mt-2 flex items-center gap-1 text-[12.5px] font-medium text-neutral-400 hover:text-neutral-600"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  collapsed ? "-rotate-90" : ""
                }`}
                strokeWidth={2}
              />
              {collapsed
                ? `Show ${comment.replies.length} ${
                    comment.replies.length === 1 ? "reply" : "replies"
                  }`
                : "Hide replies"}
            </button>
          )}
        </div>
      </div>

      {/* nested replies */}
      {hasReplies && !collapsed && (
        <div className="mt-1 space-y-1 border-l border-neutral-200 pl-2 ml-4 sm:ml-6">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.$id || reply.id}
              comment={reply}
              depth={depth + 1}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- root component -----------------------------------------------------

export default function Comments({
  comments: initialComments
}: {
  comments: any[];
}) {
  // alert();

  const [comments, setComments] = useState(initialComments || []);

  const handleLike = (id: string | number) => {
    setComments((prev) => toggleLike(prev, id));
  };

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);
  return (
    <div className="flex h-full flex-col">
      <div
        className="
          flex-1 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-neutral-200
          hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400
        "
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle
              className="mb-3 h-8 w-8 text-neutral-300"
              strokeWidth={1.5}
            />
            <p className="text-sm text-neutral-500">No comments yet</p>
            <p className="mt-1 text-xs text-neutral-400">
              Be the first to share your thoughts
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 pb-6">
            {comments.map((c: any) => (
              <CommentItem
                key={c.$id || c.id}
                comment={c}
                depth={0}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
