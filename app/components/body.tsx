import { useState, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal
} from "lucide-react";

export default function Body() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(1284);
  const [showBurst, setShowBurst] = useState(false);
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

  return (
    <main className="flex-1 overflow-auto bg-neutral-100 flex items-start justify-center py-1">
      <article className="w-full  bg-white border border-neutral-200 rounded-md shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <img
                  src="https://i.pravatar.cc/64?img=32"
                  alt="profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-neutral-900">
                wanderlust.mara
              </p>
              <p className="text-xs text-neutral-500">Santorini, Greece</p>
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
              <Send className="w-6 h-6 text-neutral-900" strokeWidth={1.8} />
            </button>
          </div>
          <button
            onClick={() => setSaved((s) => !s)}
            aria-label="Save"
            className="active:scale-90 transition-transform"
          >
            <Bookmark
              className="w-6 h-6 text-neutral-900"
              fill={saved ? "currentColor" : "none"}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* Likes */}
        <div className="px-3 pt-2">
          <p className="text-sm font-semibold text-neutral-900">
            {likeCount.toLocaleString()} likes
          </p>
        </div>

        {/* Caption */}
        <div className="px-3 pt-1 text-sm text-neutral-900">
          <span className="font-semibold mr-1.5">wanderlust.mara</span>
          Blue domes, white walls, endless sea. Could stay here forever 🌊
          <span className="text-neutral-500"> #santorini #greece #travel</span>
        </div>

        {/* Comments */}
        <button className="px-3 pt-1.5 text-sm text-neutral-500 block">
          View all 42 comments
        </button>
        <div className="px-3 pt-1 text-sm text-neutral-900">
          <span className="font-semibold mr-1.5">theo.k</span>
          This is unreal 😍
        </div>

        {/* Timestamp */}
        <p className="px-3 pt-1.5 pb-2 text-[11px] uppercase tracking-wide text-neutral-400">
          2 hours ago
        </p>

        {/* Add comment */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-neutral-200">
          <input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 text-sm outline-none placeholder:text-neutral-400"
          />
          <button className="text-sm font-semibold text-sky-500">Post</button>
        </div>
      </article>

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
