"use client";

import { useEffect } from "react";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const saveUser = async () => {
      try {
        const user = await account.get();

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE!;
        const collectionId =
          process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!;

        const existing = await databases.listDocuments(
          databaseId,
          collectionId,
          [Query.equal("userId", user.$id)]
        );

        if (existing.documents.length === 0) {
          await databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(),
            {
              userId: user.$id,
              name: user.name,
              email: user.email,
              avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                user.name
              )}`,
            }
          );
        }

        router.push("/home");
      } catch (err) {
        console.error(err);
      }
    };

    saveUser();
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center">
      Signing you in...
    </div>
  );
}