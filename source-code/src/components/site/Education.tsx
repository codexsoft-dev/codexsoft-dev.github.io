import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight, CalendarDays } from "lucide-react";

import {
  aboutMoreAction,
  FOLLOW_LINKS,
  INITIAL_REVEAL,
  revealReducer,
  visibleCourses,
  type Course,
} from "@/content/portfolio";
import { cn } from "@/lib/utils";

import { AboutCard } from "./AboutCard";
import { BrandIcon } from "./BrandIcon";
import { CodeWindow } from "./CodeWindow";

function CourseCard({ course, fresh }: { course: Course; fresh: boolean }) {
  return (
    <li className={cn("relative", fresh && "animate-rise")}>
      <span aria-hidden="true" className="timeline-node absolute -left-8 top-7 lg:-left-12" />
      <article className="bg-card p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <img
            src={course.logo}
            alt={course.logoAlt}
            width={128}
            height={128}
            loading="lazy"
            className="size-12 shrink-0 rounded-md border-2 border-foreground object-cover sm:size-14"
          />
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold leading-snug">{course.title}</h3>
            {course.date && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                {course.date}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3 text-[0.925rem] leading-[1.65] text-muted-foreground">
          {course.body.map((block, i) =>
            block.type === "p" ? (
              <p key={i}>{block.text}</p>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:gap-2.5">
          {course.links.map((link) => (
            <li key={link.platform + link.href} className="min-w-0">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.platform}, ${link.label}`}
                className="group flex items-center gap-2 bg-inset px-3 py-3 text-sm font-semibold transition-colors hover:bg-accent sm:gap-2.5 sm:px-3.5"
              >
                <BrandIcon platform={link.platform} className="size-5 shrink-0" />
                <span className="truncate">{link.label}</span>
                <ArrowRight
                  className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      </article>
    </li>
  );
}

/** Hand-drawn arrow curving up toward the social handles above it. */
function FollowArrow() {
  return (
    <svg viewBox="0 0 40 52" className="h-11 w-9 shrink-0 -translate-y-2" fill="none" aria-hidden="true">
      <path d="M6 48C20 44 30 30 27 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M19 13l8-9 7 10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EducationAndAbout() {
  const [reveal, dispatch] = useReducer(revealReducer, INITIAL_REVEAL);
  const showAll = reveal.showAllCourses;
  const courses = visibleCourses(showAll);

  // The list's left padding leaves room for the timeline dots' halo (the
  // scroll box would clip it otherwise); -ml-2 keeps the cards in place.
  // Show a bottom fade while the course list has more content below.
  const listRef = useRef<HTMLOListElement>(null);
  const [bar, setBar] = useState({ top: 0, size: 1, moreBelow: false });
  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    const size = scrollHeight > 0 ? Math.min(1, clientHeight / scrollHeight) : 1;
    const range = scrollHeight - clientHeight;
    const top = range > 0 ? (scrollTop / range) * (1 - size) : 0;
    setBar({ top, size, moreBelow: range - scrollTop > 4 });
  }, []);

  // Dragging the custom thumb scrolls the list.
  const dragThumb = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const el = listRef.current;
    if (!el) return;
    event.preventDefault();
    const startY = event.clientY;
    const startScroll = el.scrollTop;
    const ratio = el.scrollHeight / el.clientHeight;
    const move = (e: PointerEvent) => {
      el.scrollTop = startScroll + (e.clientY - startY) * ratio;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [measure, courses.length]);

  // "Show All Courses" / "Show Fewer Courses" toggle. When folding back, keep the
  // button in view on phones, where the list above it shrinks.
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const toggleCourses = () => {
    dispatch(showAll ? "hideAllCourses" : "showAllCourses");
    if (!showAll) return;
    requestAnimationFrame(() => {
      const btn = toggleButtonRef.current;
      if (btn && btn.getBoundingClientRect().top < 80) btn.scrollIntoView({ block: "center" });
    });
  };

  // When the list folds back to one course, start again from its top.
  useEffect(() => {
    if (!showAll && listRef.current) listRef.current.scrollTop = 0;
  }, [showAll]);

  return (
    <section className="bg-band py-20 lg:py-28">
      <div className="mx-auto grid max-w-site gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        {/* Education: on desktop its height follows the code + About column, and the list scrolls. */}
        <div
          id="education"
          className="flex min-w-0 scroll-mt-[10.5rem] flex-col lg:scroll-mt-[12.5rem]"
        >
          <p className="eyebrow">Education</p>
          <h2 className="card-title mt-4">Education &amp; Content</h2>

          <div className="relative mt-8 lg:min-h-[30rem] lg:flex-1">
            <div className="relative flex flex-col lg:absolute lg:inset-0">
              <span
                aria-hidden="true"
                className="timeline-rail-fade absolute bottom-2 left-[7.5px] top-9 w-px"
              />
              <div className="relative flex min-h-0 shrink flex-col">
                <ol
                  ref={listRef}
                  onScroll={measure}
                  aria-label="Courses"
                  tabIndex={0}
                  className="scroll-custom relative -ml-2 max-h-[80svh] min-h-0 space-y-5 pl-10 pr-4 outline-none lg:max-h-none lg:pl-14 lg:pr-5"
                >
                  {courses.map((c) => (
                    <CourseCard key={c.title} course={c} fresh={!c.featured} />
                  ))}
                </ol>
                <div
                  aria-hidden="true"
                  className={cn(
                    "scroll-fade-band pointer-events-none absolute bottom-0 left-8 right-4 h-16 transition-opacity duration-300 lg:left-12 lg:right-5",
                    bar.moreBelow ? "opacity-100" : "opacity-0",
                  )}
                />
                <div aria-hidden="true" className="scroll-track absolute bottom-0 right-0 top-0 w-1.5">
                  <span
                    onPointerDown={dragThumb}
                    className="scroll-thumb absolute inset-x-0 cursor-grab touch-none active:cursor-grabbing"
                    style={{ top: `${bar.top * 100}%`, height: `${bar.size * 100}%` }}
                  />
                </div>
              </div>

              <div className="relative shrink-0 pl-8 lg:pl-12">
                <button
                  ref={toggleButtonRef}
                  type="button"
                  aria-expanded={showAll}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleCourses}
                  className="mt-5 h-11 w-full rounded-sm border border-foreground/60 px-6 text-sm font-semibold transition-colors hover:bg-foreground/10 sm:w-auto"
                >
                  {showAll ? "Show Fewer Courses" : "Show All Courses"}
                </button>
              </div>

              <div className="relative shrink-0 pl-8 lg:mt-auto lg:pl-12">
                <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {FOLLOW_LINKS.map((f) => (
                    <li key={f.platform}>
                      <a
                        href={f.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 bg-card/80 px-3.5 py-3 text-[0.92rem] font-semibold transition-colors hover:bg-card"
                      >
                        <BrandIcon platform={f.platform} className="size-5 shrink-0" />
                        {f.handle}
                        <ArrowRight className="ml-auto size-4 text-muted-foreground sm:hidden" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Centred in the Education column; on desktop its bottom lines up with the About card. */}
              <p className="mt-4 flex shrink-0 items-end justify-center gap-1 font-script text-[clamp(1.4rem,3.2vw,1.8rem)] leading-none text-muted-foreground">
                <span className="-rotate-3">Follow for Go tips &amp; tricks!</span>
                <FollowArrow />
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6 lg:pt-1">
          <CodeWindow />
          <AboutCard
            expanded={reveal.aboutExpanded}
            onMore={() =>
              dispatch(aboutMoreAction(window.matchMedia("(min-width: 1024px)").matches))
            }
            onLess={() => dispatch("aboutLess")}
          />
        </div>
      </div>
    </section>
  );
}
