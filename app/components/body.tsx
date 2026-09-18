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
  Loader2,
  Clipboard,
  Paperclip,
  ImagePlus,
  X
} from "lucide-react";
import { useAuth } from "../providers";
import {
  fetchProfilesByUserIds,
  getPostStats,
  hasLiked,
  togglePostLike
} from "@/lib/api";
import {
  uploadImage,
  validateImage,
  parseImages,
  joinImages,
  MAX_POST_IMAGES
} from "@/lib/storage";
import ImageLightbox from "./imagelightbox";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type BodyProps = {
  // Now just reports which post was clicked — Main owns fetching and
  // reloading the comments themselves (Main doesn't unmount while the
  // comments panel is open, Body does).
  onSelectComment: (postId: string, passData: any) => void;
  profile: any;
  onViewProfile: (profile: any) => void;
};

type LikesState = Record<string, { liked: boolean; count: number }>;

/** Fisher–Yates shuffle (in-place) */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postImagePreviews, setPostImagePreviews] = useState<string[]>([]);
  const [postImageError, setPostImageError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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
      const optimistically = {
        liked: !current.liked,
        count: current.count + (current.liked ? -1 : 1)
      };
      setLikesState((prev) => ({ ...prev, [postId]: optimistically }));
      const nowLiked = await togglePostLike(postId, user.$id);
      if (nowLiked !== optimistically.liked) {
        setLikesState((prev) => ({
          ...prev,
          [postId]: {
            liked: nowLiked,
            count: current.count + (nowLiked ? 1 : 0)
          }
        }));
      }
    },
    [user, likesState]
  );

  // Just hand the postId + post data up to Main, which does the actual
  // fetching. Main stays mounted while the comments panel is open, so
  // it can reload comments on demand — Body can't, since it unmounts
  // as soon as the comments panel opens.
  const getComments = (postId: string, data: any) => {
    onSelectComment(postId, data);
    fetchRows(false); // keep chronological order, refresh comment counts
  };

  const submitPosts = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!postValue.trim() && postImages.length === 0) {
      alert("Post cannot be empty.");
      return;
    }

    try {
      setSubmittingPost(true);
      let images = "";
      if (postImages.length > 0) {
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_AVATAR_BUCKET_ID;
        if (!bucketId) throw new Error("Post image bucket is not configured.");
        const urls: string[] = [];
        for (const file of postImages) {
          urls.push(await uploadImage(file, bucketId));
        }
        images = joinImages(urls);
      }
      await tablesDB.createRow({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!,
        rowId: ID.unique(),
        data: {
          content: postValue.trim(),
          user_id: user.$id,
          ...(images ? { images } : {})
        }
      });

      setPostValue("");
      setPostImages([]);
      setPostImagePreviews([]);
      setPostImageError(null);
      // Do NOT shuffle — newest post must stay at the top
      fetchRows(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingPost(false);
    }
  };

  const pickPostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      files.forEach(validateImage);
    } catch (err) {
      setPostImageError(
        err instanceof Error ? err.message : "Could not read that image."
      );
      return;
    }
    setPostImageError(null);
    const remaining = MAX_POST_IMAGES - postImages.length;
    const accepted = files.slice(0, Math.max(remaining, 0));
    if (files.length > remaining) {
      setPostImageError(
        remaining > 0
          ? `Only ${remaining} more image${remaining > 1 ? "s" : ""} allowed (max ${MAX_POST_IMAGES}).`
          : `Limit of ${MAX_POST_IMAGES} images per post.`
      );
    }
    setPostImages((prev) => [...prev, ...accepted]);
    setPostImagePreviews((prev) => [
      ...prev,
      ...accepted.map((file) => URL.createObjectURL(file))
    ]);
    e.target.value = "";
  };

  const removePostImage = (index: number) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
    setPostImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
      fetchRows(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRows = async (shouldShuffle = false) => {
    if (!user?.$id) return;

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
            hasLiked(post.$id, user.$id)
          ]);

          likesMap[post.$id] = {
            liked,
            count: stat.likes
          };

          return {
            ...post,
            commentsCount: stat.comments
          };
        })
      );

      let finalPosts = stats.map((post: any, index: number) => ({
        ...post,
        index,
        user: authorProfileMap[post.user_id] ?? null
      }));

      // Only randomize on refresh / first load
      if (shouldShuffle) {
        finalPosts = shuffleArray(finalPosts);
      }

      setPosts(finalPosts);
      setLikesState(likesMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load / page refresh → random order
  useEffect(() => {
    if (user?.$id) {
      fetchRows(true);
    }
  }, [user?.$id]);

  const sharePost = async (content: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/components/#post-${postId}`
      );
    } catch {}
    alert(
      `Post copied to clipboard — "${content.slice(0, 40)}${content.length > 40 ? "…" : ""}"`
    );
  };

  return (
    <main className="flex flex-1 flex-col items-center overflow-auto bg-background">
      {/* Sticky "create post" bar */}
      <div className="sticky top-0 z-30 flex w-full max-w-full flex-col border-b border-hairline bg-surface/90 px-3.5 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
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

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={pickPostImage}
          />

          <button
            onClick={() => imageInputRef.current?.click()}
            aria-label="Attach images"
            disabled={submittingPost}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-hover disabled:opacity-40"
          >
            <ImagePlus className="h-6 w-6" strokeWidth={1.8} />
          </button>

          <button
            onClick={submitPosts}
            disabled={
              submittingPost || (!postValue.trim() && postImages.length === 0)
            }
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

        {postImagePreviews.length > 0 && (
          <div className="mt-2 flex items-start gap-3">
            <div className="flex flex-1 flex-wrap gap-2">
              {postImagePreviews.map((preview, index) => (
                <div
                  key={`${preview}-${index}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-hairline"
                >
                  <img
                    src={preview}
                    alt="post preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removePostImage(index)}
                    aria-label="Remove image"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {postImageError && (
              <p className="w-40 shrink-0 text-xs text-red-500">
                {postImageError}
              </p>
            )}
          </div>
        )}
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

                  {/* Timestamp */}
                  <p className="px-3 pt-1.5 pb-2 text-[10px] tracking-wide text-ink">
                    {dayjs(data.$createdAt).fromNow()}
                  </p>
                </div>

                {/* Image */}
                {data.images &&
                  (() => {
                    const images = parseImages(data.images);
                    return (
                      <div
                        className="relative w-full cursor-pointer overflow-hidden bg-black"
                        onClick={() => handleImageTap(data.$id, state.liked)}
                      >
                        <img
                          src={images[0]}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightbox({ images, index: 0 });
                          }}
                          aria-label="Preview image"
                          className="relative flex h-[500px] w-full items-center justify-center sm:h-[550px]"
                        >
                          <img
                            src={images[0]}
                            alt="post"
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                          {images.length > 1 && (
                            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                              {images.length} photos
                            </span>
                          )}
                        </button>

                        {burstPost === data.$id && (
                          <Heart
                            className="absolute inset-0 m-auto h-24 w-24 animate-ping-once text-white drop-shadow-lg"
                            fill="white"
                            strokeWidth={0}
                          />
                        )}
                      </div>
                    );
                  })()}

                {/* Caption */}
                <div className="px-3 pt-2 pb-2 text-sm text-ink">
                  <span className="break-words">{data.content}</span>
                </div>

                {commentCount > 0 && (
                  <button
                    className="block px-3 pt-1.5 pb-2 text-sm text-ink-muted cursor-pointer hover:text-ink-soft"
                    onClick={() => getComments(data.$id, data)}
                  >
                    View all {commentCount}{" "}
                    {commentCount > 1 ? "comments" : "comment"}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between px-3 pt-1 pb-2.5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(data.$id)}
                      aria-label="Like"
                      className="active:scale-90 transition-transform"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors cursor-pointer ${
                          state.liked ? "text-rose-500" : "text-ink"
                        }`}
                        fill={state.liked ? "currentColor" : "none"}
                        strokeWidth={2}
                      />
                    </button>
                    <button
                      onClick={() => getComments(data.$id, data)}
                      aria-label="Comment"
                      className="relative active:scale-90 transition-transform"
                    >
                      <MessageCircle
                        className="h-5 w-5 cursor-pointer text-ink"
                        strokeWidth={2}
                      />
                      {commentCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {commentCount > 99 ? "99+" : commentCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => sharePost(data.content, data.$id)}
                      aria-label="Share"
                      className="active:scale-90 transition-transform"
                    >
                      <Paperclip
                        className="h-5 w-5 cursor-pointer text-ink"
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                  <div className="flex justify-between gap-1 text-sm">
                    {state?.count > 0 && (
                      <p>
                        {state?.count} {state?.count > 1 ? "likes" : "like"}
                      </p>
                    )}
                  </div>
                </div>

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
                    className="text-sm font-bold cursor-pointer"
                    onClick={() => submitComment(data.$id)}
                    disabled={!commentValues[data.$id]?.trim()}
                  >
                    Comment
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex w-full max-w-full flex-col gap-3 pb-6">
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

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </main>
  );
}
