// components/NewsFeed.tsx
"use client";
import { useState, useEffect } from "react";
import { Play, Video, Loader2 } from "lucide-react";

interface Video {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export default function NewsFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStreetGPVideos() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/youtube?q=${encodeURIComponent("Street GP")}&maxResults=12`
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || `Failed to load videos: ${res.status}`
          );
        }

        const data = await res.json();
        setVideos(data.items || []);
        if (data.items?.[0]) setSelectedVideo(data.items[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchStreetGPVideos();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-hover">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
        <div className="mt-4 w-full animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 border-b border-hairline"
            >
              <div className="w-32 h-20 rounded-lg bg-hover shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 rounded bg-hover" />
                <div className="h-3 w-1/3 rounded bg-hover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Video className="h-8 w-8 text-ink-muted" strokeWidth={1.5} />
        <div className="text-sm text-ink-soft">
          {error}
          <p className="mt-2 text-xs opacity-70">
            Make sure you have a valid YouTube Data API key and that the API is
            enabled in Google Cloud Console.
          </p>
        </div>
      </div>
    );
  }

  const activeVideo = selectedVideo ?? videos[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Dedicated player section */}
      {activeVideo && (
        <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-hairline bg-surface p-1.5 shadow-sm">
          <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video">
            <iframe
              key={activeVideo.id.videoId}
              src={`https://www.youtube.com/embed/${activeVideo.id.videoId}?autoplay=1&rel=0`}
              title={activeVideo.snippet.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="px-2 pt-2 pb-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">
              {activeVideo.snippet.title}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {activeVideo.snippet.channelTitle}
            </p>
          </div>
        </div>
      )}

      {/* Video list */}
      <p className="px-1 pt-1 text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
        More Street GP topics
      </p>
      <div className="flex flex-col">
        {videos.map((video) => {
          const isActive = activeVideo?.id.videoId === video.id.videoId;
          return (
            <button
              key={video.id.videoId}
              onClick={() => setSelectedVideo(video)}
              className={`group flex w-full gap-4 border-b border-hairline p-3 text-left transition hover:bg-hover ${
                isActive ? "bg-surface-raised" : ""
              }`}
            >
              <div className="relative w-32 shrink-0 overflow-hidden rounded-lg">
                <img
                  src={
                    video.snippet.thumbnails.high?.url ||
                    video.snippet.thumbnails.medium.url
                  }
                  alt=""
                  className="h-20 w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                    <Play className="ml-0.5 h-3.5 w-3.5 text-black" fill="currentColor" />
                  </span>
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink group-hover:underline">
                  {video.snippet.title}
                </p>
                <p className="mt-1 truncate text-xs text-ink-muted">
                  {video.snippet.channelTitle}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {new Date(video.snippet.publishedAt).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" }
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}