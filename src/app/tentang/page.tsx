import Link from "next/link";
import {
  Target,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Terverifikasi",
    desc: "Setiap ustadz diverifikasi kredensial dan latar belakang keilmuannya sebelum bergabung.",
  },
  {
    icon: HeartHandshake,
    title: "Amanah",
    desc: "Mengutamakan keberkahan dan kejujuran dalam setiap pencocokan ustadz dengan jamaah.",
  },
  {
    icon: Sparkles,
    title: "Mudah & Cepat",
    desc: "Pencarian, undangan, dan konsultasi dalam satu platform yang ringkas dan responsif.",
  },
  {
    icon: Users,
    title: "Inklusif",
    desc: "Melayani seluruh kalangan — dari taklim rumahan hingga lembaga dan korporasi.",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Direktori & Pencarian",
    desc: "Temukan ustadz sesuai bidang keahlian, lokasi, dan ketersediaan dengan filter cerdas.",
  },
  {
    icon: Target,
    title: "Undang Ustadz",
    desc: "Pilih slot waktu yang tersedia dan kirim undangan untuk kajian atau acara Anda.",
  },
  {
    icon: HeartHandshake,
    title: "Konsultasi Online",
    desc: "Chat langsung dengan ustadz untuk berkonsultasi sebelum atau setelah acara.",
  },
  {
    icon: Sparkles,
    title: "Rating & Ulasan",
    desc: "Sistem reputasi transparan berdasarkan pengalaman jamaah dan panitia sebelumnya.",
  },
];

export default function TentangPage() {
  return (
    <div className="bg-sand-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900">
        <div className="islamic-pattern absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
            <Lightbulb className="h-3.5 w-3.5" />
            Visi Kami
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">
            Menghadirkan Ilmu yang Berkah,{" "}
            <span className="text-gold-400">Sampai ke Setiap Rumah</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-primary-50/90">
            CariUstadz lahir dari kebutuhan umat untuk mengakses ustadz
            terpercaya dengan mudah — tanpa ribet mencari kontak, tanpa
            ketidakpastian ketersediaan.
          </p>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-slate-800">
              Masalah yang Kami Pecahkan
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-rose-400">•</span>
                Sulit mencari ustadz yang sesuai bidang dan lokasi kebutuhan.
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400">•</span>
                Ketidakpastian jadwal dan ketersediaan ustadz.
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400">•</span>
                Tidak ada sistem reputasi yang transparan.
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400">•</span>
                Komunikasi terpencar di banyak channel dan sulit dilacak.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-slate-800">
              Solusi CariUstadz
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-primary-500">✓</span>
                Direktori ustadz terverifikasi dengan filter cerdas.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">✓</span>
                Jadwal ketersediaan real-time per ustadz.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">✓</span>
                Sistem rating & ulasan dari jamaah sebelumnya.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">✓</span>
                Undang ustadz & konsultasi terpusat dalam satu platform.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
              Fitur Utama
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              Empat pilar yang membuat CariUstadz menjadi platform dakwah yang
              lengkap dan terpercaya.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-sand-200 bg-sand-50 p-6 text-center transition-all hover:border-primary-200 hover:shadow-md"
              >
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-800">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
            Nilai yang Kami Pegang
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-sand-200 bg-white p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-slate-800">{v.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900 px-6 py-12 text-center sm:px-12">
          <div className="islamic-pattern absolute inset-0 opacity-[0.12]" />
          <div className="relative">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Mulai Perjalanan Dakwah Anda Hari Ini
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-50/90">
            Cari ustadz untuk kajian, ceramah, nikah, atau konsultasi — semua
            mudah di CariUstadz.
          </p>
          <Link
            href="/ustadz"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-transform hover:scale-105"
          >
            Cari Ustadz Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
