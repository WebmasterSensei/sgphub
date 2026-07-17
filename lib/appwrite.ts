// import { Client, TablesDB } from "appwrite";
import { Client, Account, TablesDB, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const tablesDB = new TablesDB(client);

export const account = new Account(client);

export const databases = new Databases(client);

export default client;