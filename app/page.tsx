// app/page.tsx
"use client";
import { useState } from "react";
import Settings from "./components/profile";
import Comments from "./components/comments";
import { Menu, X, Feather, ChevronLeft } from "lucide-react";
import Body from "./components/body";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isColumn3Open, setIsColumn3Open] = useState(false);

  return (
    <div className="min-h-screen font-sans bg-white text-neutral-900 antialiased">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.4fr] gap-4 h-screen">
        {/* LEFT SIDEBAR (Desktop) */}
        <div className="p-2 hidden lg:block">
          <aside className="h-full border-neutral-100 bg-white">
            <Settings onNavigate={() => setIsSidebarOpen(false)} />
          </aside>
        </div>

        {/* MOBILE LEFT SIDEBAR */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-100
            transition-all duration-500 ease-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:hidden
          `}
        >
          <Settings onNavigate={() => setIsSidebarOpen(false)} />
        </aside>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col border-x border-neutral-100 h-screen">
          {/* Mobile Top Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-100 bg-white/80 p-3 backdrop-blur-md lg:hidden">
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="rounded-full p-2 text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-neutral-200">
                <img
                  src="https://picsum.photos/id/64/300/300"
                  alt="Alex Rivera"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Alex Rivera</p>
                <p className="text-xs text-neutral-500">@arivera_dev</p>
              </div>
            </div>

            <button
              onClick={() => setIsColumn3Open(true)}
              className="rounded-full p-2 text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Body/>
          </main>
        </div>

        {/* COLUMN 3 - Desktop */}
        <div className="hidden md:block bg-white  border-neutral-100 p-4 h-screen overflow-auto">
          <p className="font-bold mb-2">
            Comments
          </p>
          <Comments />
        </div>

        {/* MOBILE BOTTOM SHEET - Column 3 */}
        {isColumn3Open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
              onClick={() => setIsColumn3Open(false)}
            />

            {/* Bottom Sheet */}
            <div
              className={`
                fixed bottom-0 left-0 right-0 z-[60] max-h-[88vh] bg-white 
                rounded-t-3xl shadow-2xl border-t border-neutral-200
                transition-all duration-500 ease-out
                ${isColumn3Open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
                lg:hidden
              `}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-11 h-1.5 bg-neutral-300 rounded-full"></div>
              </div>

              {/* Bottom Sheet Header */}
              <div className="px-5 pb-4  flex items-center justify-between">
                <button
                  onClick={() => setIsColumn3Open(false)}
                  className="text-neutral-500 hover:text-neutral-900 p-1 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                <p className="font-semibold text-xl">Comments</p>
                <div className="w-6" />
              </div>

              {/* Content Area */}
              <div className="overflow-auto h-[calc(78vh-80px)] p-5">
                <Comments />
              </div>
            </div>
          </>
        )}

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
