// components/profileview.tsx — Instagram-style profile page
"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserMinus,
  Loader2,
  Grid,
  X,
  Users,
  Clock
} from "lucide-react";
import {
  fetchUserPosts,
  getPostStats,
  getFollowCounts,
  isFollowing,
  toggleFollow,
  getFriendStatus,
  getFriendCount,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  FriendStatus
} from "@/lib/api";
import { parseImages } from "@/lib/storage";
import ImageLightbox from "./imagelightbox";
import { useAuth } from "../providers";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type ProfileViewProps = {
  profile: any;
  authProfile: any;
  onBack: () => void;
  onEditProfile: () => void;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-3">
      <span className="text-base font-semibold text-ink">{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

export default function ProfileView({
  profile,
  authProfile,
  onBack,
  onEditProfile
}: ProfileViewProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [followingState, setFollowingState] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendRow, setFriendRow] = useState<any>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [busyFriend, setBusyFriend] = useState(false);
  const [activePost, setActivePost] = useState<any>(null);
  const [postStats, setPostStats] = useState<Record<string, any>>({});
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const isSelf = Boolean(
    user && profile && (profile.user_id === user.$id || profile.$id === authProfile?.$id)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile) return;
      const [userPosts, counts, friendCountResult] = await Promise.all([
        fetchUserPosts(profile.user_id),
        getFollowCounts(profile.user_id),
        getFriendCount(profile.user_id)
      ]);
      if (cancelled) return;
      setFollowers(counts.followers);
      setFollowing(counts.following);
      setFriendCount(friendCountResult);
      const withAuthor = userPosts.map((p) => ({ ...p, user: profile }));
      setPosts(withAuthor);
      if (user && !isSelf) {
        const [followingNow, status] = await Promise.all([
          isFollowing(user.$id, profile.user_id),
          getFriendStatus(user.$id, profile.user_id)
        ]);
        if (cancelled) return;
        setFollowingState(followingNow);
        setFriendStatus(status.status);
        setFriendRow(status.row);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, user, isSelf]);

  const handleToggleFollow = async () => {
    if (!user || isSelf) return;
    setBusyFollow(true);
    const nowFollowing = await toggleFollow(user.$id, profile.user_id);
    setFollowingState(nowFollowing);
    setFollowers((c) => c + (nowFollowing ? 1 : -1));
    setBusyFollow(false);
  };

  const handleAddFriend = async () => {
    if (!user || isSelf) return;
    setBusyFriend(true);
    await sendFriendRequest(user.$id, profile.user_id);
    setFriendStatus("pending-outgoing");
    setBusyFriend(false);
  };

  const handleCancelFriend = async () => {
    if (!user || isSelf || friendStatus !== "pending-outgoing") return;
    setBusyFriend(true);
    if (friendRow) await respondFriendRequest(friendRow.$id, "rejected");
    setFriendStatus("none");
    setFriendRow(null);
    setBusyFriend(false);
  };

  const handleAcceptFriend = async () => {
    if (!user || isSelf || friendStatus !== "pending-incoming" || !friendRow) {
      return;
    }
    setBusyFriend(true);
    await respondFriendRequest(friendRow.$id, "accepted");
    setFriendStatus("friends");
    setFriendCount((c) => c + 1);
    setBusyFriend(false);
  };

  const handleUnfriend = async () => {
    if (!user || isSelf || friendStatus !== "friends") return;
    setBusyFriend(true);
    await removeFriend(user.$id, profile.user_id);
    setFriendStatus("none");
    setFriendRow(null);
    setFriendCount((c) => Math.max(c - 1, 0));
    setBusyFriend(false);
  };

  const openPost = async (post: any) => {
    const images = parseImages(post.images);
    setActivePost(post);
    if (!postStats[post.$id]) {
      const stat = await getPostStats(post.$id);
      setPostStats((s) => ({ ...s, [post.$id]: stat }));
    }
    if (images.length > 0) {
      setLightbox({ images, index: 0 });
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center overflow-auto bg-background">
      <div className="w-full pr-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <button
            onClick={onBack}
            className="rounded-full p-1.5 transition hover:bg-hover"
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-5 w-5 text-ink" />
          </button>
          <h2 className="text-base font-semibold text-ink">
            {profile?.username || profile?.name}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-5 px-5 py-6">
              <div className="h-[76px] w-[76px] shrink-0 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[3px]">
                <img
                  src={profile?.avatar}
                  alt={profile?.name}
                  className="h-full w-full rounded-full object-cover ring-[3px] ring-background"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="truncate text-lg font-semibold text-ink">
                    {(profile?.username || profile?.name).replace(/^@/, "")}
                  </p>
                  {isSelf ? (
                    <button
                      onClick={onEditProfile}
                      className="rounded-lg border border-hairline px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-hover"
                    >
                      Edit profile
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {friendStatus === "none" && (
                        <button
                          onClick={handleAddFriend}
                          disabled={busyFriend}
                          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover active:scale-95 disabled:opacity-50"
                        >
                          {busyFriend ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="h-3.5 w-3.5" />
                          )}
                          Add friend
                        </button>
                      )}

                      {friendStatus === "pending-outgoing" && (
                        <button
                          onClick={handleCancelFriend}
                          disabled={busyFriend}
                          title="Cancel request"
                          className="flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-hover active:scale-95 disabled:opacity-50"
                        >
                          {busyFriend ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          Requested
                        </button>
                      )}

                      {friendStatus === "pending-incoming" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleAcceptFriend}
                            disabled={busyFriend}
                            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover active:scale-95 disabled:opacity-50"
                          >
                            {busyFriend && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              if (friendRow)
                                respondFriendRequest(friendRow.$id, "rejected");
                              setFriendStatus("none");
                              setFriendRow(null);
                            }}
                            className="rounded-lg border border-hairline px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-hover active:scale-95"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {friendStatus === "friends" && (
                        <button
                          onClick={handleUnfriend}
                          disabled={busyFriend}
                          title="Unfriend"
                          className="group flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-hover active:scale-95 disabled:opacity-50"
                        >
                          {busyFriend ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span className="hidden group-hover:block">
                              <UserMinus className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <UserCheck className="h-3.5 w-3.5 group-hover:hidden" />
                          <span className="group-hover:hidden">Friends</span>
                          <span className="hidden group-hover:inline">
                            Unfriend
                          </span>
                        </button>
                      )}

                      <button
                        onClick={handleToggleFollow}
                        disabled={busyFollow}
                        className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition active:scale-95 ${
                          followingState
                            ? "border border-hairline text-ink hover:bg-hover"
                            : "bg-accent text-white hover:bg-accent-hover"
                        }`}
                      >
                        {busyFollow ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : followingState ? (
                          <>
                            <UserMinus className="h-3.5 w-3.5" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" /> Follow
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-5">
                  <Stat value={posts.length} label="posts" />
                  <Stat value={followers} label="followers" />
                  <Stat value={following} label="following" />
                  <Stat value={friendCount} label="friends" />
                </div>
              </div>
            </div>

            {/* Name + bio */}
            <div className="px-5 pb-5">
              <p className="text-sm font-semibold text-ink">{profile?.name}</p>
              {profile?.bio ? (
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-soft">
                  {profile.bio}
                </p>
              ) : (
                !isSelf && (
                  <p className="mt-0.5 text-sm text-ink-muted">No bio yet</p>
                )
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center border-t border-hairline">
              <div className="flex flex-1 items-center justify-center gap-1.5 border-b border-ink py-3 text-xs font-semibold text-ink">
                <Grid className="h-3.5 w-3.5" /> POSTS
              </div>
              <div className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold text-ink-muted">
                <Users className="h-3.5 w-3.5" /> FOLLOWING
              </div>
            </div>

            {/* Posts grid */}
            {posts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16">
                <Grid className="h-8 w-8 text-ink-muted" strokeWidth={1.5} />
                <p className="text-sm text-ink-soft">No posts yet</p>
                {isSelf && (
                  <p className="text-xs text-ink-muted">
                    Share something to the street!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px">
                {posts.map((post) => {
                  const stat = postStats[post.$id] ?? { likes: 0, comments: 0 };
                  return (
                    <button
                      key={post.$id}
                      onClick={() => openPost(post)}
                      className="group relative aspect-square overflow-hidden bg-hover"
                    >
                      {post.images ? (
                        <div className="relative h-full w-full">
                          <img
                            src={parseImages(post.images)[0]}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:scale-105"
                            loading="lazy"
                          />
                          {parseImages(post.images).length > 1 && (
                            <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              {parseImages(post.images).length}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-left">
                          <p className="line-clamp-3 text-[11px] text-ink-soft group-hover:underline">
                            {post.content}
                          </p>
                        </div>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <span className="flex items-center gap-1 text-sm font-semibold text-white">
                          <Heart className="h-4 w-4 fill-current" /> {stat.likes}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-white">
                          <MessageCircle className="h-4 w-4 fill-current" />
                          {stat.comments}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Post detail modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--overlay)" }}
          onClick={() => setActivePost(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <p className="text-sm font-semibold text-ink">
                {profile?.username || profile?.name}
              </p>
              <button
                onClick={() => setActivePost(null)}
                className="rounded-full p-1 transition hover:bg-hover"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-ink" />
              </button>
            </div>

            <div className="overflow-auto">
              {activePost.images && (
                <button
                  onClick={() =>
                    setLightbox({
                      images: parseImages(activePost.images),
                      index: 0
                    })
                  }
                  className="block w-full"
                  aria-label="Open image preview"
                >
                  <img
                    src={parseImages(activePost.images)[0]}
                    alt="post"
                    className="w-full object-cover"
                  />
                </button>
              )}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-ink" />
                  <MessageCircle className="h-5 w-5 text-ink" />
                  <span className="ml-auto text-sm text-ink-muted">
                    {dayjs(activePost.$createdAt).fromNow()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink">
                  <span className="font-semibold mr-1.5">
                    {profile?.username || profile?.name}
                  </span>
                  <span className="break-words">{activePost.content}</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {(postStats[activePost.$id]?.likes ?? 0).toLocaleString()}{" "}
                  likes ·{" "}
                  {(postStats[activePost.$id]?.comments ?? 0).toLocaleString()}{" "}
                  comments
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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