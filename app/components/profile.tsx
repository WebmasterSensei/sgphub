// components/settings.tsx — settings navigation sidebar
"use client";
import { Account, Client } from "appwrite";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  LogOut,
  ChevronRight
} from "lucide-react";

export type SettingsItem =
  | "profile"
  | "notifications"
  | "privacy"
  | "appearance"
  | "language";

type SettingsProps = {
  onNavigate: (item: SettingsItem) => void;
  authUser: any;
  onViewProfile?: () => void;
  activeItem?: SettingsItem | null;
};

export default function Settings({
  onNavigate,
  authUser,
  onViewProfile,
  activeItem = null
}: SettingsProps) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const account = new Account(client);
  const logout = async () => {
    try {
      await account.deleteSession("current");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-full flex-col lg:sticky lg:top-0 bg-surface">
      {/* Profile quick view */}
      <button
        onClick={onViewProfile}
        className="border-b border-hairline p-6 text-left transition hover:bg-hover"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
              <div className="h-full w-full rounded-full bg-surface p-[2px]">
                <img
                  src={authUser?.avatar}
                  alt="Your avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-500" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-semibold text-ink">
              {authUser?.name}
            </h2>
            <p className="truncate text-sm text-ink-soft">
              @{authUser?.username || authUser?.email}
            </p>
            {authUser?.bio && (
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                {/* {authUser.bio} */}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-ink-muted">
          ACCOUNT
        </p>
        <ul className="space-y-0.5">
          <NavItem
            icon={User}
            label="Profile"
            active={activeItem === "profile"}
            onClick={() => onNavigate("profile")}
          />
          <NavItem
            icon={Bell}
            label="Notifications"
            active={activeItem === "notifications"}
            onClick={() => onNavigate("notifications")}
          />
          <NavItem
            icon={Shield}
            label="Privacy & safety"
            active={activeItem === "privacy"}
            onClick={() => onNavigate("privacy")}
          />
        </ul>

        <p className="px-3 pb-2 pt-6 text-[11px] font-semibold tracking-wide text-ink-muted">
          PREFERENCES
        </p>
        <ul className="space-y-0.5">
          <NavItem
            icon={Palette}
            label="Appearance"
            active={activeItem === "appearance"}
            onClick={() => onNavigate("appearance")}
          />
          <NavItem
            icon={Globe}
            label="Language & region"
            active={activeItem === "language"}
            onClick={() => onNavigate("language")}
          />
          <button
            onClick={logout}
            className="flex ml-1 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </ul>
      </nav>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors
          ${
            active
              ? "bg-hover text-ink"
              : "text-ink-soft hover:bg-hover hover:text-ink"
          }`}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
          <span>{label}</span>
        </span>
        <ChevronRight
          className={`h-3.5 w-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5`}
        />
      </button>
    </li>
  );
}