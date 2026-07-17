// import { createNextServerHelpers } from "@appwrite.io/react/server/next";

export const { POST } = createNextServerHelpers({
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  basePath: "/api/appwrite",
});