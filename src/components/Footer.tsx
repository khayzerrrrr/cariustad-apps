import Link from "next/link";
import { BookOpen, Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500">
              Platform pencarian dan booking ustadz terpercaya untuk
              memudahkan umat mengakses ilmu dan bimbingan agama.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">Navigasi</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/ustadz" className="text-slate-500 hover:text-primary-600">
                  Cari Ustadz
                </Link>
              </li>
              <li>
                <Link href="/kajian" className="text-slate-500 hover:text-primary-600">
                  Info Kajian
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-slate-500 hover:text-primary-600">
                  Booking Jadwal
                </Link>
              </li>
              <li>
                <Link href="/konsultasi" className="text-slate-500 hover:text-primary-600">
                  Konsultasi
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="text-slate-500 hover:text-primary-600">
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">Fitur Islami</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/sholat" className="hover:text-primary-600">
                  Jadwal Sholat
                </Link>
              </li>
              <li>
                <Link href="/kiblat" className="hover:text-primary-600">
                  Arah Kiblat
                </Link>
              </li>
              <li>
                <Link href="/hadith" className="hover:text-primary-600">
                  Hadith Harian
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-primary-600">
                  Lihat Perjalanan Ustadz/Ustadzah
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">Spesialisasi</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>Tafsir Al-Qur&apos;an</li>
              <li>Fiqih & Aqidah</li>
              <li>Ceramah & Tausiyah</li>
              <li>Nikah & Keluarga</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">Kontak</h4>
            <ul className="mt-3 space-y-3 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-500" />
                halo@cariustadz.id
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-500" />
                0897-0991-994
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-500" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sand-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © 2026 CariUstadz. Dibuat untuk Hackathon.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <BookOpen className="h-3.5 w-3.5 text-primary-400" />
            &ldquo;Menuntut ilmu adalah kewajiban setiap muslim.&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
