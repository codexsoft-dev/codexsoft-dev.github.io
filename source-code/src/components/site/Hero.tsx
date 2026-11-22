import { ArrowRight, Box, BriefcaseBusiness, Cloud, CodeXml, Download, SunMedium } from "lucide-react";

import portrait from "@/assets/marko-portrait.webp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useOpenContact } from "./contact-context";
import { LOGO_OUTLINE_PATHS, LOGO_OUTLINE_VIEWBOX } from "./logo-outline";

const STACK = ["Go", "Java", "SQL", "REST/gRPC", "Kafka", "Docker"];

const FOCUS = [
  { icon: CodeXml, lines: ["Backend", "Development"] },
  { icon: Box, lines: ["Software", "Engineering"] },
  { icon: Cloud, lines: ["DevOps"] },
  { icon: SunMedium, lines: ["iGaming & Fintech"] },
];

/** Outlines of the two CODEX · SOFT logo shapes, drawn behind the portrait. */
function LogoFrame({ className }: { className?: string }) {
  return (
    <svg viewBox={LOGO_OUTLINE_VIEWBOX} className={cn("text-hex", className)} fill="none" aria-hidden="true">
      {LOGO_OUTLINE_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} stroke="currentColor" strokeWidth="1.4" />
      ))}
    </svg>
  );
}

function CtaButtons({ compact }: { compact?: boolean }) {
  const openContact = useOpenContact();
  const size = "hero";
  const fit = "h-12 px-7 text-base";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild variant="solid" size={size} className={fit}>
        <a href="#experience">
          View My Work <ArrowRight />
        </a>
      </Button>
      <Button asChild variant="frame" size={size} className={fit}>
        <a href="#experience">
          <Download /> Download CV
        </a>
      </Button>
      {compact && (
        <Button variant="solid" size={size} className={cn(fit, "md:ml-auto")} onClick={openContact}>
          Let's Talk <ArrowRight />
        </Button>
      )}
    </div>
  );
}

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-background">
      <div className="relative mx-auto max-w-site px-6 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-10 lg:block lg:h-[clamp(600px,50vw,720px)]">
        {/* Name */}
        <div className="animate-rise relative z-10 pt-10 md:self-center lg:absolute lg:left-6 lg:top-[22%] lg:pt-0">
          <h1 className="font-display text-5xl font-extrabold sm:text-6xl xl:text-7xl leading-[0.98] tracking-[-0.025em]">
            Marko Z.
            <br />
            Petković
          </h1>
          <p className="mt-5 flex items-center gap-3 font-display text-lg text-muted-foreground sm:text-xl lg:mt-6 lg:text-base xl:text-lg">
            <span className="h-px w-6 bg-muted-foreground" aria-hidden="true" />
            <span>
              Founder @ <span className="font-semibold text-foreground">CODEX</span> · SOFT
            </span>
          </p>
        </div>

        {/* Role + stack: beside the name from tablet up, flush with the right margin */}
        <div className="animate-rise relative z-10 mt-8 [animation-delay:120ms] md:mt-0 md:self-center md:justify-self-end md:pt-10 lg:absolute lg:left-[59%] lg:right-6 lg:top-[30%] lg:mt-0">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-2xl xl:text-3xl">
            Backend Software Engineer
          </h2>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:text-base xl:text-lg">
            {STACK.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                {s}
              </span>
            ))}
          </p>
          <p className="mt-1.5 text-sm font-semibold tracking-wide text-muted-foreground">
            iGaming &amp; Fintech
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
            Open to Full-Time Roles &amp; B2B Engagements
          </p>
          <div className="mt-6 hidden lg:block">
            <CtaButtons />
          </div>
        </div>

        {/*
          Portrait. Below desktop the margin keeps the logo outline's top 20px
          under the text above it: the outline pokes 18.45% of the portrait's
          width above the image (the portrait is 90% wide, max 520px).
        */}
        <div className="relative ml-auto mt-[calc(1.125rem+16.6%)] w-[90%] max-w-[520px] sm:mx-auto sm:mt-[calc(1.125rem+96px)] md:col-span-2 lg:absolute lg:bottom-0 lg:left-[38%] lg:mt-0 lg:w-[48%] lg:max-w-none lg:-translate-x-1/2">
          <LogoFrame className="absolute bottom-[24%] left-1/2 w-[74%] -translate-x-1/2" />
          <img
            src={portrait}
            alt="Portrait of Marko Z. Petković, Go and Java backend engineer"
            width={1013}
            height={893}
            fetchPriority="high"
            className="relative block h-auto w-full"
          />
        </div>
      </div>

      {/* Phone + tablet CTA row */}
      <div className="border-t border-border/60 lg:hidden">
        <div className="mx-auto max-w-site px-5 py-5 sm:px-6">
          <CtaButtons compact />
        </div>
      </div>

      {/* Focus strip */}
      <div className="border-t border-border/60">
        <ul className="mx-auto grid max-w-site grid-cols-2 md:grid-cols-4 md:px-6 md:py-7">
          {FOCUS.map(({ icon: Icon, lines }, i) => (
            <li
              key={lines.join(" ")}
              className={cn(
                "flex min-w-0 items-center gap-4 px-6 py-5 md:gap-3 md:px-4 md:py-0 lg:gap-4 lg:px-6",
                i % 2 === 1 && "border-l border-border/60",
                i < 2 && "border-b border-border/60 md:border-b-0",
                i > 0 && "md:border-l md:border-border/60",
                i === 0 && "md:pl-0",
              )}
            >
              <Icon className="size-8 shrink-0 text-foreground/90 lg:size-10" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-display text-sm leading-tight">
                {lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
