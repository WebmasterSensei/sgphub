import { ID, Permission, Role } from "appwrite";
import { storage } from "./appwrite";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_POST_IMAGES = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// The `images` column stores one or more URLs joined with a comma.
export function joinImages(urls: string[]) {
  return urls.filter(Boolean).join(",");
}

export function parseImages(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

export function validateImage(file: File) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be 5 MB or smaller.");
  }
}

export function fileUrl(bucketId: string, fileId: string) {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

export async function uploadImage(file: File, bucketId: string) {
  validateImage(file);
  const uploaded = await storage.createFile({
    bucketId,
    fileId: ID.unique(),
    file,
    permissions: [Permission.read(Role.any())]
  });
  return fileUrl(bucketId, uploaded.$id);
}

export async function uploadImages(
  files: File[],
  bucketId: string
): Promise<string[]> {
  return Promise.all(files.map((file) => uploadImage(file, bucketId)));
}