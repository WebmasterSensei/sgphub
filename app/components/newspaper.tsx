// components/NewsFeed.tsx
import { useState, useEffect } from "react";

// Get a free key at: https://console.cloud.google.com/ → Enable YouTube Data API v3
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_APIKEY;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

  useEffect(() => {
    async function fetchStreetGPVideos() {
      try {
        setLoading(true);
        setError(null);

        // Search for Street GP related videos
        const query = encodeURIComponent("Street GP");
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=12&order=relevance&key=${YOUTUBE_API_KEY}`
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || `YouTube API error: ${res.status}`
          );
        }

        const data = await res.json();
        setVideos(data.items || []);
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
      <div className="w-full animate-pulse">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 border-b border-neutral-200"
          >
            <div className="w-40 h-24 rounded-lg bg-neutral-200 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-3 w-1/3 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-4">
        {error}
        <p className="mt-2 text-xs opacity-70">
          Make sure you have a valid YouTube Data API key and that the API is
          enabled in Google Cloud Console.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {videos.map((video) => (
        <a
          key={video.id.videoId}
          href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex gap-4 rounded-sm border border-white/10 p-3 transition hover:bg-white/5"
        >
          <img
            src={
              video.snippet.thumbnails.high?.url ||
              video.snippet.thumbnails.medium.url
            }
            alt=""
            className="h-24 w-40 rounded-xl object-cover shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium leading-snug group-hover:underline text-black line-clamp-2">
              {video.snippet.title}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
              {video.snippet.description}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>{video.snippet.channelTitle}</span>
              <span>
                {new Date(video.snippet.publishedAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric" }
                )}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}