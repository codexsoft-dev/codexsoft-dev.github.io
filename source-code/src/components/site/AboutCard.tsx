import { Feather, Infinity as InfinityIcon, Lightbulb, Users } from "lucide-react";

import { ABOUT_LEAD, ABOUT_REST } from "@/content/portfolio";

const POINTS = [
  { icon: Feather, lines: ["Clean", "Code"] },
  { icon: Lightbulb, lines: ["Knowledge", "Sharing"] },
  { icon: InfinityIcon, lines: ["Continuous", "Learning"] },
  { icon: Users, lines: ["Team", "Player"] },
];

const toggleClass =
  "mt-3 block text-base font-semibold text-foreground/90 hover:text-foreground hover:underline";

type Props = { expanded: boolean; onMore: () => void; onLess: () => void };

export function AboutCard({ expanded, onMore, onLess }: Props) {

  return (
    <article id="about" className="bg-card p-6 sm:p-8">
      <p className="eyebrow">About</p>
      <h2 className="card-title mt-3">About me</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>{ABOUT_LEAD}</p>
        {!expanded && (
          <button
            type="button"
            className={toggleClass}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onMore}
          >
            show more...
          </button>
        )}
        {expanded && (
          <div className="animate-rise space-y-4">
            {ABOUT_REST.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <button
              type="button"
              className={toggleClass}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onLess}
            >
              show less...
            </button>
          </div>
        )}
      </div>

      <ul className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
        {POINTS.map(({ icon: Icon, lines }) => (
          <li
            key={lines.join(" ")}
            className="flex min-w-0 flex-col items-center gap-2 bg-inset px-1 py-4 text-center text-xs font-normal leading-tight sm:py-5 sm:text-sm"
          >
            <Icon className="size-7 text-foreground/90 sm:size-8" strokeWidth={1.5} aria-hidden="true" />
            <span>
              {lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
