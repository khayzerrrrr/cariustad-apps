import Link from "next/link";
import Image from "next/image";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span className="relative inline-flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-105">
        <Image
          src="/icons/mark.png"
          alt="Logo CariUstadz"
          width={36}
          height={36}
          priority
          className="h-9 w-9 object-contain"
        />
      </span>
      <span
        className={`font-display text-xl font-bold tracking-tight ${
          light ? "text-white" : "text-slate-800"
        }`}
      >
        Cari<span className="text-primary-600">Ustadz</span>
      </span>
    </Link>
  );
}
