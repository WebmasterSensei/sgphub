// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Settings from "./profile";
import Comments from "./comments";
import { Menu, X, Feather, ChevronLeft } from "lucide-react";
import Body from "./body";
import { useAuth } from "../providers";
import { tablesDB } from "@/lib/appwrite";
import { Query } from "appwrite";
import NewsFeed from "./newspaper";

type SettingsCompatProps = {
  onNavigate: () => void;
  authUser?: any;
};

function SettingsCompat({ onNavigate, authUser }: SettingsCompatProps) {
  return Settings({ onNavigate, authUser } as any);
}

export default function Main() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isColumn3Open, setIsColumn3Open] = useState(false);
  const [isComment, setIsComment] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);

  const [selectedComment, setSelectedComment] = useState<any>(null);

  const openComments = (comments: any) => {
    setSelectedComment(comments);
    setIsColumn3Open(true);
    setIsComment(true);
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const result = await tablesDB.listRows({
          databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
          queries: [Query.equal("user_id", user.$id)]
        });

        setProfile(result.rows[0] ?? null);
        // console.log(result.rows)
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, [user]);
  return (
    <div className="feather-app min-h-screen antialiased">
      {/* Fonts + design tokens, scoped to .feather-app so no inline-style TS friction */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .feather-app {
     
          font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
          background-color: var(--paper);
          color: var(--ink);
        }
        .feather-app .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .feather-app .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        /* the stitched ink-line seam — this app's signature element, applied as a border */
        .feather-app .ink-seam-r {
          background-image: radial-gradient(var(--hairline) 1.1px, transparent 1.1px);
          background-size: 6px 14px;
          background-repeat: repeat-y;
          background-position: right;
        }
        .feather-app .ink-seam-l {
          background-image: radial-gradient(var(--hairline) 1.1px, transparent 1.1px);
          background-size: 6px 14px;
          background-repeat: repeat-y;
          background-position: left;
        }
      `}</style>

      {/* Exactly 3 grid children on md+, matching the 3 template columns — never add a 4th */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.4fr] h-screen">
        {/* LEFT SIDEBAR (Desktop) */}
        <aside className="hidden lg:flex flex-col pr-4">
          <div className="px-6 pt-6 pb-4 flex items-center gap-2">
            <Feather className="h-5 w-5 text-black" />
            <span className="font-display text-xl text-black tracking-tight">
              Street GP
            </span>
          </div>
          <div className="flex-1 px-2">
            <Settings
              onNavigate={() => setIsSidebarOpen(false)}
              authUser={profile}
            />
          </div>
        </aside>

        {/* MOBILE LEFT SIDEBAR */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72
            transition-transform duration-500 ease-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:hidden
          `}
          style={{
            backgroundColor: "var(--paper)",
            borderRight: "1px solid var(--hairline)"
          }}
        >
          <div className="px-6 pt-6 pb-4 flex items-center gap-2 bg-white">
            <Feather className="h-5 w-5 text-black" />
            <span className="font-display text-xl text-black">Feather</span>
          </div>
          <Settings
    
            onNavigate={() => setIsSidebarOpen(false)}
            authUser={profile}
          />
        </aside>

        {/* MIDDLE COLUMN */}
        <div className="ink-seam-l md:ink-seam-r flex flex-col h-screen relative">
          {/* Mobile Top Header */}
          <header
            className="sticky top-0 z-40 flex items-center justify-between p-3 backdrop-blur-md lg:hidden"
            style={{
              backgroundColor: "rgba(242,239,230,0.85)",
              borderBottom: "1px solid var(--hairline)"
            }}
          >
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="rounded-full p-2  text-black"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 overflow-hidden text-black rounded-full"
              >
             
                <img
                  src={profile?.avatar}
                  alt="Alex Rivera"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold font-display text-black">
                  {user?.name}
                </p>
                <p
                  className="text-xs font-mono text-black"
                >
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsColumn3Open(true)}
              className="rounded-full p-2 transition-colors"
              aria-label="Open comments"
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Body
              onSelectComment={(comments) => openComments(comments)}
              profile={profile}
            />
          </main>
        </div>

        {/* COLUMN 3 - Desktop */}
        <div className="hidden md:flex flex-col p-5 h-screen overflow-auto">
          
          {isComment ? (
            <>
              <div className="flex items-center gap-2 mb-4 text-black">
                <div className="h-1.5 w-1.5 rounded-full" />
                <p className="font-display text-lg tracking-tight">Comments</p>
              </div>
              <Comments comments={selectedComment} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 text-black">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--clay)" }}
                />
                <p className="font-display text-lg tracking-tight">News </p>
              </div>
              <NewsFeed />
            </>
          )}
        </div>

        {/* MOBILE BOTTOM SHEET - Column 3 */}
        {isColumn3Open && (
          <>
            <div
              className="fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
              style={{ backgroundColor: "rgba(33,29,26,0.5)" }}
              onClick={() => setIsColumn3Open(false)}
            />

            <div
              className={`
                fixed bottom-0 left-0 right-0 z-[60] max-h-[88vh]
                rounded-t-3xl shadow-2xl
                transition-all duration-500 ease-out
                ${isColumn3Open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
                lg:hidden
              `}
              style={{
                backgroundColor: "var(--paper)",
                borderTop: "1px solid var(--hairline)"
              }}
            >
              <div className="flex justify-center pt-4 pb-2">
                <div
                  className="w-11 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--hairline)" }}
                />
              </div>

              <div className="px-5 pb-4 flex items-center justify-between">
                <button
                  onClick={() => setIsColumn3Open(false)}
                  className="p-1 transition-colors"
                  style={{ color: "var(--ink-soft)" }}
                  aria-label="Close comments"
                >
                  <X className="h-6 w-6" />
                </button>
                <p className="font-display font-semibold text-xl">Comments</p>
                <div className="w-6" />
              </div>

              <div className="overflow-auto h-[calc(88vh-80px)] bg-white rounded-t-xl px-5 pb-5">
                <div className="mt-5">
                  <Comments comments={selectedComment} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            style={{ backgroundColor: "rgba(33,29,26,0.4)" }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
