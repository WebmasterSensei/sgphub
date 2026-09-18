// components/friends.tsx — search people, friend requests, friends & sent panel
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  UserPlus,
  UserCheck,
  UserMinus,
  Clock,
  UserX,
  Check,
  Loader2,
  ArrowLeft,
  Users
} from "lucide-react";
import { useAuth } from "../providers";
import {
  cancelFriendRequest,
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  getFriendStatus,
  removeFriend,
  respondFriendRequest,
  searchProfiles,
  sendFriendRequest,
  FriendStatus
} from "@/lib/api";

type Tab = "search" | "requests" | "friends" | "sent";

type FriendsPanelProps = {
  onBack?: () => void;
  onViewProfile?: (profile: any) => void;
};

type UserRowProps = {
  profile: any;
  action: React.ReactNode;
  onClick?: (profile: any) => void;
};

function Avatar({ profile, size = "h-11 w-11" }: { profile: any; size?: string }) {
  return (
    <div
      className={`${size} shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]`}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-surface p-[2px]">
        <img
          src={profile?.avatar}
          alt={profile?.name ?? "user"}
          className="h-full w-full rounded-full object-cover"
        />
      </div>
    </div>
  );
}

function UserRow({ profile, action, onClick }: UserRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-hover">
      <button
        onClick={() => onClick?.(profile)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar profile={profile} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {profile?.name || "—"}
          </p>
          <p className="truncate text-xs text-ink-muted">
            @{profile?.username || "user"}
          </p>
        </div>
      </button>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export default function FriendsPanel({
  onBack,
  onViewProfile
}: FriendsPanelProps) {
  const { user } = useAuth();
  const meId = user?.$id;

  const [tab, setTab] = useState<Tab>("search");

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, FriendStatus>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lists
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const requestsByUser = useRef<Record<string, any>>({}).current;

  const indexRequests = (rows: any[]) => {
    rows.forEach((row) => {
      requestsByUser[row.sender_id] = row;
    });
  };

  const loadLists = useCallback(async () => {
    if (!meId) return;
    setLoading(true);
    const [reqs, frs, sentReqs] = await Promise.all([
      fetchIncomingRequests(meId),
      fetchFriends(meId),
      fetchOutgoingRequests(meId)
    ]);
    setRequests(reqs);
    indexRequests(reqs);
    setFriends(frs);
    setSent(sentReqs);
    setLoading(false);
  }, [meId]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const runSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setHasSearched(false);
        setStatusMap({});
        return;
      }
      setSearching(true);
      setHasSearched(true);
      const found = await searchProfiles(term);
      setResults(found.filter((p: any) => p.user_id !== meId));
      if (meId) {
        const statuses: Record<string, FriendStatus> = {};
        await Promise.all(
          found
            .filter((p: any) => p.user_id !== meId)
            .map(async (p: any) => {
              const res = await getFriendStatus(meId, p.user_id);
              statuses[p.user_id] = res.status;
            })
        );
        setStatusMap(statuses);
      }
      setSearching(false);
    },
    [meId]
  );

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  };

  const runWithBusy = async (key: string, fn: () => Promise<unknown>) => {
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      await fn();
      await loadLists();
      if (query.trim()) await runSearch(query);
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  };

  const addFriend = (profile: any) =>
    runWithBusy(`add-${profile.user_id}`, () =>
      sendFriendRequest(meId!, profile.user_id)
    );

  const cancelSend = (row: any) =>
    runWithBusy(`cancel-${row.$id}`, () =>
      cancelFriendRequest(meId!, row.user_id)
    );

  const accept = (row: any) =>
    runWithBusy(`accept-${row.$id}`, () =>
      respondFriendRequest(row.$id, "accepted")
    );

  const reject = (row: any) =>
    runWithBusy(`reject-${row.$id}`, () =>
      respondFriendRequest(row.$id, "rejected")
    );

  const unfriend = (row: any) =>
    runWithBusy(`unfriend-${row.$id}`, () =>
      removeFriend(meId!, row.user_id)
    );

  const FriendButton = ({ profile }: { profile: any }) => {
    const status = statusMap[profile.user_id];
    const isBusy = busy[`add-${profile.user_id}`];
    if (status === "friends") {
      return (
        <span className="flex items-center gap-1 rounded-lg bg-hover px-2.5 py-1.5 text-xs font-semibold text-ink-soft">
          <UserCheck className="h-3.5 w-3.5" /> Friends
        </span>
      );
    }
    if (status === "pending-incoming") {
      const row = requestsByUser[profile.user_id];
      return (
        <button
          onClick={() =>
            runWithBusy(`accept-${profile.user_id}`, () =>
              row
                ? respondFriendRequest(row.$id, "accepted")
                : sendFriendRequest(meId!, profile.user_id)
            )
          }
          disabled={busy[`accept-${profile.user_id}`]}
          className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {busy[`accept-${profile.user_id}`] ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          Accept
        </button>
      );
    }
    if (status === "pending-outgoing") {
      return (
        <span className="flex items-center gap-1 rounded-lg bg-hover px-2.5 py-1.5 text-xs font-semibold text-ink-soft">
          <Clock className="h-3.5 w-3.5" /> Requested
        </span>
      );
    }
    return (
      <button
        onClick={() => addFriend(profile)}
        disabled={isBusy}
        className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        Add friend
      </button>
    );
  };

  const Tabs = () => (
    <div className="flex items-center gap-1 rounded-xl bg-hover p-1">
      {(
        [
          { key: "search", label: "Search" },
          { key: "requests", label: `Requests${requests.length ? ` (${requests.length})` : ""}` },
          { key: "friends", label: `Friends${friends.length ? ` (${friends.length})` : ""}` },
          { key: "sent", label: "Sent" }
        ] as { key: Tab; label: string }[]
      ).map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            tab === key ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const Empty = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Users className="h-8 w-8 text-ink-muted" strokeWidth={1.5} />
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );

  return (
    <div className="w-full max-w-full">
      <div className="mb-5 flex items-center gap-3 border-b border-hairline pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hover">
          <Users className="h-5 w-5 text-ink" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">Friends</h2>
          <p className="text-sm text-ink-muted">
            Find riders, send requests, and stay connected
          </p>
        </div>
      </div>

      <Tabs />

      <div className="mt-4">
        {tab === "search" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search by name or username…"
                className="w-full rounded-xl border border-hairline bg-surface-raised py-3 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20 placeholder:text-ink-muted"
              />
              {searching && (
                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />
              )}
            </div>

            {!hasSearched ? (
              <Empty text="Type to find Street GP members" />
            ) : searching ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 rounded-xl px-2 py-2"
                  >
                    <div className="h-11 w-11 rounded-full bg-hover" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-28 rounded bg-hover" />
                      <div className="h-2 w-20 rounded bg-hover" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <Empty text={`No members match "${query}"`} />
            ) : (
              <div className="space-y-1">
                {results.map((profile) => (
                  <UserRow
                    key={profile.$id}
                    profile={profile}
                    onClick={() => onViewProfile?.(profile)}
                    action={<FriendButton profile={profile} />}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "requests" &&
          (loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
            </div>
          ) : requests.length === 0 ? (
            <Empty text="No pending friend requests" />
          ) : (
            <div className="space-y-1">
              {requests.map((row) => (
                <UserRow
                  key={row.$id}
                  profile={row.user}
                  onClick={() => onViewProfile?.(row.user)}
                  action={
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => accept(row)}
                        disabled={busy[`accept-${row.$id}`]}
                        className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
                      >
                        {busy[`accept-${row.$id}`] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => reject(row)}
                        disabled={busy[`reject-${row.$id}`]}
                        className="flex items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-hover disabled:opacity-50"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          ))}

        {tab === "friends" &&
          (loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
            </div>
          ) : friends.length === 0 ? (
            <Empty text="You have no friends yet" />
          ) : (
            <div className="space-y-1">
              {friends.map((row) => (
                <UserRow
                  key={row.$id}
                  profile={row.user}
                  onClick={() => onViewProfile?.(row.user)}
                  action={
                    <button
                      onClick={() => unfriend(row)}
                      disabled={busy[`unfriend-${row.$id}`]}
                      className="flex items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-hover disabled:opacity-50"
                    >
                      {busy[`unfriend-${row.$id}`] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      Unfriend
                    </button>
                  }
                />
              ))}
            </div>
          ))}

        {tab === "sent" &&
          (loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
            </div>
          ) : sent.length === 0 ? (
            <Empty text="No outgoing requests" />
          ) : (
            <div className="space-y-1">
              {sent.map((row) => (
                <UserRow
                  key={row.$id}
                  profile={row.user}
                  onClick={() => onViewProfile?.(row.user)}
                  action={
                    <button
                      onClick={() => cancelSend(row)}
                      disabled={busy[`cancel-${row.$id}`]}
                      className="flex items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-hover disabled:opacity-50"
                    >
                      {busy[`cancel-${row.$id}`] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserX className="h-3.5 w-3.5" />
                      )}
                      Cancel
                    </button>
                  }
                />
              ))}
            </div>
          ))}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-5 flex items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </button>
      )}
    </div>
  );
}