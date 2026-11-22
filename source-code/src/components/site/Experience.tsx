import { ArrowRight, CalendarDays } from "lucide-react";

import { EXPERIENCE, EXPERIENCE_INTRO } from "@/content/portfolio";

import { RichText } from "./RichText";

export function Experience() {
  return (
    <section id="experience" className="bg-background py-20 lg:py-28">
      <div className="mx-auto grid max-w-site gap-12 px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="eyebrow">Experience</p>
          <h2 className="section-title mt-4">
            Professional <br className="hidden lg:block" />
            Experience
          </h2>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground">
            {EXPERIENCE_INTRO}
          </p>
          <a
            href="#experience"
            className="link-underline mt-7 inline-flex items-center gap-1.5 text-base font-semibold"
          >
            View Full CV <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <ol className="relative space-y-4 pl-9 lg:pl-12">
          <span
            aria-hidden="true"
            className="absolute bottom-14 left-[7.5px] top-12 w-px bg-rail"
          />
          {EXPERIENCE.map((job) => (
            <li key={job.role} className="relative">
              <span
                aria-hidden="true"
                className="timeline-node absolute -left-9 top-8 lg:-left-12"
              />
              <article className="flex gap-4 bg-card p-5 sm:gap-5 sm:p-6">
                <img
                  src={job.logo}
                  alt={job.logoAlt}
                  width={128}
                  height={128}
                  loading="lazy"
                  className="size-11 shrink-0 rounded-md border-2 border-foreground object-cover sm:size-14"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <h3 className="font-display text-base font-bold leading-snug">
                      {job.role}
                      <span className="font-medium text-muted-foreground"> | {job.company}</span>
                    </h3>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      {job.period}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                    {job.bullets.map((b) => (
                      <li key={b} className="flex gap-2.5">
                        <span aria-hidden="true" className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-node" />
                        <span>
                          <RichText text={b} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
