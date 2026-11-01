import BookingClient from "./BookingClient";

export default function BookingPage({
  searchParams,
}: {
  searchParams: { ustadz?: string; day?: string; time?: string };
}) {
  return (
    <BookingClient
      initialUstadz={searchParams.ustadz ?? ""}
      initialDay={searchParams.day ?? ""}
      initialTime={searchParams.time ?? ""}
    />
  );
}
