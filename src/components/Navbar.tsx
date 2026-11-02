"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronDown, Clock, Compass, BookOpen, Navigation, Bot } from "lucide-react";
import Logo from "./Logo";

const primaryLinks = [
  { href: "/", label: "Beranda" },
  { href: "/ustadz", label: "Cari Ustadz" },
  { href: "/kajian", label: "Kajian" },
  { href: "/booking", label: "Undang Ustadz" },
  { href: "/konsultasi", label: "Konsultasi" },
  { href: "/asisten", label: "Asisten AI" },
];

const featureLinks = [
  { href: "/sholat", label: "Jadwal Sholat", icon: Clock, desc: "Waktu sholat & imsak" },
  { href: "/kiblat", label: "Arah Kiblat", icon: Compass, desc: "Kompas kiblat live" },
  { href: "/hadith", label: "Hadith Harian", icon: BookOpen, desc: "Hadith pilihan" },
  { href: "/tracking", label: "Lihat Perjalanan", icon: Navigation, desc: "Pantau perjalanan ustadz/ustadzah" },
];

const allLinks = [
  ...primaryLinks,
  ...featureLinks.map((f) => ({ href: f.href, label: f.label })),
  { href: "/asisten", label: "Asisten AI" },
  { href: "/tentang", label: "Tentang" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [featOpen, setFeatOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isFeatureActive = featureLinks.some((f) => isActive(f.href));

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {primaryLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-sand-100 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}

          {/* Features dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setFeatOpen(true)}
            onMouseLeave={() => setFeatOpen(false)}
          >
            <button
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isFeatureActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-sand-100 hover:text-slate-900"
              }`}
            >
              Fitur Islami
              <ChevronDown
                className={`h-4 w-4 transition-transform ${featOpen ? "rotate-180" : ""}`}
              />
            </button>
            {featOpen && (
              <div className="absolute left-0 top-full w-64 pt-1">
                <div className="overflow-hidden rounded-xl border border-sand-200 bg-white py-2 shadow-lg">
                  {featureLinks.map((f) => (
                    <Link
                      key={f.href}
                      href={f.href}
                      className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-primary-50"
                    >
                      <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <f.icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span
                          className={`block text-sm font-semibold ${
                            isActive(f.href)
                              ? "text-primary-700"
                              : "text-slate-700"
                          }`}
                        >
                          {f.label}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {f.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>

          <li>
            <Link
              href="/tentang"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/tentang")
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-sand-100 hover:text-slate-900"
              }`}
            >
              Tentang
            </Link>
          </li>
        </ul>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/ustadz"
            className="inline-flex items-center rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50"
          >
            Cari Ustadz
          </Link>
          <Link
            href="/asisten"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/30 transition-all hover:bg-primary-700 hover:shadow-md"
          >
            <Bot className="h-4 w-4" />
            Asisten AI
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-sand-100 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-sand-200 bg-white lg:hidden">
          <ul className="space-y-1 px-4 py-3">
            {/* Primary */}
            {primaryLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-base font-medium ${
                    isActive(l.href)
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-700 hover:bg-sand-100"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}

            {/* Features label */}
            <li className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Fitur Islami
            </li>
            {featureLinks.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium ${
                    isActive(f.href)
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-700 hover:bg-sand-100"
                  }`}
                >
                  <f.icon className="h-4 w-4 text-primary-400" />
                  {f.label}
                </Link>
              </li>
            ))}

            <li className="pt-2">
              <Link
                href="/tentang"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-base font-medium ${
                  isActive("/tentang")
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-700 hover:bg-sand-100"
                }`}
              >
                Tentang
              </Link>
            </li>

            <li className="pt-2">
              <Link
                href="/asisten"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-primary-600 px-3 py-2.5 text-center text-base font-semibold text-white"
              >
                Asisten AI
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
