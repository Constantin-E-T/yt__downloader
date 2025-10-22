"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on transcript pages
  const hideFooter = pathname?.startsWith("/transcripts/");

  if (hideFooter) return null;

  return <Footer />;
}
