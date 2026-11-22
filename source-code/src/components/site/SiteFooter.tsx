import { Link } from "@tanstack/react-router";

import { CONTACT_EMAIL, SOCIAL } from "@/content/portfolio";

import { BrandIcon } from "./BrandIcon";
import { BrandMark, BrandName } from "./Logo";

const LINKS = [
  { platform: "linkedin", href: SOCIAL.linkedin, label: "LinkedIn" },
  { platform: "github", href: SOCIAL.github, label: "GitHub" },
  { platform: "x", href: SOCIAL.x, label: "X" },
  { platform: "instagram", href: SOCIAL.instagram, label: "Instagram" },
  { platform: "email", href: `mailto:${CONTACT_EMAIL}`, label: "Email" },
] as const;

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border/60 bg-chrome">
      <div className="mx-auto max-w-site px-6">
        <div className="flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row">
            <div className="flex items-center gap-3">
              <BrandMark className="size-9" />
              <BrandName className="text-xl" />
            </div>
          </div>
          <ul className="flex items-center gap-2.5">
            {LINKS.map((l) => (
              <li key={l.platform}>
                <a
                  href={l.href}
                  aria-label={l.label}
                  {...(l.platform === "email" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="grid size-9 place-items-center rounded-sm border border-border text-foreground/90 transition-colors hover:border-primary hover:text-primary"
                >
                  <BrandIcon platform={l.platform} className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3 border-t border-border/60 py-6 text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} CODEX · SOFT. All rights reserved.
            <span className="ml-2 hidden text-xs tracking-[0.3em] text-foreground/70 lg:inline">
              · BUILDING BETTER SOLUTIONS TOGETHER
            </span>
          </p>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <span aria-hidden="true">|</span>
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
