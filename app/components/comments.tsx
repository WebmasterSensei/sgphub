"use client";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
  Loader2,
  X
} from "lucide-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "../providers";
import { tablesDB } from "@/lib/appwrite";
import { ID } from "appwrite";

dayjs.extend(relativeTime);

const COMMENT_MAX_LEN = 2000;

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

// ---- reusable composer, matching PcComments' ----------------------------

function CommentComposer({
  avatar,
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  submitting,
  autoFocus = false,
  compact = false
}: {
  avatar?: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder: string;
  submitting: boolean;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const trimmed = value.trim();
  const overLimit = value.length > COMMENT_MAX_LEN;
  const canSubmit = !!trimmed && !overLimit && !submitting;

  return (
    <div className="flex gap-2">
      {avatar !== undefined && (
        <img
          src={avatar || "/default-avatar.png"}
          alt=""
          className={`shrink-0 rounded-full object-cover ${compact ? "h-6 w-6" : "h-8 w-8"}`}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-hairline bg-hover/40 px-3 py-2 transition focus-within:border-ink-muted focus-within:bg-transparent">
          <textarea
            ref={textareaRef}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
              if (e.key === "Escape" && onCancel) onCancel();
            }}
            placeholder={placeholder}
            rows={1}
            className="block max-h-[200px] w-full resize-none bg-transparent text-sm leading-snug text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span
            className={`text-[11px] ${overLimit ? "font-semibold text-red-500" : "text-ink-muted"}`}
          >
            {value.length > COMMENT_MAX_LEN - 200
              ? `${value.length}/${COMMENT_MAX_LEN}`
              : "Enter to post \u00b7 Shift+Enter for a new line"}
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:bg-hover hover:text-ink-soft"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-background transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- single comment row (recursive) -----------------------------------------------------

function CommentItem({
  comment,
  depth = 0,
  onLike,
  userAvatar,
  replyingId,
  onStartReply,
  onCancelReply,
  replyValue,
  onReplyChange,
  onSubmitReply,
  submittingReply
}: {
  comment: any;
  depth?: number;
  onLike: (id: string | number) => void;
  userAvatar?: string;
  replyingId: string | number | null;
  onStartReply: (id: string | number) => void;
  onCancelReply: () => void;
  replyValue: string;
  onReplyChange: (v: string) => void;
  onSubmitReply: (id: string | number) => void;
  submittingReply: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const commentId = comment.$id || comment.id;
  const isReplying = replyingId === commentId;

  return (
    <div className={`${depth > 0 ? "ml-4 sm:ml-6" : ""}`}>
      <div className="group flex gap-3 rounded-xl border border-transparent p-2 transition hover:border-hairline hover:bg-hover">
        {/* avatar */}
        <img
          src={comment.user?.avatar || "/default-avatar.png"}
          alt={comment.user?.name || "User"}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-hairline"
        />

        {/* content */}
        <div className="min-w-0 flex-1">
          {/* header */}
          <div className="flex items-center gap-1.5 text-[14px] sm:text-[15px]">
            <span className="truncate font-semibold text-ink">
              {comment.user?.name || "Anonymous"}
            </span>
            <span className="whitespace-nowrap text-ink-muted text-[10px] sm:text-[12px]">
              {comment.$updatedAt ? dayjs(comment.$updatedAt).fromNow() : ""}
            </span>

            <button
              className="ml-auto -mr-1 rounded-full p-1 text-ink-muted opacity-0 transition hover:bg-hover hover:text-ink-soft group-hover:opacity-100"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* text */}
          <p className="mt-0.5 text-[12px] sm:text-[13px] leading-snug text-ink-soft break-words">
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
          <div className="mt-1.5 flex items-center justify-end gap-3 text-ink-soft">
            <button
              onClick={() =>
                isReplying ? onCancelReply() : onStartReply(commentId)
              }
              className="text-[12.5px] font-semibold text-ink-muted transition hover:text-ink-soft"
            >
              Reply
            </button>
            <button
              onClick={() => onLike(commentId)}
              className="group/btn flex items-center gap-1.5 cursor-pointer"
              aria-label="Like"
            >
              <Heart
                className={`h-[15px] w-[15px] transition-transform group-active/btn:scale-90 ${
                  comment.liked
                    ? "fill-rose-500 stroke-rose-500"
                    : "stroke-current"
                }`}
                strokeWidth={2}
              />
              <span
                className={`text-[12.5px] sm:text-[13px] ${
                  comment.liked ? "text-rose-500" : ""
                }`}
              >
                {formatCount(comment.react)}
              </span>
            </button>
          </div>

          {isReplying && (
            <div className="mt-2">
              <CommentComposer
                avatar={userAvatar}
                value={replyValue}
                onChange={onReplyChange}
                onSubmit={() => onSubmitReply(commentId)}
                onCancel={onCancelReply}
                placeholder={`Reply to ${comment.user?.name || "this comment"}...`}
                submitting={submittingReply}
                autoFocus
                compact
              />
            </div>
          )}

          {/* collapse toggle */}
          {hasReplies && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="mt-2 flex items-center gap-1 text-[12.5px] font-medium text-ink-muted hover:text-ink-soft"
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
        <div className="mt-1 space-y-1 border-l border-hairline pl-2 ml-4 sm:ml-6">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.$id || reply.id}
              comment={reply}
              depth={depth + 1}
              onLike={onLike}
              userAvatar={userAvatar}
              replyingId={replyingId}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              replyValue={replyValue}
              onReplyChange={onReplyChange}
              onSubmitReply={onSubmitReply}
              submittingReply={submittingReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- root component -----------------------------------------------------

export default function Comments({
  comments: initialComments,
  passedData,
  reloadGetComments
}: {
  comments: any[];
  passedData?: any;
  reloadGetComments?: () => void;
}) {
  const [comments, setComments] = useState(initialComments || []);
  const [commentValue, setCommentValue] = useState("");
  const [posting, setPosting] = useState(false);

  const [replyingId, setReplyingId] = useState<string | number | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const userAvatar = (user as any)?.avatar || (user as any)?.image || undefined;

  const handleLike = (id: string | number) => {
    setComments((prev) => toggleLike(prev, id));
  };

  useEffect(() => {
    setComments(initialComments || []);
  }, [initialComments]);

  const flashError = (msg: string) => {
    setError(msg);
    window.setTimeout(() => setError(null), 3500);
  };

  const postId = passedData?.$id;

  const submitComment = async () => {
    if (!user) {
      flashError("Please log in to comment.");
      return;
    }
    if (!postId) {
      flashError("Couldn't tell which post this is for.");
      return;
    }
    const comment = commentValue.trim();
    if (!comment) return;

    setPosting(true);
    try {
      await tablesDB.createRow({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          comments: comment,
          user_id: user.$id,
          post_id: postId
        }
      });
      setCommentValue("");
      reloadGetComments?.();
    } catch (err) {
      console.error(err);
      flashError("Couldn't post your comment. Try again.");
    } finally {
      setPosting(false);
    }
  };

  // Note: assumes the comments table has a `parent_id` column for
  // nesting a reply under its parent comment — same assumption as
  // PcComments' submitReply.
  const submitReply = async (parentId: string | number) => {
    if (!user) {
      flashError("Please log in to reply.");
      return;
    }
    if (!postId) {
      flashError("Couldn't tell which post this is for.");
      return;
    }
    const reply = replyValue.trim();
    if (!reply) return;

    setPostingReply(true);
    try {
      await tablesDB.createRow({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          comments: reply,
          user_id: user.$id,
          post_id: postId,
          parent_id: parentId
        }
      });
      setReplyValue("");
      setReplyingId(null);
      reloadGetComments?.();
    } catch (err) {
      console.error(err);
      flashError("Couldn't post your reply. Try again.");
    } finally {
      setPostingReply(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="
          flex-1 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-hairline
          hover:[&::-webkit-scrollbar-thumb]:bg-ink-muted
        "
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle
              className="mb-3 h-8 w-8 text-ink-muted"
              strokeWidth={1.5}
            />
            <p className="text-sm text-ink-soft">No comments yet</p>
            <p className="mt-1 text-xs text-ink-muted">
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
                userAvatar={userAvatar}
                replyingId={replyingId}
                onStartReply={(id) => {
                  setReplyingId(id);
                  setReplyValue("");
                }}
                onCancelReply={() => {
                  setReplyingId(null);
                  setReplyValue("");
                }}
                replyValue={replyValue}
                onReplyChange={setReplyValue}
                onSubmitReply={submitReply}
                submittingReply={postingReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom composer — matches PcComments */}
      <div className="shrink-0 border-t border-hairline bg-background px-1 pt-2.5">
        {error && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500">
            {error}
            <button onClick={() => setError(null)} aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {user ? (
          <CommentComposer
            avatar={userAvatar}
            value={commentValue}
            onChange={setCommentValue}
            onSubmit={submitComment}
            placeholder="Add a comment..."
            submitting={posting}
          />
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-hairline bg-hover/40 px-3 py-2.5 text-sm text-ink-muted">
            Log in to join the conversation.
          </div>
        )}
      </div>
    </div>
  );
}