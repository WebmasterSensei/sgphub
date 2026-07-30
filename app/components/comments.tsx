"use client";
import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";

// ---- sample data -----------------------------------------------------

// ---- helpers -----------------------------------------------------

function formatCount(n: any) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + "k";
  return String(n);
}

// toggle like immutably at any depth of the reply tree
function toggleLike(comments: any, id: number) {
  return comments.map((c: any) => {
    if (c.id === id) {
      const liked = !c.liked;
      return { ...c, liked, likes: liked ? c.likes + 1 : c.likes - 1 };
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
  depth,
  isLast
}: {
  comment: any;
  depth: number;
  isLast: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="relative">
      <div className="flex p-2 py-1">
        {/* avatar + connecting line column */}
        <div className="flex flex-col items-center shrink-0">
          {/* {JSON.stringify(comment.user)}  */}
          <img
            src={comment.user.avatar}
            alt={comment.user.name}
            className="h-8 w-8 sm:h-9 sm:w-9 mx-2 rounded-full object-cover ring-1 ring-black/5"
          />
          {hasReplies && !collapsed && (
            <div className="mt-1.5 flex-1 w-px bg-neutral-200" />
          )}
        </div>

        {/* content column */}
        <div className="min-w-0 flex-1 pb-1">
          <div className="flex items-center gap-1.5 text-[14px] sm:text-[15px]">
            <span className="font-semibold text-neutral-900 truncate max-w-[45%] sm:max-w-none">
              {comment.user.name}
            </span>
            <span className="text-neutral-400 truncate hidden xs:inline sm:inline">
              {/* @{comment.user.email} */}
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-400 whitespace-nowrap">
              {/* {comment.$updatedAt} */}
            </span>
            <button
              className="ml-auto p-1 -mr-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <p className="mt-0.5 text-[13px] sm:text-[15px] leading-snug text-neutral-800 break-words">
            {comment.comments}
          </p>

          {comment.image && (
            <div className="mt-2.5 overflow-hidden rounded-xl  max-w-full sm:max-w-sm">
              <img
                src={comment.image}
                alt=""
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
          )}

          {/* action bar */}
          <div className="mt-2 flex items-center justify-end gap-4 p-1 sm:gap-5 text-neutral-500">
            <button
              className="group flex items-center gap-1.5"
              aria-label="Like"
            >
              <Heart
                className={`h-[18px] w-[18px] transition-transform group-active:scale-90 ${
                  comment.liked
                    ? "fill-rose-500 stroke-rose-500"
                    : "stroke-current"
                }`}
                strokeWidth={1.8}
              />
              <span
                className={`text-[12.5px] sm:text-[13px] ${comment.liked ? "text-rose-500" : ""}`}
              >
                {formatCount(comment.react ?? "")}
              </span>
            </button>

            {/* <button
              className="group flex items-center gap-1.5"
              aria-label="Reply"
            >
              <MessageCircle
                className="h-[18px] w-[18px] group-active:scale-90 transition-transform"
                strokeWidth={1.8}
              />
              <span className="text-[12.5px] sm:text-[13px]">
                {hasReplies ? formatCount(comment.replies.length) : ""}
              </span>
            </button> */}

            {/* <button className="group" aria-label="Repost">
              <Repeat2
                className="h-[19px] w-[19px] group-active:scale-90 transition-transform"
                strokeWidth={1.8}
              />
            </button> */}
            {/* 
            <button className="group" aria-label="Share">
              <Send
                className="h-[17px] w-[17px] group-active:scale-90 transition-transform"
                strokeWidth={1.8}
              />
            </button> */}
          </div>

          {/* collapse toggle when there are nested replies */}
          {/* {hasReplies && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="mt-2 flex items-center gap-1 text-[12.5px] sm:text-[13px] font-medium text-neutral-400 hover:text-neutral-600"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`}
                strokeWidth={2}
              />
              {collapsed
                ? `Show ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`
                : "Hide replies"}
            </button>
          )} */}
        </div>
      </div>

      {/* nested replies
      {hasReplies && collapsed && (
        <div className="ml-[15px] sm:ml-[17px] pl-[21px] sm:pl-[23px] text-[10px]">
          {comment.replies.map((reply: any, i: number) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onLike={onLike}
              isLast={i === comment.replies.length - 1}
            />
          ))}
        </div>
      )} */}

      {!isLast && depth === 0 && <div className="mx-4 sm:mx-6" />}
    </div>
  );
}

// ---- root component -----------------------------------------------------

export default function Comments({ comments }: any) {
  useEffect(() => {
    if (!comments) return;
  }, [comments]);

  return (
    <div className="flex flex-col h-screen">
      <div
        className="
      flex-1 overflow-y-auto
      max-w-6xl w-full mx-auto
      [&::-webkit-scrollbar]:w-1
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-gray-200
      [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-gray-500
    "
      >
        {/* {JSON.stringify(comments)}  */}
        {comments.length !== 0 ? (
          <>
            {comments.map((c: any, i: any) => (
              <CommentItem
                key={c.$id}
                comment={c}
                depth={0}
                // onLike={handleLike}
                isLast={i === comments.length - 1}
              />
            ))}
          </>
        ) : (
          <div className="py-6 text-center text-sm text-neutral-500">
            No comments yet.
          </div>
        )}
      </div>
    </div>
  );
}
