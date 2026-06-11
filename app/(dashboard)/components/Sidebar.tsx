"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useMemo } from "react";
import { buildTheftCases } from "@/lib/powergridAnalytics";
import { useLatestLiveResults } from "@/services/powergridHooks";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "dashboard", label: "Executive Overview" },
  { href: "/dashboard/gis", icon: "map", label: "GIS Intelligence Map" },
  {
    href: "/dashboard/field-ops",
    icon: "engineering",
    label: "Field Operations",
    count: 12,
  },
  {
    href: "/dashboard/analytics",
    icon: "analytics",
    label: "Analytics & Reports",
  },
  { href: "/dashboard/admin", icon: "admin_panel_settings", label: "Admin" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const latest = useLatestLiveResults();
  const fieldOpsCount = useMemo(
    () =>
      buildTheftCases(latest.data, 500).filter((item) =>
        ["Critical", "High"].includes(item.severity)
      ).length,
    [latest.data]
  );

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border-dark bg-[#111813] h-full flex-shrink-0 z-20">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex flex-col gap-6">
          <div className="flex gap-3 items-center px-2">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-border-dark shadow-[0_0_15px_rgba(17,212,82,0.2)]">
              <Image
                src="/logo/edn_logo.svg"
                alt="Logo"
                width={40}
                height={40}
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-bold leading-tight">
                Energy Data Network
              </h1>
              <p className="text-text-muted text-xs font-normal">
                Assurance Portal
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const count =
                item.href === "/dashboard/field-ops"
                  ? fieldOpsCount || item.count
                  : item.count;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                    isActive
                      ? "bg-[#28392e] border-l-4 border-primary text-white shadow-sm"
                      : "text-text-muted hover:bg-[#28392e] hover:text-white border-l-4 border-transparent"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      isActive ? "filled text-primary" : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "font-bold" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  {count && (
                    <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-border-dark pt-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#28392e]/50 border border-border-dark">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-border-dark"
              style={{
                backgroundImage: `url("${
                  user?.imageUrl || "https://placehold.co/64x64"
                }")`,
              }}
            ></div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-white text-sm font-medium truncate">
                {user?.fullName || user?.username || "User"}
              </p>
              <p className="text-text-muted text-xs truncate">
                {user?.primaryEmailAddress?.emailAddress || "user@example.com"}
              </p>
            </div>
            <SignOutButton redirectUrl="/sign-in">
              <button
                className="ml-auto text-text-muted hover:text-white p-1 rounded-md hover:bg-white/10"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">
                  logout
                </span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </aside>
  );
}
