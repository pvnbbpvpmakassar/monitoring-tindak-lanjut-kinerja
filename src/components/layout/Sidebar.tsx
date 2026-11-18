
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tindak Lanjut",
    href: "/tindak-lanjut",
    icon: ClipboardList,
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#15406A] text-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck size={23} strokeWidth={2} />
            </div>

            <div>
              <p className="text-sm font-bold leading-tight">
                Monitoring Kinerja
              </p>
              <p className="mt-1 text-[10px] tracking-[0.15em] text-blue-100/70">
                ADMINISTRATOR
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup sidebar"
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/50">
            Menu Utama
          </p>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href === "/tindak-lanjut" &&
                  pathname.startsWith("/tindak-lanjut/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-[#15406A] shadow-sm"
                      : "text-blue-50/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />

                  <span>{item.label}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#15406A]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck size={16} />
            </div>

            <div>
              <p className="text-xs font-medium text-white">
                Sistem Administrasi
              </p>
              <p className="mt-0.5 text-[10px] text-blue-100/60">
                Monitoring Tindak Lanjut
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
