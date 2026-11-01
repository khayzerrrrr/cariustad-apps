import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-6xl font-bold text-primary-200">404</div>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-800">
        Ustadz tidak ditemukan
      </h1>
      <p className="mt-2 text-slate-500">
        Profil yang Anda cari mungkin tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/ustadz"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        <Home className="h-4 w-4" />
        Lihat Direktori Ustadz
      </Link>
    </div>
  );
}
