"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  CalendarCheck,
  MessageCircle,
  Star,
  Users,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Compass,
  Navigation,
  BookOpen,
  CalendarDays,
  Tag,
  Bot,
} from "lucide-react";
import { ustadzData, kajianData } from "@/lib/data";
import { ALL_SPECIALIZATIONS, ALL_CITIES } from "@/lib/types";
import UstadzCard from "@/components/UstadzCard";
import HeroSearch from "@/components/HeroSearch";
import HadithWidget from "@/components/HadithWidget";
import IslamicHeroBg from "@/components/IslamicHeroBg";
import Reveal from "@/components/motion/Reveal";
import StaggerShaf from "@/components/motion/StaggerShaf";
import CountUp from "@/components/motion/CountUp";
import WordReveal from "@/components/motion/WordReveal";
import AgentFlowScroll from "@/components/motion/AgentFlowScroll";

const steps = [
  {
    icon: Search,
    title: "Cari Ustadz",
    desc: "Jelajahi direktori ustadz terverifikasi sesuai spesialisasi, lokasi, dan jadwal ketersediaan.",
    color: "bg-primary-500",
  },
  {
    icon: CalendarCheck,
    title: "Undang Ustadz",
    desc: "Pilih slot waktu yang tersedia dan kirim undangan untuk kajian, ceramah, atau konsultasi.",
    color: "bg-teal-600",
  },
  {
    icon: MessageCircle,
    title: "Konsultasi & Kajian",
    desc: "Hubungi ustadz via chat untuk berkonsultasi, lalu nikmati kajian yang berkah.",
    color: "bg-gold-500",
  },
];

// hero reveal berurutan: tenang, satu per satu — seperti masuk shaf
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function HomePage() {
  const reduced = useReducedMotion();

  const featured = [...ustadzData]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  const upcomingKajian = [...kajianData]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const ustadzName = (id: string) =>
    ustadzData.find((u) => u.id === id)?.name ?? "Ustadz";

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDayName = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { weekday: "long" });
  };

  const stats = [
    {
      label: "Ustadz Terverifikasi",
      value: ustadzData.length,
      suffix: "+",
      icon: Users,
    },
    { label: "Kota Terjangkau", value: ALL_CITIES.length, suffix: "", icon: MapPin },
    {
      label: "Bidang Keahlian",
      value: ALL_SPECIALIZATIONS.length,
      suffix: "",
      icon: Sparkles,
    },
    { label: "Rating Rata-rata", value: 48, suffix: "", icon: Star, decimal: true },
  ];

  const hero = (children: React.ReactNode, key: string) =>
    reduced ? (
      <div key={key}>{children}</div>
    ) : (
      <motion.div key={key} variants={heroItem}>
        {children}
      </motion.div>
    );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <IslamicHeroBg />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              variants={reduced ? undefined : heroContainer}
              initial={reduced ? undefined : "hidden"}
              animate={reduced ? undefined : "visible"}
            >
              {hero(
                <p
                  dir="rtl"
                  className="mb-4 font-display text-xl text-gold-300/70 sm:text-2xl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>,
                "bismillah"
              )}
              {hero(
                <span className="hero-text-shadow inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  Platform dakwah digital #1 di Indonesia
                </span>,
                "badge"
              )}
              {hero(
                <h1 className="hero-text-shadow mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  <WordReveal
                    text="Temukan Ustadz Terpercaya untuk Setiap Kebutuhan Dakwah"
                    highlightClass="hero-glow text-gold-400"
                    highlightWords={["Kebutuhan", "Dakwah"]}
                  />
                </h1>,
                "headline"
              )}
              {hero(
                <p className="hero-text-shadow mx-auto mt-5 max-w-xl text-base text-primary-50/95 sm:text-lg">
                  Kajian rutin, ceramah, nikah, hingga konsultasi keluarga —
                  semua dalam satu platform. Cari, undang, dan konsultasi dengan
                  ustadz terverifikasi di seluruh Indonesia.
                </p>,
                "sub"
              )}
            </motion.div>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <HeroSearch />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-primary-50/80">Populer:</span>
              {["Fiqih", "Ceramah & Tausiyah", "Nikah & Keluarga", "Tahsin & Tahfidz"].map(
                (t) => (
                  <Link
                    key={t}
                    href={`/ustadz?spec=${encodeURIComponent(t)}`}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/20"
                  >
                    {t}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats — count-up saat masuk viewport */}
      <section className="border-b border-sand-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <Reveal key={s.label} y={16}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-2xl font-bold text-slate-800">
                    {s.decimal ? (
                      <span>{(s.value / 10).toFixed(1)}</span>
                    ) : (
                      <CountUp value={s.value} suffix={s.suffix} />
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Cara Kerja — masuk shaf */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="display-safe font-display text-2xl font-bold text-slate-800 sm:text-3xl">
            Cara Kerja CariUstadz
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Tiga langkah mudah untuk mendapatkan ustadz yang tepat untuk
            acara dan kebutuhan Anda.
          </p>
        </Reveal>

        <StaggerShaf className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-sand-200 bg-white p-6 shadow-sm"
            >
              <span className="absolute right-5 top-5 font-display text-4xl font-bold text-sand-200">
                {i + 1}
              </span>
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${step.color} text-white shadow-sm`}
              >
                <step.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{step.desc}</p>
            </div>
          ))}
        </StaggerShaf>
      </section>

      {/* SIGNATURE: Alur agen 11 langkah — pin + scrub */}
      <AgentFlowScroll />

      {/* AI Assistant CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-10 sm:px-10 sm:py-12">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Bot className="h-3.5 w-3.5" />
                  AI Agent — Challenge B
                </span>
                <h2 className="display-safe mt-3 font-display text-2xl font-bold text-emerald-900 sm:text-3xl">
                  Ngobrol Langsung dengan Asisten AI CariUstadz
                </h2>
                <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
                  AI Agent dengan avatar, voice interaksi, kesadaran budaya Islam
                  (salat Jumat, preferensi gender), dan akuntabilitas penuh.
                  Cari ustadz cukup dengan chat atau suara — undangan dengan persetujuan Anda.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Voice & Text", "Cultural Rules", "Human-in-the-Loop", "Audit Log"].map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/asisten"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-[background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-700 hover:shadow-xl"
              >
                <Bot className="h-5 w-5" />
                Buka Asisten AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Featured Ustadz — masuk shaf */}
      <section className="bg-sand-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="display-safe font-display text-2xl font-bold text-slate-800 sm:text-3xl">
                  Ustadz Pilihan
                </h2>
                <p className="mt-2 text-slate-600">
                  Ustadz dengan rating tertinggi dan paling banyak direkomendasikan.
                </p>
              </div>
              <Link
                href="/ustadz"
                className="hidden items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:inline-flex"
              >
                Lihat semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <StaggerShaf className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((u) => (
              <UstadzCard key={u.id} ustadz={u} />
            ))}
          </StaggerShaf>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/ustadz"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
            >
              Lihat semua ustadz <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hadith + Quick Islamic Tools */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <HadithWidget />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-3">
              <h3 className="font-display text-lg font-bold text-slate-800">
                Tools Islami
              </h3>
              {[
                {
                  href: "/sholat",
                  label: "Jadwal Sholat",
                  desc: "Waktu sholat & imsak",
                  icon: Clock,
                  color: "bg-primary-50 text-primary-600",
                },
                {
                  href: "/kiblat",
                  label: "Arah Kiblat",
                  desc: "Kompas kiblat live",
                  icon: Compass,
                  color: "bg-teal-50 text-teal-600",
                },
                {
                  href: "/hadith",
                  label: "Hadith Harian",
                  desc: "Kumpulan hadith pilihan",
                  icon: BookOpen,
                  color: "bg-gold-50 text-gold-600",
                },
                {
                  href: "/tracking",
                  label: "Lihat Perjalanan",
                  desc: "Pantau perjalanan ustadz/ustadzah",
                  icon: Navigation,
                  color: "bg-blue-50 text-blue-600",
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center gap-3 rounded-xl border border-sand-200 bg-white p-3 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary-300 hover:shadow-md"
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tool.color}`}
                  >
                    <tool.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700 group-hover:text-primary-700">
                      {tool.label}
                    </div>
                    <div className="text-xs text-slate-500">{tool.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-0.5 group-hover:text-primary-500" />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Kajian Preview — masuk shaf */}
      <section className="bg-sand-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="display-safe font-display text-2xl font-bold text-slate-800 sm:text-3xl">
                  Kajian Mendatang
                </h2>
                <p className="mt-2 text-slate-600">
                  Jangan lewatkan kajian dan pengajian terdekat di kota Anda.
                </p>
              </div>
              <Link
                href="/kajian"
                className="hidden items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:inline-flex"
              >
                Lihat semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <StaggerShaf className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {upcomingKajian.map((k) => (
              <div
                key={k.id}
                className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-primary-600 px-3 py-2 text-white">
                    <span className="text-xs font-medium uppercase">
                      {formatDayName(k.date).slice(0, 3)}
                    </span>
                    <span className="font-display text-xl font-bold leading-none">
                      {formatDate(k.date).split(" ")[0]}
                    </span>
                    <span className="text-[10px] uppercase">
                      {formatDate(k.date).split(" ")[1]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
                      <Tag className="h-3 w-3" />
                      {k.eventType}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 font-semibold text-slate-800">
                      {k.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                  {k.description}
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary-400" />
                    {ustadzName(k.ustadzId)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary-400" />
                    {k.time}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary-400" />
                    {k.location}, {k.city}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-sand-100 pt-3">
                  <span
                    className={`text-sm font-semibold ${
                      k.price === "Gratis"
                        ? "text-green-600"
                        : "text-gold-600"
                    }`}
                  >
                    {k.price === "Berbayar" && k.fee
                      ? `Rp ${k.fee.toLocaleString("id-ID")}`
                      : "Gratis"}
                  </span>
                  <Link
                    href="/kajian"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Detail <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </StaggerShaf>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/kajian"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
            >
              Lihat semua kajian <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Spesialisasi — masuk shaf */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="display-safe font-display text-2xl font-bold text-slate-800 sm:text-3xl">
            Jelajahi Bidang Keahlian
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Temukan ustadz sesuai kebutuhan, dari tafsir hingga ekonomi syariah.
          </p>
        </Reveal>

        <StaggerShaf className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ALL_SPECIALIZATIONS.map((spec) => {
            const count = ustadzData.filter((u) =>
              u.specializations.includes(spec)
            ).length;
            return (
              <Link
                key={spec}
                href={`/ustadz?spec=${encodeURIComponent(spec)}`}
                className="group rounded-xl border border-sand-200 bg-white p-4 text-center transition-[border-color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-md"
              >
                <div className="font-medium text-slate-700 group-hover:text-primary-700">
                  {spec}
                </div>
                <div className="mt-1 text-xs text-slate-500">{count} ustadz</div>
              </Link>
            );
          })}
        </StaggerShaf>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900 px-6 py-12 text-center shadow-lg sm:px-12 sm:py-16">
            <div className="islamic-pattern absolute inset-0 opacity-[0.07]" />
            <div className="relative">
              <ShieldCheck className="mx-auto h-10 w-10 text-gold-400" />
              <h2 className="display-safe mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
                Siap Menghadirkan Kajian yang Berkah?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-primary-50/90">
                Bergabung dengan ribuan jamaah dan panitia yang telah mempercayai
                CariUstadz untuk mengakses ustadz terverifikasi.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/ustadz"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105"
                >
                  Mulai Cari Ustadz <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tentang"
                  className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/10"
                >
                  Pelajari Platform
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
