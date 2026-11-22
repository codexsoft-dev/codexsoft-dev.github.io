import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

import { useOpenContact } from "./contact-context";
import { BrandMark, BrandName } from "./Logo";

const NAV = [
  { id: "home", label: "Home" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "about", label: "About" },
];
const NAV_IDS = NAV.map((n) => n.id);

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const openContact = useOpenContact();
  const isHome = useLocation({ select: (l) => l.pathname === "/" });
  const active = useActiveSection(NAV_IDS, isHome);

  const contact = () => {
    setOpen(false);
    openContact();
  };

  const linkClass = (id: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-foreground xl:text-[0.9375rem]",
      isHome && active === id ? "text-foreground" : "text-muted-foreground",
    );

  return (
    <header data-site-header className="sticky top-0 z-40 border-b border-border/40 bg-chrome/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-6 px-6 lg:h-[4.5rem]">
        <Link to="/" hash="home" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <BrandMark className="size-8" />
          <BrandName className="text-xl" />
        </Link>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.id} to="/" hash={n.id} className={linkClass(n.id)}>
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={contact} className={linkClass("contact")}>
            Contact
          </button>
        </nav>

        <Button variant="solid" size="sm" className="hidden h-11 px-[22px] text-[0.9375rem] lg:inline-flex" onClick={contact}>
          Let's Talk <ArrowRight />
        </Button>

        <Button
          variant="solid"
          size="icon"
          className="lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </Button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border/50 bg-chrome lg:hidden">
          <div className="mx-auto flex max-w-site flex-col px-6 py-3">
            {NAV.map((n) => (
              <Link
                key={n.id}
                to="/"
                hash={n.id}
                onClick={() => setOpen(false)}
                className={cn(linkClass(n.id), "border-b border-border/40 py-3 text-[0.9375rem]")}
              >
                {n.label}
              </Link>
            ))}
            <button type="button" onClick={contact} className={cn(linkClass("contact"), "py-3 text-left text-[0.9375rem]")}>
              Contact
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
