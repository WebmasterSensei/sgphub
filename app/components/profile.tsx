// components/settings.tsx
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

type SettingsProps = {
  onNavigate: () => void;
  authUser: any; // or Models.User<Models.Preferences> | null
};

export default function Settings({ onNavigate, authUser }: SettingsProps) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const account = new Account(client);
  const logout = async () => {
    try {
      await account.deleteSession("current");
      window.location.href = "/"; // or wherever your login page is
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-full flex-col lg:sticky lg:top-0P bg-white">
      {/* Profile quick view */}
      <div className="border-b border-neutral-100 p-6">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="h-14 w-14 overflow-hidden rounded-full ring-1 ring-neutral-200">
              <img
                src={authUser?.avatar}
                alt="Alex Rivera"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-semibold text-neutral-900">
              {authUser?.name}
            </h2>
            <p className="truncate text-sm text-neutral-500">
              {authUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-neutral-400">
          ACCOUNT
        </p>
        <ul className="space-y-0.5">
          <NavItem icon={User} label="Profile" active onClick={onNavigate} />
          <NavItem icon={Bell} label="Notifications" onClick={onNavigate} />
          <NavItem
            icon={Shield}
            label="Privacy & safety"
            onClick={onNavigate}
          />
        </ul>

        <p className="px-3 pb-2 pt-6 text-[11px] font-semibold tracking-wide text-neutral-400">
          PREFERENCES
        </p>
        <ul className="space-y-0.5">
          <NavItem icon={Palette} label="Appearance" onClick={onNavigate} />
          <NavItem
            icon={Globe}
            label="Language & region"
            onClick={onNavigate}
          />
          <button
            onClick={logout}
            className="flex ml-1 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
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
              ? "bg-neutral-100 text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          }`}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
          <span>{label}</span>
        </span>
        <ChevronRight
          className={`h-3.5 w-3.5 text-neutral-300 transition-transform group-hover:translate-x-0.5 ${
            active ? "text-neutral-400" : ""
          }`}
        />
      </button>
    </li>
  );
}
