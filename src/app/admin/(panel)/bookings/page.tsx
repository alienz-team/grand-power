import { assertAdmin } from "@/lib/auth";
import { getServiceBookings } from "@/lib/repo";
import { BookingsManager } from "@/components/admin/BookingsManager";

export default async function AdminBookingsPage() {
  await assertAdmin();
  const { bookings, source } = await getServiceBookings();
  return <BookingsManager bookings={bookings} source={source} />;
}
