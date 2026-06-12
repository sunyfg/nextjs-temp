import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Dashboard settings",
};

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Configure your dashboard preferences.
      </p>

      <div className="mt-8 space-y-6">
        {[
          { label: "Site Name", value: "My Dashboard" },
          { label: "Language", value: "English" },
          { label: "Timezone", value: "Asia/Shanghai" },
        ].map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-black"
          >
            <span className="text-sm font-medium text-black dark:text-zinc-50">
              {field.label}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
