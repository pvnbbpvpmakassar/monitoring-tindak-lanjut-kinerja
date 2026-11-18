
"use client";

import { logoutAction } from "@/actions/auth";
import {
  Menu,
  LogOut,
  UserRound,
  ChevronDown,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  admin: {
    id: string;
    nama: string;
    email: string;
  };
  onMenuClick: () => void;
}

export default function Header({
  admin,
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle =
    pathname === "/dashboard"
      ? "Dashboard"
      : pathname.startsWith("/tindak-lanjut")
        ? "Tindak Lanjut"
        : "Monitoring Kinerja";

  const initials = admin.nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka navigasi"
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-[#172b42] sm:text-xl">
            {pageTitle}
          </h1>
          <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
            Monitoring Tindak Lanjut Kinerja
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((value) => !value)}
          aria-expanded={profileOpen}
          className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50 sm:gap-3 sm:px-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#15406A]/10 text-xs font-bold text-[#15406A]">
            {initials}
          </div>

          <div className="hidden text-left sm:block">
            <p className="max-w-[170px] truncate text-sm font-semibold text-slate-700">
              {admin.nama}
            </p>
            <p className="text-[11px] text-slate-400">
              Administrator
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`hidden text-slate-400 transition-transform sm:block ${
              profileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {profileOpen && (
          <>
            <button
              type="button"
              aria-label="Tutup menu profil"
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />

            <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15406A]/10 text-sm font-bold text-[#15406A]">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {admin.nama}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {admin.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600">
                  <UserRound size={17} />
                  <span>Akun Administrator</span>
                </div>

                <div className="my-1 border-t border-slate-100" />

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    <span>Keluar dari Aplikasi</span>
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
