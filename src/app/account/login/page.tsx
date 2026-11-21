import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/AuthForm";
import { getCustomer, safeNext } from "@/lib/customer";

export default async function CustomerLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCustomer()) redirect(next);
  return <AuthForm mode="login" next={next} />;
}
