"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  slug: string | null;
  ride_type: string;
  description: string;
  meeting_point: string;
  ride_date: string;
  ride_time: string;
  cover_image: string;
  route_id: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  ride_id: string;
  route_name: string;
  start_point: string;
  end_point: string;
  waypoints: string;
  distance_km: string;
  estimated_duration: string;
  difficulty: string;
  map_embed_url: string;
  route_image: string;
  notes: string;
  vote_count: string;
  status: string;
}

interface ApiResponse {
  data: Announcement[];
}

const IMAGE_BASE_URL = "https://misfits.lovestoblog.com/uploads/";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatTime(timeStr: string) {
  if (!timeStr) {
    return "";
  }

  const [hours, minutes] = timeStr.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function difficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800";

    case "moderate":
      return "bg-yellow-100 text-yellow-800";

    case "hard":
    case "difficult":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    console.log(API_URL);
    let cancelled = false;
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/upcoming_api`, {
          method: "GET"
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json: ApiResponse = await res.json();

        console.log(json);

        if (!cancelled) {
          setAnnouncements(json.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load announcements"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnnouncements();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-gray-500">Loading announcements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-red-600">Error: {error}</span>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-gray-500">No upcoming rides right now.</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {announcements.map((item) => (
        <div
          key={item.id}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {item.cover_image && (
            <img
              src={`${IMAGE_BASE_URL}${item.cover_image}`}
              alt={item.title}
              className="h-48 w-full object-cover"
            />
          )}

          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {item.title}
              </h2>

              {item.difficulty && (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${difficultyColor(
                    item.difficulty
                  )}`}
                >
                  {item.difficulty}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600">{item.description}</p>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div>
                <span className="font-medium">Date:</span>{" "}
                {formatDate(item.ride_date)}
              </div>

              <div>
                <span className="font-medium">Time:</span>{" "}
                {formatTime(item.ride_time)}
              </div>

              <div className="col-span-2">
                <span className="font-medium">Meeting Point:</span>{" "}
                {item.meeting_point}
              </div>

              <div className="col-span-2">
                <span className="font-medium">Route:</span> {item.route_name}
              </div>

              <div>
                <span className="font-medium">Distance:</span>{" "}
                {item.distance_km} km
              </div>

              <div>
                <span className="font-medium">Duration:</span>{" "}
                {item.estimated_duration}
              </div>
            </div>

            {item.notes && (
              <details className="text-sm text-gray-600">
                <summary className="cursor-pointer font-medium text-gray-800">
                  Ride Notes
                </summary>

                <p className="mt-2 whitespace-pre-line">{item.notes}</p>
              </details>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
              <span>👍 {item.vote_count} votes</span>

              <span className="capitalize">{item.status}</span>
            </div>

            {item.map_embed_url && (
              <a
                href={item.map_embed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                View Route Map →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
