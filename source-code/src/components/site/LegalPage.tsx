import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { SiteLayout } from "./SiteLayout";

export type LegalSection = { heading: string; body: string };

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <SiteLayout>
      <section className="bg-background py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <Link to="/" className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
          </Link>
          <div className="mt-10">
            <p className="eyebrow">Legal</p>
          </div>
          <h1 className="section-title mt-4">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: November 2026</p>
          <div className="mt-10 space-y-6">
            {sections.map((s) => (
              <article key={s.heading} className="bg-card p-6">
                <h2 className="font-display text-lg font-semibold">{s.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
