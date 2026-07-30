// components/NewsFeed.tsx
import { useState, useEffect } from "react";

const NEWS_API_KEY = "993d152c02c24fa0980d20b09e3d6620"; // get free key at https://newsapi.org/register

interface Article {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: { name: string };
  publishedAt: string;
}

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${NEWS_API_KEY}`
        );

        if (!res.ok) throw new Error(`News API error: ${res.status}`);

        const data = await res.json();
        if (data.status !== "ok")
          throw new Error(data.message || "Failed to load news");

        setArticles(data.articles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 border-b border-neutral-200"
          >
            {/* Thumbnail */}
            <div className="w-24 h-24 rounded-lg bg-neutral-200 shrink-0" />

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-4 w-5/6 rounded bg-neutral-200" />

              <div className="flex items-center gap-3 pt-2">
                <div className="h-3 w-16 rounded bg-neutral-200" />
                <div className="h-3 w-12 rounded bg-neutral-200" />
              </div>
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
          Free tier only works on localhost. Get a key at newsapi.org
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {articles.map((article, i) => (
        <a
          key={i}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-sm border border-white/10 p-3 transition hover:bg-white/5"
        >
          {article.urlToImage && (
            <img
              src={article.urlToImage}
              alt=""
              className="mb-3 h-32 w-full rounded-sm object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <p className="font-medium leading-snug group-hover:underline text-black">
            {article.title}
          </p>
          {article.description && (
            <p className="mt-1 line-clamp-2 text-sm text-black">
              {article.description}
            </p>
          )}
          <div className="mt-2 flex items-center  justify-between text-xs text-black">
            <span>{article.source.name}</span>
            <span>
              {new Date(article.publishedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
              })}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
