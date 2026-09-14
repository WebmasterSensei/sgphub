// components/Body.tsx — Instagram-style social feed
import { useState, useRef, useEffect, useCallback } from "react";
import { Query, ID } from "appwrite";
import { tablesDB } from "@/lib/appwrite";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  SendHorizontal,
  Loader2
} from "lucide-react";
import { useAuth } from "../providers";
import {
  fetchProfilesByUserIds,
  getPostStats,
  hasLiked,
  togglePostLike
} from "@/lib/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type BodyProps = {
  onSelectComment: (comments: any[]) => void;
  profile: any;
  onViewProfile: (profile: any) => void;
};

type LikesState = Record<string, { liked: boolean; count: number }>;

export default function Body({
  onSelectComment,
  profile,
  onViewProfile
}: BodyProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [postValue, setPostValue] = useState<string>("");
  const [commentValues, setCommentValues] = useState<Record<string, string>>(
    {}
  );
  const [likesState, setLikesState] = useState<LikesState>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [burstPost, setBurstPost] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const { user } = useAuth();
  const lastTap = useRef<Record<string, number>>({});

  const handleImageTap = (postId: string, liked: boolean) => {
    const now = Date.now();
    if (now - (lastTap.current[postId] ?? 0) < 300) {
      if (!liked) handleLike(postId);
      setBurstPost(postId);
      setTimeout(() => setBurstPost(null), 700);
    }
    lastTap.current[postId] = now;
  };

  const handleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      const current = likesState[postId] ?? { liked: false, count: 0 };
      const optimistically = { liked: !current.liked, count: current.count + (current.liked ? -1 : 1) };
      setLikesState((prev) => ({ ...prev, [postId]: optimistically }));
      const nowLiked = await togglePostLike(postId, user.$id);
      if (nowLiked !== optimistically.liked) {
        setLikesState((prev) => ({
          ...prev,
          [postId]: { liked: nowLiked, count: current.count + (nowLiked ? 1 : 0) }
        }));
      }
    },
    [user, likesState]
  );

  const getComments = async (postId: string) => {
    try {
      const result = await tablesDB.listRows({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!,
        queries: [Query.equal("post_id", postId), Query.orderDesc("$createdAt")]
      });

      const commenterIds = result.rows.map((c: any) => c.user_id);
      const profiles = await fetchProfilesByUserIds(commenterIds);

      const commentsWithUsers = result.rows.map((comment: any) => ({
        ...comment,
        user: profiles[comment.user_id] ?? null
      }));

      onSelectComment(commentsWithUsers);
    } catch (error) {
      console.error(error);
    }
  };

  const submitPosts = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!postValue.trim()) {
      alert("Post cannot be empty.");
      return;
    }

    try {
      setSubmittingPost(true);
      await tablesDB.createRow({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          content: postValue.trim(),
          user_id: user.$id
        }
      });

      setPostValue("");
      fetchRows(); // Reload the posts
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingPost(false);
    }
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
      getComments(postId);
      fetchRows(); // Reload the posts
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRows = async () => {
    setIsLoading(true);
    try {
      const postsResult = await tablesDB.listRows({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!,
        queries: [Query.orderDesc("$createdAt")]
      });

      const postRows = postsResult.rows as any[];

      const authorProfileMap = await fetchProfilesByUserIds(
        postRows.map((p: any) => p.user_id)
      );

      const likesMap: Record<string, { liked: boolean; count: number }> = {};
      const stats = await Promise.all(
        postRows.map(async (post: any) => {
          const [stat, liked] = await Promise.all([
            getPostStats(post.$id),
            user ? hasLiked(post.$id, user.$id) : Promise.resolve(false)
          ]);
          likesMap[post.$id] = { liked, count: stat.likes };
          return { ...post, commentsCount: stat.comments };
        })
      );

      setPosts(
        stats.map((post: any, index: number) => ({
          ...post,
          index,
          user: authorProfileMap[post.user_id] ?? null
        }))
      );
      setLikesState(likesMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sharePost = async (content: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/components/#post-${postId}`
      );
    } catch {}
    alert(`Post copied to clipboard — "${content.slice(0, 40)}${content.length > 40 ? "…" : ""}"`);
  };

  return (
    <main className="flex flex-1 flex-col items-center overflow-auto bg-background">
      {/* Sticky "create post" bar */}
      <div className="sticky top-0 z-30 flex w-full max-w-full items-center gap-3 border-b border-hairline bg-surface/90 px-3.5 py-2.5 backdrop-blur-md">
        <div className="w-9 h-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
          <button
            onClick={() => onViewProfile(profile)}
            className="block h-full w-full overflow-hidden rounded-full bg-background p-[2px]"
          >
            <img
              src={profile?.avatar}
              alt="your profile"
              className="h-full w-full rounded-full object-cover"
            />
          </button>
        </div>

        <textarea
          placeholder="What's on your mind?"
          rows={1}
          className="flex-1 w-full resize-none rounded-2xl bg-surface-raised px-5 py-3 text-sm text-ink shadow-sm outline-none transition-all duration-200 border border-transparent placeholder:text-ink-muted hover:bg-hover focus:bg-surface focus:border-hairline focus:ring-2 focus:ring-hairline"
          aria-label="Create a new post"
          value={postValue}
          onChange={(e) => setPostValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitPosts();
            }
          }}
        />

        <button
          onClick={submitPosts}
          disabled={submittingPost || !postValue.trim()}
          aria-label="Post"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-hover disabled:opacity-40"
        >
          {submittingPost ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <SendHorizontal className="h-6 w-6" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {!isLoading ? (
        <div className="flex w-full max-w-full flex-col items-center pb-6">
          {posts.length === 0 && (
            <p className="py-16 text-center text-sm text-ink-muted">
              No posts yet — be the first to post!
            </p>
          )}
          {posts.map((data) => {
            const state = likesState[data.$id] ?? { liked: false, count: 0 };
            const commentCount = data.commentsCount ?? 0;
            return (
              <article
                key={data.$id}
                id={`post-${data.$id}`}
                className="mb-3 w-full border border-hairline bg-surface rounded-lg"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <button
                    onClick={() => onViewProfile(data.user)}
                    className="flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                      <div className="h-full w-full rounded-full bg-background p-[2px]">
                        <img
                          src={data.user?.avatar}
                          alt="profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-sm font-semibold text-ink">
                        {data.user?.username || data.user?.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {data.user?.name}
                      </p>
                    </div>
                  </button>

                  <MoreHorizontal className="h-5 w-5 cursor-pointer text-ink-soft" />
                </div>

                {/* Image */}
                {data.images && (
                  <div
                    className="relative w-full cursor-pointer overflow-hidden"
                    onClick={() => handleImageTap(data.$id, state.liked)}
                  >
                    <img
                      src={data.images}
                      alt="post"
                      className="w-full object-cover"
                      loading="lazy"
                    />
                    {burstPost === data.$id && (
                      <Heart
                        className="absolute inset-0 m-auto h-24 w-24 text-white drop-shadow-lg animate-ping-once"
                        fill="white"
                        strokeWidth={0}
                      />
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between px-3 pt-2.5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(data.$id)}
                      aria-label="Like"
                      className="active:scale-90 transition-transform"
                    >
                      <Heart
                        className={`w-6 h-6 transition-colors cursor-pointer ${
                          state.liked ? "text-rose-500" : "text-ink"
                        }`}
                        fill={state.liked ? "currentColor" : "none"}
                        strokeWidth={2}
                      />
                    </button>
                    <button
                      onClick={() => getComments(data.$id)}
                      aria-label="Comment"
                      className="active:scale-90 transition-transform"
                    >
                      <MessageCircle
                        className="h-6 w-6 cursor-pointer text-ink"
                        strokeWidth={2}
                      />
                    </button>
                    <button
                      onClick={() => sharePost(data.content, data.$id)}
                      aria-label="Share"
                      className="active:scale-90 transition-transform"
                    >
                      <Send className="h-6 w-6 cursor-pointer text-ink" strokeWidth={2} />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setSaved((s) => ({ ...s, [data.$id]: !s[data.$id] }))
                    }
                    aria-label="Save"
                    className="active:scale-90 transition-transform"
                  >
                    <Bookmark
                      className={`h-6 w-6 transition-colors ${
                        saved[data.$id] ? "text-ink fill-current" : "text-ink"
                      }`}
                      fill={saved[data.$id] ? "currentColor" : "none"}
                      strokeWidth={2}
                    />
                  </button>
                </div>

                {/* Likes */}
                <p className="px-3 pt-2 text-sm font-semibold text-ink">
                  {state.count.toLocaleString()} likes
                </p>

                {/* Caption */}
                <div className="px-3 pt-1 text-sm text-ink">
                  <span className="font-semibold mr-1.5">
                    {data.user?.username || data.user?.name}
                  </span>
                  <span className="break-words">{data.content}</span>
                </div>

                {/* Comments link */}
                {commentCount > 0 && (
                  <button
                    className="block px-3 pt-1.5 text-sm text-ink-muted cursor-pointer hover:text-ink-soft"
                    onClick={() => getComments(data.$id)}
                  >
                    View all {commentCount}{" "}
                    {commentCount > 1 ? "comments" : "comment"}
                  </button>
                )}

                {/* Timestamp */}
                <p className="px-3 pt-1.5 pb-2 text-[10px] uppercase tracking-wide text-ink-muted">
                  {dayjs(data.$createdAt).fromNow()}
                </p>

                {/* Add comment */}
                <div className="flex items-center gap-2 border-t border-hairline px-3 py-2.5">
                  <input
                    type="text"
                    value={commentValues[data.$id] || ""}
                    onChange={(e) =>
                      setCommentValues((prev) => ({
                        ...prev,
                        [data.$id]: e.target.value
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitComment(data.$id);
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                  />
                  <button
                    className="text-sm font-semibold text-clay disabled:opacity-40"
                    onClick={() => submitComment(data.$id)}
                    disabled={!commentValues[data.$id]?.trim()}
                  >
                    Post
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex w-full max-w-[470px] flex-col gap-3 pb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="w-full animate-pulse overflow-hidden border border-hairline bg-surface rounded-lg"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-hover" />
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-hover" />
                  <div className="h-2 w-20 rounded bg-hover" />
                </div>
              </div>
              <div className="h-72 w-full bg-hover" />
              <div className="flex gap-4 px-4 pt-3">
                <div className="h-6 w-6 rounded bg-hover" />
                <div className="h-6 w-6 rounded bg-hover" />
                <div className="h-6 w-6 rounded bg-hover" />
              </div>
              <div className="px-4 pt-3">
                <div className="h-3 w-24 rounded bg-hover" />
              </div>
              <div className="px-4 py-3">
                <div className="h-3 w-3/4 rounded bg-hover" />
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        @keyframes ping-once {
          0% { transform: scale(0.6); opacity: 0; }
          25% { transform: scale(1.15); opacity: 1; }
          60% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-ping-once {
          animation: ping-once 0.7s ease-out;
        }
      `}</style>
    </main>
  );
}