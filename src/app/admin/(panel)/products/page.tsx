import { assertAdmin } from "@/lib/auth";
import { getAdminProducts } from "@/lib/repo";
import { ProductsManager } from "@/components/admin/ProductsManager";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  await assertAdmin();
  const [{ products, source }, sp] = [await getAdminProducts(), await searchParams];
  return <ProductsManager products={products} source={source} openNew={sp.new === "1"} />;
}
