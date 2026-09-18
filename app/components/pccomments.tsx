"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  MessageCircle,
  Loader2,
  X
} from "lucide-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { parseImages } from "@/lib/storage";
import ImageLightbox from "./imagelightbox";

dayjs.extend(relativeTime);

// ---- config -----------------------------------------------------

// Thread rail cycles through these per nesting level, the way Reddit's
// does — makes it easy to trace which reply belongs to which parent
// without counting indents.
const THREAD_COLORS = ["#878A8C", "#3B82F6", "#F59E0B", "#10B981", "#EC4899"];
const UPVOTE_COLOR = "#FF4500";
const DOWNVOTE_COLOR = "#7193FF";
const COMMENT_MAX_LEN = 2000;

// ---- helpers -----------------------------------------------------

function formatCount(n: number | string | undefined) {
  if (!n && n !== 0) return "0";
  const num = Number(n);
  if (Math.abs(num) >= 1000)
    return (num / 1000).toFixed(Math.abs(num) % 1000 >= 100 ? 1 : 0) + "k";
  return String(num);
}

function countDescendants(comment: any): number {
  if (!comment.replies?.length) return 0;
  return comment.replies.reduce(
    (sum: number, r: any) => sum + 1 + countDescendants(r),
    0
  );
}

// direction is 1 (upvote) or -1 (downvote); clicking the active
// direction again clears the vote, same as Reddit
function applyVote(
  comments: any[],
  id: string | number,
  direction: 1 | -1
): any[] {
  return comments.map((c) => {
    if (c.$id === id || c.id === id) {
      const base = c.baseReact ?? c.react ?? 0;
      const current = c.voteState || 0;
      const next = current === direction ? 0 : direction;
      return { ...c, baseReact: base, voteState: next, react: base + next };
    }
    if (c.replies?.length) {
      return { ...c, replies: applyVote(c.replies, id, direction) };
    }
    return c;
  });
}

// ---- tiny reusable input bar (used for both the root composer and
// inline replies) so the "add a comment" experience is consistent
// everywhere in the thread -----------------------------------------------------

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

  // auto-grow the textarea with content instead of showing a fixed,
  // often-too-tall (or too-short) box
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
  onVote,
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
  onVote: (id: string | number, direction: 1 | -1) => void;
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
  const voteState = comment.voteState || 0;
  const score = comment.react ?? 0;
  const childCount = hasReplies ? countDescendants(comment) : 0;
  const railColor = THREAD_COLORS[depth % THREAD_COLORS.length];
  const commentId = comment.$id || comment.id;
  const isReplying = replyingId === commentId;

  return (
    <div className="py-1 ml-10">
      <div className="flex gap-2">
        {/* vote column */}
        <div className="flex w-5 shrink-0 flex-col items-center pt-0.5">
          <button
            onClick={() => onVote(commentId, 1)}
            aria-label="Upvote"
            aria-pressed={voteState === 1}
            className="rounded p-0.5 text-ink-muted transition hover:bg-hover"
          >
            <ArrowBigUp
              className="h-4 w-4"
              strokeWidth={2}
              style={
                voteState === 1
                  ? { fill: UPVOTE_COLOR, color: UPVOTE_COLOR }
                  : undefined
              }
            />
          </button>
          <span
            className="text-[12px] font-bold tabular-nums"
            style={{
              color:
                voteState === 1
                  ? UPVOTE_COLOR
                  : voteState === -1
                    ? DOWNVOTE_COLOR
                    : undefined
            }}
          >
            {formatCount(score)}
          </span>
          <button
            onClick={() => onVote(commentId, -1)}
            aria-label="Downvote"
            aria-pressed={voteState === -1}
            className="rounded p-0.5 text-ink-muted transition hover:bg-hover"
          >
            <ArrowBigDown
              className="h-4 w-4"
              strokeWidth={2}
              style={
                voteState === -1
                  ? { fill: DOWNVOTE_COLOR, color: DOWNVOTE_COLOR }
                  : undefined
              }
            />
          </button>
        </div>

        {/* content */}
        <div className="min-w-0 flex-1">
          {/* meta line */}
          <div className="flex flex-wrap items-center gap-1 text-[12.5px] leading-none">
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand thread" : "Collapse thread"}
              className="mr-0.5 w-3 shrink-0 select-none text-center font-mono text-ink-muted hover:text-ink-soft"
            >
              {collapsed ? "+" : "\u2013"}
            </button>
            <img
              src={comment.user?.avatar || "/default-avatar.png"}
              alt=""
              className="h-4 w-4 shrink-0 rounded-full object-cover"
            />
            <span className="font-semibold text-ink">
              {comment.user?.name || "Anonymous"}
            </span>
            <span className="text-ink-muted">&middot;</span>
            <span className="text-ink-muted">{formatCount(score)} points</span>
            <span className="text-ink-muted">&middot;</span>
            <span className="text-ink-muted">
              {comment.$updatedAt ? dayjs(comment.$updatedAt).fromNow() : ""}
            </span>
            {collapsed && childCount > 0 && (
              <span className="text-ink-muted">
                ({childCount} {childCount === 1 ? "child" : "children"})
              </span>
            )}
          </div>

          {!collapsed && (
            <>
              <p className="mt-2 mb-2 ml-5 text-[13px] leading-snug text-ink-soft break-words">
                {comment.comments}
              </p>

              {comment.image && (
                <div className="mt-2 max-w-full overflow-hidden rounded-md ring-1 ring-hairline sm:max-w-sm">
                  <img
                    src={comment.image}
                    alt=""
                    className="h-auto max-h-72 w-full object-cover"
                  />
                </div>
              )}

              {/* <div className="ml-5 mt-1 flex items-center gap-3 text-[11.5px] font-semibold text-ink-muted">
                <button
                  onClick={() =>
                    isReplying ? onCancelReply() : onStartReply(commentId)
                  }
                  className="flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-hover hover:text-ink-soft"
                >
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                  Reply
                </button>
                <button className="flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-hover hover:text-ink-soft">
                  <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Share
                </button>
              </div> */}

              {isReplying && (
                <div className="ml-5 mt-2">
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
            </>
          )}
        </div>
      </div>

      {/* nested replies — each level's own left border stacks with its
          ancestors', producing the familiar concentric rail effect */}
      {hasReplies && !collapsed && (
        <div
          className="mt-0.5 border-l-2 pl-3"
          style={{ borderColor: railColor, marginLeft: 9 }}
        >
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.$id || reply.id}
              comment={reply}
              depth={depth + 1}
              onVote={onVote}
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

import { useAuth } from "../providers";
import { tablesDB } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

export default function PcComments({
  comments: initialComments,
  passedData: initialData,
  reloadGetComments
}: {
  comments: any[];
  passedData: any;
  reloadGetComments: () => void;
}) {
  const [comments, setComments] = useState(initialComments || []);
  const [passedData, setPassedData] = useState(initialData);
  const [commentValue, setCommentValue] = useState("");
  const [posting, setPosting] = useState(false);

  const [replyingId, setReplyingId] = useState<string | number | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const { user } = useAuth();

  const [currentUserAvatar, setCurrentUserAvatar] = useState(
    "/default-avatar.png"
  );

  const handleVote = (id: string | number, direction: 1 | -1) => {
    setComments((prev) => applyVote(prev, id, direction));
  };

  const flashError = (msg: string) => {
    setError(msg);
    window.setTimeout(() => setError(null), 3500);
  };

  const submitComment = async () => {
    if (!user) {
      flashError("Please log in to comment.");
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
          post_id: passedData.$id
        }
      });
      setCommentValue("");
      reloadGetComments();
    } catch (err) {
      console.error(err);
      flashError("Couldn't post your comment. Try again.");
    } finally {
      setPosting(false);
    }
  };

  // Note: replying assumes the comments table has a `parent_id` column
  // used to nest a reply under its parent comment. Adjust the field
  // name below if your schema differs.
  const submitReply = async (parentId: string | number) => {
    if (!user) {
      flashError("Please log in to reply.");
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
          post_id: passedData.$id,
          parent_id: parentId
        }
      });
      setReplyValue("");
      setReplyingId(null);
      reloadGetComments();
    } catch (err) {
      console.error(err);
      flashError("Couldn't post your reply. Try again.");
    } finally {
      setPostingReply(false);
    }
  };

  useEffect(() => {
    setComments(initialComments || []);
    setPassedData(initialData);

    if (!user?.$id) {
      setCurrentUserAvatar("/default-avatar.png");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await tablesDB.listRows({
          databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
          queries: [Query.equal("user_id", user.$id), Query.limit(1)]
        });

        const profile = response.rows?.[0];

        setCurrentUserAvatar(profile?.avatar || "/default-avatar.png");
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setCurrentUserAvatar("/default-avatar.png");
      }
    };

    loadProfile();
  }, [initialComments, initialData]);

  const post = passedData;

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-hairline hover:[&::-webkit-scrollbar-thumb]:bg-ink-muted">
        {/* Post Content */}
        {post && (
          <div className="shrink-0 border-b border-hairline px-4 py-4">
            <div className="flex items-start gap-3">
              <img
                src={post.user?.avatar}
                alt={post.user?.name}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-hairline"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {post.user?.name}
                  </span>
                  {post.$createdAt && (
                    <span className="text-xs text-ink-muted">
                      {dayjs(post.$createdAt).fromNow()}
                    </span>
                  )}
                </div>

                {passedData.images &&
                  (() => {
                    const images = parseImages(passedData.images);

                    return (
                      <div className="relative mb-3 mt-1 w-full overflow-hidden rounded-xl bg-black">
                        {/* Blurred background */}
                        <img
                          src={images[0]}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
                        />

                        {/* Dark/soft overlay */}
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Main image */}
                        <button
                          onClick={() => setLightbox({ images, index: 0 })}
                          aria-label="Preview image"
                          className="relative flex h-[260px] max-h-[480px] w-full items-center justify-center"
                        >
                          <img
                            src={images[0]}
                            alt="post"
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />

                          {/* Photo count */}
                          {images.length > 1 && (
                            <span className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                              {images.length} photos
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })()}

                {post.title && (
                  <p className="text-[15px] font-semibold leading-snug text-ink">
                    {post.title}
                  </p>
                )}
                {post.content && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                    {post.content}
                  </p>
                )}
                <div className="mt-1.5 flex gap-4 text-xs text-ink-muted">
                  <span>{formatCount(post.likes ?? 0)} likes</span>
                  <span>
                    {formatCount(post.commentsCount ?? comments.length)}{" "}
                    comments
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="flex flex-col  items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-hover">
              <MessageCircle
                className="h-5 w-5 text-ink-muted"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm font-medium text-ink">No comments yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Start the conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-4 py-2 pb-5 pt-2 sm:px-8">
            {comments.map((c: any) => (
              <CommentItem
                key={c.$id || c.id}
                comment={c}
                depth={0}
                onVote={handleVote}
                userAvatar={currentUserAvatar}
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

      {/* Sticky Bottom Composer */}
      <div className="shrink-0 border-t border-hairline bg-background px-3 py-1">
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
            avatar={currentUserAvatar}
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

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
