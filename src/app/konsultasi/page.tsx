import KonsultasiClient from "./KonsultasiClient";

export default function KonsultasiPage({
  searchParams,
}: {
  searchParams: { ustadz?: string };
}) {
  return <KonsultasiClient initialUstadz={searchParams.ustadz ?? ""} />;
}
