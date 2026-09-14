// components/profileview.tsx — Instagram-style profile page
"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  UserPlus,
  Loader2,
  Grid,
  X,
  Users,
  UserMinus
} from "lucide-react";
import {
  fetchUserPosts,
  getPostStats,
  getFollowCounts,
  isFollowing,
  toggleFollow
} from "@/lib/api";
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
  const [activePost, setActivePost] = useState<any>(null);
  const [postStats, setPostStats] = useState<Record<string, any>>({});

  const isSelf = Boolean(
    user && profile && (profile.user_id === user.$id || profile.$id === authProfile?.$id)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile) return;
      const [userPosts, counts] = await Promise.all([
        fetchUserPosts(profile.user_id),
        getFollowCounts(profile.user_id)
      ]);
      if (cancelled) return;
      setFollowers(counts.followers);
      setFollowing(counts.following);
      const withAuthor = userPosts.map((p) => ({ ...p, user: profile }));
      setPosts(withAuthor);
      if (user && !isSelf) {
        const followingNow = await isFollowing(user.$id, profile.user_id);
        if (cancelled) return;
        setFollowingState(followingNow);
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

  const openPost = async (post: any) => {
    setActivePost(post);
    if (!postStats[post.$id]) {
      const stat = await getPostStats(post.$id);
      setPostStats((s) => ({ ...s, [post.$id]: stat }));
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
                  )}
                </div>

                <div className="mt-3 flex items-center gap-5">
                  <Stat value={posts.length} label="posts" />
                  <Stat value={followers} label="followers" />
                  <Stat value={following} label="following" />
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
                        <img
                          src={post.images}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          loading="lazy"
                        />
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
                <img
                  src={activePost.images}
                  alt="post"
                  className="w-full object-cover"
                />
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
    </div>
  );
}