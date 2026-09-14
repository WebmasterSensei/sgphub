"use client";
import { useEffect, useState } from "react";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  MessageCircle
} from "lucide-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// ---- config -----------------------------------------------------

// Thread rail cycles through these per nesting level, the way Reddit's
// does — makes it easy to trace which reply belongs to which parent
// without counting indents.
const THREAD_COLORS = ["#878A8C", "#3B82F6", "#F59E0B", "#10B981", "#EC4899"];
const UPVOTE_COLOR = "#FF4500";
const DOWNVOTE_COLOR = "#7193FF";

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

// ---- single comment row (recursive) -----------------------------------------------------

function CommentItem({
  comment,
  depth = 0,
  onVote
}: {
  comment: any;
  depth?: number;
  onVote: (id: string | number, direction: 1 | -1) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const voteState = comment.voteState || 0;
  const score = comment.react ?? 0;
  const childCount = hasReplies ? countDescendants(comment) : 0;
  const railColor = THREAD_COLORS[depth % THREAD_COLORS.length];

  return (
    <div className="py-1">
      <div className="flex gap-2">
        {/* vote column */}
        <div className="flex w-5 shrink-0 flex-col items-center pt-0.5">
          <button
            onClick={() => onVote(comment.$id || comment.id, 1)}
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
            onClick={() => onVote(comment.$id || comment.id, -1)}
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
              <p className="mt-2 mb-2 text-[13px] ml-5 leading-snug text-ink-soft break-words">
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

              {/* <div className="mt-1 flex items-center gap-3 text-[11.5px] font-semibold text-ink-muted">
                <button className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-hover hover:text-ink-soft">
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                  Reply
                </button>
                <button className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-hover hover:text-ink-soft">
                  <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Share
                </button>
              </div> */}
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
  reloadGetComments:() => void;
}) {
  const [comments, setComments] = useState(initialComments || []);
  const [passedData, setPassedData] = useState(initialData);
  const [commentValues, setCommentValues] = useState<Record<string, string>>(
    {}
  );
  const { user } = useAuth();

  const handleVote = (id: string | number, direction: 1 | -1) => {
    setComments((prev) => applyVote(prev, id, direction));
  };

  const submitComment = async (postId: string) => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    const comment = commentValues[postId]?.trim();

    if (!comment) {
      alert("Comment cannot be empty.");
      return;
    }

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

      setCommentValues((prev) => ({
        ...prev,
        [postId]: ""
      }));

      reloadGetComments();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setComments(initialComments);
    setPassedData(initialData);
  }, [initialComments, initialData]);

  const post = passedData;

  return (
    <div className="relative h-full overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-hairline hover:[&::-webkit-scrollbar-thumb]:bg-ink-muted">
      {/* Post Content */}
      {post && (
        <div className="shrink-0 border-b mt-2 border-hairline px-4 py-4">
          <div className="flex gap-3">
            <img
              src={post.user?.avatar}
              alt={post.user?.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-hairline"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
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
              {passedData.images && (
                <div className="relative w-full mb-3 cursor-pointer overflow-hidden">
                  <img
                    src={passedData.images}
                    alt="post"
                    className="w-full object-cover rounded-xl"
                    loading="lazy"
                  />
                </div>
              )}

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
                  {formatCount(post.commentsCount ?? comments.length)} comments
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-hover">
            <MessageCircle
              className="h-5 w-5 text-ink-muted"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-sm font-medium text-ink">No comments yet</p>
          <p className="mt-1 text-xs text-ink-muted">Start the conversation.</p>
        </div>
      ) : (
        <div className="flex flex-col px-27 py-2 pb-5 pt-2">
          {comments.map((c: any) => (
            <CommentItem
              key={c.$id || c.id}
              comment={c}
              depth={0}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {/* Sticky Bottom Input Bar */}
      <div className="sticky bottom-0 z-10 border-t border-hairline bg-background px-3 py-2.5">
        <div className="flex items-center gap-2">
          <textarea
            value={commentValues[passedData.$id] || ""}
            onChange={(e) =>
              setCommentValues((prev) => ({
                ...prev,
                [passedData.$id]: e.target.value
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitComment(passedData.$id);
              }
            }}
            placeholder="Add a comment..."
            rows={3}
            className="flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <button
            className="text-sm font-bold cursor-pointer disabled:opacity-50"
            onClick={() => submitComment(passedData.$id)}
            disabled={!commentValues[passedData.$id]?.trim()}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
