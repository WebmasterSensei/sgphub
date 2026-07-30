"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import { Client, Account, ID, OAuthProvider, Models, Query } from "appwrite";
import { tablesDB } from "@/lib/appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const account = new Account(client);

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const me = await account.get();
      setUser(me);

      // Check if profile exists
      const result = await tablesDB.listRows({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
        queries: [Query.equal("user_id", me.$id)]
      });

      if (result.rows.length === 0) {
        await tablesDB.createRow({
          databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
          rowId: ID.unique(),
          data: {
            user_id: me.$id,
            name: me.name,
            email: me.email,
            avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(me.name)}` // default or generated avatar URL
          }
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const googleLogin = () => {
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${window.location.origin}/components/`,
      `${window.location.origin}/components/error`
    );
  };

  // NOTE: these throw on failure now — the UI catches and displays the real message.
  const login = async (email: string, password: string) => {
    await account.createEmailPasswordSession(email.trim(), password);
    await loadUser();
  };

  const signup = async (email: string, password: string, name: string) => {
    await account.create(ID.unique(), email.trim(), password, name.trim());
    await login(email, password);
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside Providers");
  return context;
};
