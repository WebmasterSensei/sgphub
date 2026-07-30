import { useState, useRef, useEffect } from "react";
import { Query, ID } from "appwrite";
import { tablesDB } from "@/lib/appwrite";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Plus,
  Image as ImageIcon
} from "lucide-react";

type BodyProps = {
  onSelectComment: (comments: any[]) => void;
};
export default function Body({ onSelectComment }: BodyProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(1284);
  const [showBurst, setShowBurst] = useState(false);
  const [posts, getPosts] = useState<any[]>([]);
  // const [comments, getCommentsData] = useState<any[]>([]);
  const lastTap = useRef(0);

  const toggleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) toggleLike();
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 700);
    }
    lastTap.current = now;
  };

  const getComments = async (postId: string) => {
    try {
      const result = await tablesDB.listRows({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!,
        queries: [Query.equal("post_id", postId), Query.orderDesc("$createdAt")]
      });

      const commentsWithUsers = await Promise.all(
        result.rows.map(async (comment) => {
          const profile = await tablesDB.listRows({
            databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
            queries: [Query.equal("user_id", comment.user_id)]
          });

          return {
            ...comment,
            user: profile.rows[0] ?? null
          };
        })
      );

      onSelectComment(commentsWithUsers);
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchRows = async () => {
    try {
      const postsResult = await tablesDB.listRows({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!
      });

      const postsWithData = await Promise.all(
        postsResult.rows.map(async (post) => {
          // Get the post author's profile
          const postProfile = await tablesDB.listRows({
            databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
            queries: [Query.equal("user_id", post?.user_id)]
          });

          // Get comments
          const commentsResult = await tablesDB.listRows({
            databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            tableId: process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!,
            queries: [
              Query.equal("post_id", post?.$id),
              Query.orderDesc("$createdAt")
            ]
          });

          // Attach profile to each comment
          const commentsWithProfiles = await Promise.all(
            commentsResult.rows.map(async (comment) => {
              const commentProfile = await tablesDB.listRows({
                databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
                queries: [Query.equal("user_id", comment?.user_id)]
              });

              return {
                ...comment,
                user: commentProfile.rows[0] ?? null
              };
            })
          );

          return {
            ...post,
            user: postProfile.rows[0] ?? null,
            comments: commentsWithProfiles,
            commentsCount: commentsResult.total
          };
        })
      );

      getPosts(postsWithData);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchRows();
  }, []);

  return (
    <main className="flex-1 overflow-auto bg-neutral-100 flex flex-col items-center py-1">
      {/* Sticky "add a post" bar — stays pinned while the feed below it scrolls */}
      <div className="sticky top-0 z-30 w-full flex items-center gap-3 px-3.5 py-2.5 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden ring-1 ring-neutral-200">
          <img
            src="https://i.pravatar.cc/64?img=12"
            alt="your profile"
            className="w-full h-full object-cover"
          />
        </div>

        <button
          className="flex-1 text-left text-sm text-neutral-500 bg-neutral-100 hover:bg-neutral-200/70 transition-colors rounded-full px-4 py-2"
          aria-label="Create a new post"
        >
          What's on your mind?
        </button>

        <button
          aria-label="Add photo"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <ImageIcon className="w-5 h-5" strokeWidth={1.8} />
        </button>

        <button
          aria-label="New post"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-neutral-900 text-white active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {posts.map((data) => {
        return (
          <article
            key={data.$id}
            className="w-full bg-white border border-neutral-100 rounded-md mt-1"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600">
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <img
                      src={data.user.avatar}
                      alt="profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-neutral-900">
                    {data.user.name}
                  </p>
                  <p className="text-xs text-neutral-500">{data.user.email}</p>
                </div>
              </div>
              <MoreHorizontal className="w-5 h-5 text-neutral-700 cursor-pointer" />
            </div>

            {/* Image */}
            <div
              className="relative w-full aspect-square bg-neutral-200 select-none cursor-pointer overflow-hidden"
              onClick={handleImageTap}
            >
              <img
                src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80"
                alt="post"
                className="w-full h-full object-cover"
                draggable={false}
              />
              {showBurst && (
                <Heart
                  className="absolute inset-0 m-auto w-24 h-24 text-white drop-shadow-lg animate-ping-once"
                  fill="white"
                  strokeWidth={0}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-3 pt-2.5">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleLike}
                  aria-label="Like"
                  className="active:scale-90 transition-transform"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      liked ? "text-rose-500" : "text-neutral-900"
                    }`}
                    fill={liked ? "currentColor" : "none"}
                    strokeWidth={1.8}
                  />
                </button>
                <button
                  onClick={() => getComments(data.$id)}
                  aria-label="Comment"
                  className="active:scale-90 transition-transform"
                >
                  <MessageCircle
                    className="w-6 h-6 text-neutral-900"
                    strokeWidth={1.8}
                  />
                </button>
                <button
                  aria-label="Share"
                  className="active:scale-90 transition-transform"
                >
                  <Send
                    className="w-6 h-6 text-neutral-900"
                    strokeWidth={1.8}
                  />
                </button>
                {/* {JSON.stringify(data.$id)} */}
              </div>
              {/* <button
                  onClick={() => setSaved((s) => !s)}
                  aria-label="Save"
                  className="active:scale-90 transition-transform"
                >
                  <Bookmark
                    className="w-6 h-6 text-neutral-900"
                    fill={saved ? "currentColor" : "none"}
                    strokeWidth={1.8}
                  />
                </button> */}
              <div className="px-3 pt-2 flex justify-end">
                <button className="flex items-center text-sm font-semibold text-neutral-900">
                  <Heart
                    className={`w-4 h-4 mr-1 transition-colors ${
                      liked ? "text-rose-500" : "text-neutral-900"
                    }`}
                    fill={liked ? "currentColor" : "currentColor"}
                    strokeWidth={1.8}
                  />
                  {likeCount.toLocaleString()} likes
                </button>
              </div>
            </div>

            {/* Likes */}

            {/* Caption */}
            <div className="px-3 pt-1 mt-2 mb-2 text-sm text-neutral-900">
              "<span className="font- mr-1.5">{data.content}</span>"
              {/* <span className="text-neutral-500">
                  {" "}
                  #santorini #greece #travel
                </span> */}
            </div>

            {/* Comments */}
            <button className="px-3 pt-1.5 text-sm text-neutral-500 block">
              {JSON.stringify(data.comments.length)}{" "}
              {data.comments.length > 1 ? <>comments</> : <>comment</>}
            </button>

            {/* Timestamp */}
            <p className="px-3 pt-1.5 pb-2 text-[11px] uppercase tracking-wide text-neutral-400">
              {data.$createdAt}
            </p>

            {/* Add comment */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-neutral-200">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 text-sm outline-none placeholder:text-neutral-400"
              />
              <button className="text-sm font-semibold text-sky-500">
                Post
              </button>
            </div>
          </article>
        );
      })}

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
