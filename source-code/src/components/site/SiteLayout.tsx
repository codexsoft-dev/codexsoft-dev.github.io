import type { ReactNode } from "react";

import { ContactProvider } from "./contact-context";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ContactProvider>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </ContactProvider>
  );
}
