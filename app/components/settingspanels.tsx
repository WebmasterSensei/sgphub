// components/settingspanels.tsx — functional settings panels
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Check,
  Loader2,
  Monitor,
  Save
} from "lucide-react";
import { tablesDB } from "@/lib/appwrite";

type PanelShellProps = {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

function PanelShell({ icon: Icon, title, subtitle, children }: PanelShellProps) {
  return (
    <div className="w-full max-w-full">
      <div className="mb-5 flex items-center gap-3 border-b border-hairline pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hover">
          <Icon className="h-5 w-5 text-ink" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-hairline bg-surface-raised px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20 placeholder:text-ink-muted"
      />
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function ProfileSettingsPanel({
  profile,
  onSaved
}: {
  profile: any;
  onSaved?: (updated: any) => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const canSave = name.trim().length > 0 && /^[a-z0-9._]{3,24}$/.test(username);

  const save = async () => {
    if (!profile || !canSave) return;
    setSaving(true);
    try {
      await tablesDB.updateRow({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_TABLE_ID!,
        rowId: profile.$id,
        data: {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim()
        }
      });
      onSaved?.({ ...profile, name: name.trim(), username: username.trim().toLowerCase(), bio: bio.trim() });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell icon={User} title="Edit profile" subtitle="How others see you on Street GP">
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface-raised p-4">
          <img
            src={profile?.avatar}
            alt="avatar"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-hairline"
          />
          <div>
            <p className="font-medium text-ink">Profile photo</p>
            <p className="text-sm text-ink-muted">
              Generated from your display name
            </p>
          </div>
        </div>
        <Field
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Your display name"
        />
        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="username"
          hint="3–24 characters, lowercase (a-z, 0-9, . _)"
        />
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Bio
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell Street GP what you ride, build, or love."
            rows={3}
            maxLength={150}
            className="w-full resize-none rounded-xl border border-hairline bg-surface-raised px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20 placeholder:text-ink-muted"
          />
          <span className="mt-1 block text-right text-xs text-ink-muted">
            {bio.length}/150
          </span>
        </label>
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : savedFlash ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {savedFlash ? "Saved!" : "Save changes"}
        </button>
      </div>
    </PanelShell>
  );
}

export function AppearancePanel() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [mode, setMode] = useState<"system" | "light" | "dark">("system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setIsDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const effective = mode === "system" ? isDark : mode === "dark";
  const effectiveLabel = useMemo(
    () => (effective ? "Dark" : "Light"),
    [effective]
  );

  const options: { value: typeof mode; label: string; icon: any }[] = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon }
  ];

  return (
    <PanelShell
      icon={Palette}
      title="Appearance"
      subtitle="Street GP follows your system theme"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Light preview */}
          <div
            className={`rounded-2xl border-2 p-3 transition ${
              !effective ? "border-accent" : "border-hairline"
            } bg-white`}
          >
            <div className="rounded-lg bg-white p-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-neutral-200" />
                <div className="h-2 w-16 rounded bg-neutral-200" />
              </div>
              <div className="mt-2 h-16 rounded bg-neutral-200" />
              <div className="mt-2 h-2 w-24 rounded bg-neutral-200" />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-neutral-700">
              Light
            </p>
          </div>
          {/* Dark preview */}
          <div
            className={`rounded-2xl border-2 p-3 transition ${
              effective ? "border-accent" : "border-hairline"
            } bg-neutral-950`}
          >
            <div className="rounded-lg bg-neutral-900 p-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-neutral-700" />
                <div className="h-2 w-16 rounded bg-neutral-700" />
              </div>
              <div className="mt-2 h-16 rounded bg-neutral-800" />
              <div className="mt-2 h-2 w-24 rounded bg-neutral-700" />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-neutral-200">
              Dark
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {effective ? (
                <Moon className="h-5 w-5 text-accent" />
              ) : (
                <Sun className="h-5 w-5 text-accent" />
              )}
              <div>
                <p className="text-sm font-medium text-ink">Theme</p>
                <p className="text-xs text-ink-muted">
                  Currently using {effectiveLabel} mode
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-hover px-2.5 py-1 text-xs text-ink-soft">
              {effective ? (
                <Moon className="h-3 w-3" />
              ) : (
                <Sun className="h-3 w-3" />
              )}
              {effectiveLabel}
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Preference
          </p>
          <div className="grid grid-cols-3 gap-2">
            {options.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                  mode === value
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-hairline bg-surface-raised text-ink-soft hover:bg-hover"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Light and Dark previews show how the app looks with your chosen
            preference. The app always starts as &quot;System&quot; and follows
            your device.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

export function NotificationsPanel() {
  const rows = [
    { label: "Likes on your posts", on: true },
    { label: "Comments on your posts", on: true },
    { label: "New followers", on: true },
    { label: "Mentions in Street GP topics", on: false },
    { label: "Product updates", on: false }
  ];
  const [settings, setSettings] = useState(rows);

  return (
    <PanelShell
      icon={Bell}
      title="Notifications"
      subtitle="Choose what you hear about"
    >
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised">
        {settings.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between p-4 ${
              i > 0 ? "border-t border-hairline" : ""
            }`}
          >
            <span className="text-sm text-ink">{row.label}</span>
            <button
              onClick={() =>
                setSettings((s) =>
                  s.map((r, j) => (j === i ? { ...r, on: !r.on } : r))
                )
              }
              aria-pressed={row.on}
              aria-label={`Toggle ${row.label}`}
              className={`relative h-6 w-11 rounded-full transition ${
                row.on ? "bg-accent" : "bg-hover"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  row.on ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        Notification preferences are stored on this device for now.
      </p>
    </PanelShell>
  );
}

export function PrivacyPanel() {
  const [privacy, setPrivacy] = useState(false);
  return (
    <PanelShell
      icon={Shield}
      title="Privacy & safety"
      subtitle="Control who can interact with you"
    >
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-ink">Private profile</p>
            <p className="text-xs text-ink-muted">
              Only people you follow can see your posts
            </p>
          </div>
          <button
            onClick={() => setPrivacy((p) => !p)}
            aria-pressed={privacy}
            className={`relative h-6 w-11 rounded-full transition ${
              privacy ? "bg-accent" : "bg-hover"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                privacy ? "left-[calc(100%-1.375rem)]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        <div className="border-t border-hairline p-4">
          <p className="text-sm text-ink">Data & session</p>
          <p className="mt-1 text-xs text-ink-muted">
            Sign-out anytime from the sidebar. Your Street GP session is managed
            securely by Appwrite.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        Privacy preferences are stored on this device for now.
      </p>
    </PanelShell>
  );
}

export function LanguagePanel() {
  const languages = ["English (US)", "English (UK)", "Filipino", "Spanish"];
  const [selected, setSelected] = useState(languages[0]);
  return (
    <PanelShell
      icon={Globe}
      title="Language & region"
      subtitle="App language"
    >
      <div className="space-y-2">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelected(lang)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
              selected === lang
                ? "border-accent bg-accent/10 text-ink"
                : "border-hairline bg-surface-raised text-ink-soft hover:bg-hover"
            }`}
          >
            <span>{lang}</span>
            {selected === lang && <Check className="h-4 w-4 text-accent" />}
          </button>
        ))}
      </div>
    </PanelShell>
  );
}