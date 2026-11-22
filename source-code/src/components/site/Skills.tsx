import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SKILLS_INTRO, SKILLS_MORE, visibleSkills } from "@/content/portfolio";
import { cn } from "@/lib/utils";

/** Columns per row on tablets and desktop; phones use 3. */
const DESKTOP_COLS = 6;

const toggleClass =
  "link-underline inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/90 hover:text-foreground";

export function Skills() {
  const [expanded, setExpanded] = useState(false);
  const skills = visibleSkills(expanded);
  const gridRef = useRef<HTMLUListElement>(null);

  // After folding back, bring the shorter grid into view if it scrolled away.
  const collapse = () => {
    setExpanded(false);
    requestAnimationFrame(() => {
      const grid = gridRef.current;
      if (grid && grid.getBoundingClientRect().bottom < 120) grid.scrollIntoView({ block: "center" });
    });
  };

  return (
    <section id="skills" className="bg-band py-20 lg:py-28">
      <div className="mx-auto max-w-site px-6">
        <p className="eyebrow">Skills</p>
        <h2 className="section-title mt-4">Technical Skills</h2>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
          {SKILLS_INTRO}
        </p>
        {expanded && (
          <p className="animate-rise mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">
            {SKILLS_MORE}
          </p>
        )}

        {/* Flex rows (not grid) so a shorter last row sits centred. */}
        <ul ref={gridRef} className="mt-12 flex flex-wrap justify-center gap-y-9 lg:mt-14 lg:gap-y-0">
          {skills.map((s, i) => (
            <li
              key={s.name}
              className={cn(
                "group flex min-w-0 basis-1/3 flex-col items-center gap-3 text-center md:basis-1/6 lg:border-b lg:border-r lg:border-border lg:px-3 lg:py-8",
                i % DESKTOP_COLS === 0 && "lg:border-l",
                i < DESKTOP_COLS && "lg:border-t",
                !s.featured && "animate-rise",
              )}
            >
              <img
                src={s.icon}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-9 w-14 object-contain transition-transform duration-300 group-hover:-translate-y-1 lg:h-11 lg:w-16"
              />
              <span className="font-display text-xs font-semibold text-foreground/90 min-[481px]:text-[13px]">
                {s.name}
              </span>
            </li>
          ))}
          {!expanded && (
            <li className="flex basis-1/3 items-center justify-center md:basis-4/6 md:justify-end lg:pr-4">
              <button
                type="button"
                aria-expanded={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setExpanded(true)}
                className={toggleClass}
              >
                Show All Skills <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </li>
          )}
        </ul>

        {expanded && (
          <div className="mt-10 flex justify-center md:justify-end lg:pr-4">
            <button
              type="button"
              aria-expanded={true}
              onMouseDown={(e) => e.preventDefault()}
              onClick={collapse}
              className={toggleClass}
            >
              Show Fewer Skills <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
