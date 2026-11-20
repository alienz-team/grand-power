import Image from "next/image";
import { LOGO_URL } from "@/lib/config/contact";

/** Original GRAND POWER logo — never altered, only scaled. */
export function Logo({ size = 48, priority = false, className = "" }: { size?: number; priority?: boolean; className?: string }) {
  return (
    <Image
      src={LOGO_URL}
      alt="GRAND POWER | قراند باور"
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
      sizes={`${size}px`}
    />
  );
}
