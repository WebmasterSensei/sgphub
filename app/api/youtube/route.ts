import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "Street GP";
  const maxResults = request.nextUrl.searchParams.get("maxResults") || "12";
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_APIKEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing YouTube API key" }, { status: 500 });
  }

  const query = encodeURIComponent(q);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=${maxResults}&order=relevance&key=${apiKey}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || `YouTube API error: ${res.status}` },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}