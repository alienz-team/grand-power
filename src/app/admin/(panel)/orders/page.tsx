import { assertAdmin } from "@/lib/auth";
import { getImportRequests } from "@/lib/repo";
import { OrdersManager } from "@/components/admin/OrdersManager";

export default async function AdminOrdersPage() {
  await assertAdmin();
  const { requests, source } = await getImportRequests();
  return <OrdersManager requests={requests} source={source} />;
}
