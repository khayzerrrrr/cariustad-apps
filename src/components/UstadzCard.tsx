import Link from "next/link";
import { MapPin, BadgeCheck, Clock, Navigation } from "lucide-react";
import { Ustadz } from "@/lib/types";
import { formatRupiah } from "@/lib/storage";
import { formatDistance } from "@/lib/geo";
import Avatar from "./Avatar";
import StarRating from "./StarRating";

export default function UstadzCard({
  ustadz,
  distance,
}: {
  ustadz: Ustadz;
  distance?: number | null;
}) {
  const fullName = `${ustadz.title} ${ustadz.name}`;
  return (
    <Link
      href={`/ustadz/${ustadz.id}`}
      className="group flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10"
    >
      <div className="flex items-start gap-4">
        <Avatar
          name={ustadz.name}
          gradient={ustadz.avatarGradient}
          size="lg"
          title={ustadz.title}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-slate-800">
              {fullName}
            </h3>
            {ustadz.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary-500" />
            )}
          </div>
          <p className="text-xs text-slate-400">{ustadz.credentials}</p>
          <div className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-primary-400" />
            <span className="truncate">
              {ustadz.city}, {ustadz.province}
            </span>
          </div>
          {distance != null && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              <Navigation className="h-3 w-3" />
              {formatDistance(distance)} dari Anda
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ustadz.specializations.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{ustadz.bio}</p>

      <div className="mt-4 flex items-center justify-between border-t border-sand-100 pt-3">
        <StarRating
          rating={ustadz.rating}
          showValue
          reviewCount={ustadz.reviewCount}
        />
        <span className="text-sm font-semibold text-slate-700">
          {formatRupiah(ustadz.fee)}
          <span className="text-xs font-normal text-slate-400"> /acara</span>
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            ustadz.available ? "text-primary-600" : "text-slate-400"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          {ustadz.available ? "Tersedia" : "Sibuk"}
        </span>
        <span className="text-sm font-semibold text-primary-600 transition-transform group-hover:translate-x-0.5">
          Lihat Profil →
        </span>
      </div>
    </Link>
  );
}
