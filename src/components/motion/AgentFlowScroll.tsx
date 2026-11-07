"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import {
  MessageSquareText,
  ShieldAlert,
  ScanSearch,
  Workflow,
  UserSearch,
  MoonStar,
  CircleHelp,
  ClipboardList,
  Hand,
  CheckCircle2,
  ScrollText,
} from "lucide-react";

/**
 * AgentFlowScroll — signature interaction CariUstadz (territory: scroll).
 * 11 langkah alur agen di-scrub lewat scroll: section ter-pin (sticky),
 * kartu langkah berganti + garis emas progres menyapu vertikal,
 * seperti jamaah yang masuk shaf satu per satu.
 *
 * Mobile & reduced motion: fallback daftar vertikal statis — konten
 * tidak pernah dikunci di balik animasi (usability gate).
 */

const steps = [
  {
    icon: MessageSquareText,
    title: "Instruksi Masuk",
    desc: "“Saya mau booking ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang.” Bahasa alami, tanpa formulir.",
  },
  {
    icon: ShieldAlert,
    title: "Prompt Guard",
    desc: "23 pola prompt injection (ID + EN) diperiksa sebelum apa pun dieksekusi. Percobaan bypass ditolak di gerbang.",
  },
  {
    icon: ScanSearch,
    title: "Scope Guard",
    desc: "Pertanyaan di luar domain ditolak sebelum menyentuh LLM — penolakan tidak bisa dinegosiasikan lewat prompt.",
  },
  {
    icon: Workflow,
    title: "Parse Niat",
    desc: "Kalimat berubah menjadi parameter terstruktur: jenis acara, hari, waktu, lokasi, jumlah jemaah.",
  },
  {
    icon: UserSearch,
    title: "Cari Ustadz",
    desc: "483 profil terverifikasi di 54 kota dicocokkan dengan bidang keahlian dan preferensi Anda.",
  },
  {
    icon: MoonStar,
    title: "Cultural Rules",
    desc: "Salat Jumat (11:30–13:00), tumpang tindih waktu salat, preferensi gender — aturan deterministik, bukan tebakan model.",
  },
  {
    icon: CircleHelp,
    title: "Klarifikasi",
    desc: "Jika ada yang kurang jelas, agen bertanya — bukan menebak. Parameter kosong tidak pernah diisi diam-diam.",
  },
  {
    icon: ClipboardList,
    title: "Rencana Ditampilkan",
    desc: "Agen menunjukkan rencana lengkap: siapa, kapan, di mana, berapa. Bukan konfirmasi siluman.",
  },
  {
    icon: Hand,
    title: "Persetujuan Manusia",
    desc: "Titik henti yang nyata. Tanpa kata “setuju”, tidak ada yang terjadi — permintaan “langsung booking saja” justru terdeteksi.",
  },
  {
    icon: CheckCircle2,
    title: "Eksekusi",
    desc: "Baru setelah persetujuan, status berubah menjadi confirmed dan tercatat di halaman Booking.",
  },
  {
    icon: ScrollText,
    title: "Audit Log",
    desc: "Setiap langkah tercatat dan bisa dibuka pengguna. Siapa meminta apa, kapan, atas dasar apa.",
  },
];

type Step = (typeof steps)[number];

function StepCard({
  step,
  active,
  index,
}: {
  step: Step;
  active: boolean;
  index: number;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      animate={{
        opacity: active ? 1 : 0.35,
        scale: active ? 1 : 0.98,
      }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border p-6 sm:p-8 ${
        active
          ? "border-primary-200 bg-white shadow-xl shadow-primary-900/5"
          : "border-sand-200 bg-white/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            active
              ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
              : "bg-sand-100 text-slate-500"
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Langkah {index + 1} dari {steps.length}
          </div>
          <h3 className="mt-1 font-display text-xl font-bold text-slate-800 sm:text-2xl">
            {step.title}
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            {step.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Header() {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
        <ShieldAlert className="h-3.5 w-3.5" />
        Alur Agen — 11 Langkah
      </span>
      <h2 className="display-safe mt-4 font-display text-3xl font-bold text-slate-800 sm:text-4xl">
        Dari Rapat ke Tindakan
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-600">
        Keputusan rapat tidak lagi hilang di notulen. Gulir dan ikuti
        bagaimana satu kalimat menjadi booking yang tercatat — dengan
        persetujuan manusia di titik henti yang nyata.
      </p>
    </div>
  );
}

function useActiveStep(rawIndex: MotionValue<number>) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const unsub = rawIndex.on("change", (v) => {
      setIndex(Math.min(steps.length - 1, Math.max(0, Math.round(v))));
    });
    return unsub;
  }, [rawIndex]);
  return index;
}

function Rail({
  progress,
  activeIndex,
}: {
  progress: MotionValue<number>;
  activeIndex: number;
}) {
  return (
    <div className="relative hidden w-10 shrink-0 md:block">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sand-200" />
      <motion.div
        style={{ scaleY: progress }}
        className="absolute left-1/2 top-0 h-full w-px origin-top -translate-x-1/2 bg-gradient-to-b from-primary-500 to-gold-400"
      />
      {steps.map((_, i) => (
        <span
          key={i}
          className={`absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full transition-colors duration-300 ${
            i <= activeIndex ? "bg-primary-500" : "bg-sand-200"
          }`}
          style={{ top: `${(i / (steps.length - 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function AgentFlowScroll() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const rawIndex = useTransform(scrollYProgress, [0, 1], [0, steps.length - 1]);
  const activeIndex = useActiveStep(rawIndex);

  // daftar statis tanpa animasi (untuk reduced motion — tampil di semua ukuran)
  const fullList = (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Header />
      <div className="mt-10 space-y-4">
        {steps.map((s, i) => (
          <StepCard key={s.title} step={s} active index={i} />
        ))}
      </div>
    </section>
  );

  if (reduced) return fullList;

  return (
    <>
      {/* fallback mobile: daftar vertikal biasa */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 md:hidden">
        <Header />
        <div className="mt-10 space-y-4">
          {steps.map((s, i) => (
            <StepCard key={s.title} step={s} active index={i} />
          ))}
        </div>
      </section>

      {/* desktop: section ter-pin dengan scrub */}
      <section
        ref={sectionRef}
        className="relative hidden md:block"
        style={{ height: `${steps.length * 56}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto w-full max-w-5xl px-6 lg:px-8">
            <Header />
            <div className="mt-8 flex gap-6">
              <Rail progress={scrollYProgress} activeIndex={activeIndex} />
              <div className="flex-1">
                <StepCard key={activeIndex} step={steps[activeIndex]} active index={activeIndex} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
