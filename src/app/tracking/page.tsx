import TrackingClient from "./TrackingClient";

export default function TrackingPage({
  searchParams,
}: {
  searchParams: { booking?: string };
}) {
  return <TrackingClient bookingId={searchParams.booking ?? ""} />;
}
