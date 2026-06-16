"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; children: NavLink[] };
export type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

function isLinkActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function groupContainsActive(group: NavGroup, pathname: string): boolean {
  return group.children.some((child) => isLinkActive(child.href, pathname));
}

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Which groups are expanded — auto-expand group containing current page
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Initial state: expand groups that contain the current pathname
    // We pass a function so it runs only once (not SSR doesn't have pathname)
    return new Set<string>();
  });

  // After mount (client only), auto-expand the group for the current page
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (isGroup(item) && groupContainsActive(item, pathname)) {
          next.add(item.label);
        }
      }
      return next;
    });
  }, [pathname, items]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-6">
      {items.map((item) =>
        isGroup(item) ? (
          <div key={item.label}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(item.label)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            >
              <span>{item.label}</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  expandedGroups.has(item.label) ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Children */}
            {expandedGroups.has(item.label) && (
              <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isLinkActive(child.href, pathname)
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isLinkActive(item.href, pathname)
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}
