import { Query, ID } from "appwrite";
import { tablesDB } from "./appwrite";

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROFILE_TABLE = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!;
const POSTS_TABLE = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!;
const COMMENTS_TABLE = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!;
const FOLLOWS_TABLE = process.env.NEXT_PUBLIC_APPWRITE_FOLLOWS_TABLE_ID!;
const LIKES_TABLE = process.env.NEXT_PUBLIC_APPWRITE_LIKES_TABLE_ID!;
const FRIEND_REQUESTS_TABLE =
  process.env.NEXT_PUBLIC_APPWRITE_FRIEND_REQUESTS_TABLE_ID!;
import { account } from "@/lib/appwrite";


export async function fetchProfile(userId: string) {
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: PROFILE_TABLE,
      queries: [Query.equal("user_id", userId), Query.limit(1)]
    });
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("fetchProfile:", error);
    return null;
  }
}

export async function fetchProfilesByUserIds(userIds: string[]) {
  const profiles: Record<string, any> = {};
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: PROFILE_TABLE,
      queries: [Query.equal("user_id", userIds)]
    });
    result.rows.forEach((row: any) => {
      profiles[row.user_id] = row;
    });
  } catch (error) {
    console.error("fetchProfilesByUserIds:", error);
  }
  return profiles;
}

export async function fetchUserPosts(userId: string) {
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: POSTS_TABLE,
      queries: [
        Query.equal("user_id", userId),
        Query.orderDesc("$createdAt")
      ]
    });
    return result.rows as any[];
  } catch (error) {
    console.error("fetchUserPosts:", error);
    return [];
  }
}

export async function getPostStats(postId: string) {
  const commentsPromise = tablesDB.listRows({
    databaseId: DB,
    tableId: COMMENTS_TABLE,
    queries: [Query.equal("post_id", postId), Query.limit(1)]
  });

  let likesPromise: Promise<any> = Promise.resolve({ rows: [], total: 0 });

  if (LIKES_TABLE) {
    likesPromise = tablesDB
      .listRows({
        databaseId: DB,
        tableId: LIKES_TABLE,
        queries: [Query.equal("post_id", postId), Query.limit(1)]
      })
      .catch(() => ({ rows: [], total: 0 }));
  }

  const [comments, likes] = await Promise.all([commentsPromise, likesPromise]);
  return { comments: comments.total, likes: likes.total };
}

export async function hasLiked(postId: string, userId: string) {
  if (!LIKES_TABLE) return false;
  try {

    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: LIKES_TABLE,
      queries: [
        Query.equal("post_id", postId),
        Query.equal("user_id", userId),
        Query.limit(1)
      ]
    });
    return result.rows.length > 0;
  } catch (error) {
    console.error("hasLiked:", error);
    return false;
  }
}

export async function togglePostLike(postId: string, userId: string) {
  if (!LIKES_TABLE) return false;
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: LIKES_TABLE,
      queries: [
        Query.equal("post_id", postId),
        Query.equal("user_id", userId),
        Query.limit(1)
      ]
    });
    if (result.rows.length > 0) {
      await tablesDB.deleteRow({
        databaseId: DB,
        tableId: LIKES_TABLE,
        rowId: result.rows[0].$id
      });
      return false;
    }
    await tablesDB.createRow({
      databaseId: DB,
      tableId: LIKES_TABLE,
      rowId: ID.unique(),
      data: { post_id: postId, user_id: userId }
    });
    return true;
  } catch (error) {
    console.error("togglePostLike:", error);
    return false;
  }
}

export async function isFollowing(followerId: string, followingId: string) {
  if (!FOLLOWS_TABLE) return false;
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: FOLLOWS_TABLE,
      queries: [
        Query.equal("follower_id", followerId),
        Query.equal("following_id", followingId),
        Query.limit(1)
      ]
    });
    return result.rows.length > 0;
  } catch (error) {
    console.error("isFollowing:", error);
    return false;
  }
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (!FOLLOWS_TABLE) return false;
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: FOLLOWS_TABLE,
      queries: [
        Query.equal("follower_id", followerId),
        Query.equal("following_id", followingId),
        Query.limit(1)
      ]
    });
    if (result.rows.length > 0) {
      await tablesDB.deleteRow({
        databaseId: DB,
        tableId: FOLLOWS_TABLE,
        rowId: result.rows[0].$id
      });
      return false;
    }
    await tablesDB.createRow({
      databaseId: DB,
      tableId: FOLLOWS_TABLE,
      rowId: ID.unique(),
      data: { follower_id: followerId, following_id: followingId }
    });
    return true;
  } catch (error) {
    console.error("toggleFollow:", error);
    return false;
  }
}

export async function getFollowCounts(userId: string) {
  let followers = 0;
  let following = 0;

  if (FOLLOWS_TABLE) {
    try {
      const [followersResult, followingResult] = await Promise.all([
        tablesDB.listRows({
          databaseId: DB,
          tableId: FOLLOWS_TABLE,
          queries: [Query.equal("following_id", userId), Query.limit(1)]
        }),
        tablesDB.listRows({
          databaseId: DB,
          tableId: FOLLOWS_TABLE,
          queries: [Query.equal("follower_id", userId), Query.limit(1)]
        })
      ]);
      followers = followersResult.total;
      following = followingResult.total;
    } catch (error) {
      console.error("getFollowCounts:", error);
    }
  }

  return { followers, following };
}

export type FriendStatus =
  | "none"
  | "pending-outgoing"
  | "pending-incoming"
  | "friends";

async function findFriendRow(a: string, b: string) {
  if (!FRIEND_REQUESTS_TABLE) return null;
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: FRIEND_REQUESTS_TABLE,
      queries: [Query.equal("sender_id", [a, b]), Query.equal("receiver_id", [b, a])]
    });
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("findFriendRow:", error);
    return null;
  }
}

function friendRowFor(a: string, b: string, row: any) {
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  const outgoing = row.sender_id === a;
  return outgoing ? "pending-outgoing" : "pending-incoming";
}

export async function getFriendStatus(a: string, b: string) {
  const row = await findFriendRow(a, b);
  return { status: friendRowFor(a, b, row) as FriendStatus, row };
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (!FRIEND_REQUESTS_TABLE) throw new Error("Friend requests aren't configured.");
  const existing = await findFriendRow(senderId, receiverId);
  if (existing) return friendRowFor(senderId, receiverId, existing);
  await tablesDB.createRow({
    databaseId: DB,
    tableId: FRIEND_REQUESTS_TABLE,
    rowId: ID.unique(),
    data: {
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending"
    }
  });
  return "pending-outgoing";
}

export async function cancelFriendRequest(a: string, b: string) {
  const row = await findFriendRow(a, b);
  if (!row) return;
  if (row.status !== "pending") return;
  await tablesDB.deleteRow({
    databaseId: DB,
    tableId: FRIEND_REQUESTS_TABLE,
    rowId: row.$id
  });
}

export async function respondFriendRequest(
  rowId: string,
  status: "accepted" | "rejected"
) {
  if (!FRIEND_REQUESTS_TABLE) return;
  await tablesDB.updateRow({
    databaseId: DB,
    tableId: FRIEND_REQUESTS_TABLE,
    rowId,
    data: { status }
  });
}

export async function removeFriend(a: string, b: string) {
  const row = await findFriendRow(a, b);
  if (!row || row.status !== "accepted") return;
  await tablesDB.deleteRow({
    databaseId: DB,
    tableId: FRIEND_REQUESTS_TABLE,
    rowId: row.$id
  });
}

export async function fetchIncomingRequests(userId: string) {
  if (!FRIEND_REQUESTS_TABLE) return [];
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: FRIEND_REQUESTS_TABLE,
      queries: [
        Query.equal("receiver_id", userId),
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt")
      ]
    });
    const rows = result.rows as any[];
    const profiles = await fetchProfilesByUserIds(rows.map((r) => r.sender_id));
    return rows.map((r) => ({ ...r, user: profiles[r.sender_id] ?? null }));
  } catch (error) {
    console.error("fetchIncomingRequests:", error);
    return [];
  }
}

export async function fetchOutgoingRequests(userId: string) {
  if (!FRIEND_REQUESTS_TABLE) return [];
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: FRIEND_REQUESTS_TABLE,
      queries: [
        Query.equal("sender_id", userId),
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt")
      ]
    });
    const rows = result.rows as any[];
    const profiles = await fetchProfilesByUserIds(rows.map((r) => r.receiver_id));
    return rows.map((r) => ({ ...r, user: profiles[r.receiver_id] ?? null }));
  } catch (error) {
    console.error("fetchOutgoingRequests:", error);
    return [];
  }
}

export async function fetchFriends(userId: string) {
  if (!FRIEND_REQUESTS_TABLE) return [];
  try {
    const [asSender, asReceiver] = await Promise.all([
      tablesDB.listRows({
        databaseId: DB,
        tableId: FRIEND_REQUESTS_TABLE,
        queries: [
          Query.equal("sender_id", userId),
          Query.equal("status", "accepted")
        ]
      }),
      tablesDB.listRows({
        databaseId: DB,
        tableId: FRIEND_REQUESTS_TABLE,
        queries: [
          Query.equal("receiver_id", userId),
          Query.equal("status", "accepted")
        ]
      })
    ]);
    const rows = [...(asSender.rows ?? []), ...(asReceiver.rows ?? [])];
    const peerIds = rows.map((r: any) =>
      r.sender_id === userId ? r.receiver_id : r.sender_id
    );
    const profiles = await fetchProfilesByUserIds(peerIds);
    return rows.map((r: any) => ({
      ...r,
      user: profiles[r.sender_id === userId ? r.receiver_id : r.sender_id] ?? null
    }));
  } catch (error) {
    console.error("fetchFriends:", error);
    return [];
  }
}

export async function getFriendCount(userId: string) {
  if (!FRIEND_REQUESTS_TABLE) return 0;
  try {
    const [asSender, asReceiver] = await Promise.all([
      tablesDB.listRows({
        databaseId: DB,
        tableId: FRIEND_REQUESTS_TABLE,
        queries: [
          Query.equal("sender_id", userId),
          Query.equal("status", "accepted")
        ]
      }),
      tablesDB.listRows({
        databaseId: DB,
        tableId: FRIEND_REQUESTS_TABLE,
        queries: [
          Query.equal("receiver_id", userId),
          Query.equal("status", "accepted")
        ]
      })
    ]);
    return (asSender.total ?? 0) + (asReceiver.total ?? 0);
  } catch (error) {
    console.error("getFriendCount:", error);
    return 0;
  }
}

export async function searchProfiles(term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  try {
    const [byUsername, byName] = await Promise.all([
      tablesDB
        .listRows({
          databaseId: DB,
          tableId: PROFILE_TABLE,
          queries: [Query.search("username", q), Query.limit(25)]
        })
        .catch(() => ({ rows: [] })),
      tablesDB
        .listRows({
          databaseId: DB,
          tableId: PROFILE_TABLE,
          queries: [Query.search("name", q), Query.limit(25)]
        })
        .catch(() => ({ rows: [] }))
    ]);
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const row of [...(byUsername.rows ?? []), ...(byName.rows ?? [])]) {
      if (seen.has(row.$id)) continue;
      seen.add(row.$id);
      merged.push(row);
    }
    if (merged.length > 0) return merged;
  } catch (error) {
    console.error("searchProfiles(fulltext):", error);
  }
  try {
    const result = await tablesDB.listRows({
      databaseId: DB,
      tableId: PROFILE_TABLE,
      queries: [Query.limit(100)]
    });
    return (result.rows as any[]).filter(
      (p) =>
        (p.username ?? "").toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.bio ?? "").toLowerCase().includes(q)
    );
  } catch (error) {
    console.error("searchProfiles(fallback):", error);
    return [];
  }
}

export { DB };