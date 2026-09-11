import { Query, ID } from "appwrite";
import { tablesDB } from "./appwrite";

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROFILE_TABLE = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!;
const POSTS_TABLE = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!;
const COMMENTS_TABLE = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_TABLE_ID!;
const FOLLOWS_TABLE = process.env.NEXT_PUBLIC_APPWRITE_FOLLOWS_TABLE_ID;
const LIKES_TABLE = process.env.NEXT_PUBLIC_APPWRITE_LIKES_TABLE_ID;

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

export { DB };