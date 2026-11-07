import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Briefcase,
  Wallet,
  Clock,
  CalendarCheck,
  MessageCircle,
  GraduationCap,
  Phone,
  MessageSquareText,
  CalendarDays,
  Star,
} from "lucide-react";
import { ustadzData } from "@/lib/data";
import { formatRupiah } from "@/lib/storage";
import Avatar from "@/components/Avatar";
import StarRating from "@/components/StarRating";
import ReviewSection from "./ReviewSection";
import Reveal from "@/components/motion/Reveal";

export function generateStaticParams() {
  return ustadzData.map((u) => ({ id: u.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const u = ustadzData.find((x) => x.id === params.id);
  if (!u) return { title: "Ustadz tidak ditemukan" };
  return {
    title: `${u.title} ${u.name} — CariUstadz`,
    description: u.bio,
  };
}

export default function UstadzDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ustadz = ustadzData.find((u) => u.id === params.id);
  if (!ustadz) notFound();

  const fullName = `${ustadz.title} ${ustadz.name}`;

  return (
    <div className="bg-sand-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/ustadz"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke direktori
        </Link>

        {/* Header card */}
        <Reveal className="mt-4" y={20}>
        <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm">
          <div className="relative h-28 bg-gradient-to-r from-primary-600 to-teal-700 sm:h-32">
            <div className="islamic-pattern absolute inset-0 opacity-[0.12]" />
          </div>
          <div className="relative z-10 px-5 pb-6 sm:px-8">
            {/* Avatar + aksi */}
            <div className="-mt-14 flex items-end justify-between gap-3">
              <div className="rounded-3xl bg-white p-1.5 shadow-md ring-1 ring-black/5">
                <Avatar
                  name={ustadz.name}
                  gradient={ustadz.avatarGradient}
                  size="xl"
                />
              </div>

              <div className="flex shrink-0 gap-2 pb-1">
                <Link
                  href={`/konsultasi?ustadz=${ustadz.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-sand-50 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <MessageCircle className="h-4 w-4 text-primary-500" />
                  Chat
                </Link>
                <Link
                  href={`/booking?ustadz=${ustadz.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Undang Ustadz
                </Link>
              </div>
            </div>

            {/* Identitas */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
                  {fullName}
                </h1>
                {ustadz.verified && (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-primary-500" />
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {ustadz.credentials} • {ustadz.experience} tahun pengalaman
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary-400" />
                  {ustadz.area}, {ustadz.city}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
                  <span className="font-semibold text-slate-700">
                    {ustadz.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-500">
                    ({ustadz.reviewCount} ulasan)
                  </span>
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {ustadz.specializations.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                >
                  {s}
                </span>
              ))}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  ustadz.available
                    ? "bg-green-50 text-green-600"
                    : "bg-sand-100 text-slate-500"
                }`}
              >
                <Clock className="h-3 w-3" />
                {ustadz.available ? "Tersedia" : "Sedang sibuk"}
              </span>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-sand-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <GraduationCap className="h-3.5 w-3.5" /> Pengalaman
                </div>
                <div className="mt-1 font-semibold text-slate-700">
                  {ustadz.experience} thn
                </div>
              </div>
              <div className="rounded-xl bg-sand-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Wallet className="h-3.5 w-3.5" /> Honor
                </div>
                <div className="mt-1 font-semibold text-slate-700">
                  {formatRupiah(ustadz.fee)}
                </div>
              </div>
              <div className="rounded-xl bg-sand-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Briefcase className="h-3.5 w-3.5" /> Bidang
                </div>
                <div className="mt-1 font-semibold text-slate-700">
                  {ustadz.specializations.length}
                </div>
              </div>
              <div className="rounded-xl bg-sand-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Lokasi
                </div>
                <div className="mt-1 truncate font-semibold text-slate-700">
                  {ustadz.city}
                </div>
              </div>
            </div>

            {/* Lulusan & Kontak */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-sand-200 p-3">
                <GraduationCap className="h-5 w-5 shrink-0 text-primary-500" />
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Lulusan</div>
                  <div className="truncate text-sm font-semibold text-slate-700">
                    {ustadz.almaMater}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-sand-200 p-3">
                <Phone className="h-5 w-5 shrink-0 text-primary-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">Kontak</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {ustadz.contact.phone}
                  </div>
                </div>
                <a
                  href={`https://wa.me/${ustadz.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                >
                  <MessageSquareText className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Bio + Schedule */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-sand-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-slate-800">
                Tentang {ustadz.title} {ustadz.name.split(" ")[0]}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {ustadz.bio}
              </p>
            </section>

            <section className="rounded-2xl border border-sand-200 bg-white p-6">
              <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-slate-800">
                <CalendarDays className="h-5 w-5 text-primary-500" />
                Kegiatan yang Bisa Diisi
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Jenis acara yang sesuai dengan keahlian {ustadz.title} {ustadz.name.split(" ")[0]}:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ustadz.eventTypes.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    {e}
                  </span>
                ))}
              </div>
              <Link
                href={`/booking?ustadz=${ustadz.id}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <CalendarCheck className="h-4 w-4" />
                Undang Ustadz untuk Kegiatan Ini
              </Link>
            </section>

            <section className="rounded-2xl border border-sand-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-800">
                  Jadwal Ketersediaan
                </h2>
                <span className="text-xs text-slate-500">
                  Klik slot untuk booking
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ustadz.schedule.map((d) => (
                  <div
                    key={d.day}
                    className="rounded-xl border border-sand-200 p-3"
                  >
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      {d.day}
                    </div>
                    <div className="space-y-1.5">
                      {d.slots.map((slot) =>
                        slot.booked ? (
                          <div
                            key={slot.time}
                            className="rounded-lg bg-sand-100 px-2 py-1.5 text-xs text-slate-500 line-through"
                          >
                            {slot.time}
                          </div>
                        ) : (
                          <Link
                            key={slot.time}
                            href={`/booking?ustadz=${ustadz.id}&day=${d.day}&time=${encodeURIComponent(
                              slot.time
                            )}`}
                            className="block rounded-lg bg-primary-50 px-2 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-600 hover:text-white"
                          >
                            {slot.time}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: rating summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-sand-200 bg-white p-6 text-center">
              <div className="font-display text-4xl font-bold text-slate-800">
                {ustadz.rating.toFixed(1)}
              </div>
              <StarRating rating={ustadz.rating} size={18} />
              <p className="mt-1 text-xs text-slate-500">
                Berdasarkan {ustadz.reviewCount} ulasan
              </p>
              <Link
                href={`/booking?ustadz=${ustadz.id}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <CalendarCheck className="h-4 w-4" />
                Undang Sekarang
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection
          ustadzId={ustadz.id}
          ustadzName={fullName}
          baseRating={ustadz.rating}
          baseReviewCount={ustadz.reviewCount}
        />
      </div>
    </div>
  );
}
