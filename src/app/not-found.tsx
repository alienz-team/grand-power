import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Logo size={120} className="mx-auto" />
        <p className="font-display mt-6 text-6xl text-crimson">404</p>
        <p className="mt-3 text-muted">الصفحة غير موجودة · Page not found</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-crimson px-6 py-3 text-sm font-bold text-white">
          قراند باور · GRAND POWER
        </Link>
      </div>
    </main>
  );
}
