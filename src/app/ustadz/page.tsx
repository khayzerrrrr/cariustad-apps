import { Suspense } from "react";
import DirektoriClient from "./DirektoriClient";

export default function UstadzPage({
  searchParams,
}: {
  searchParams: { q?: string; spec?: string };
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat...</div>}>
      <DirektoriClient initialQ={searchParams.q ?? ""} initialSpec={searchParams.spec ?? ""} />
    </Suspense>
  );
}
