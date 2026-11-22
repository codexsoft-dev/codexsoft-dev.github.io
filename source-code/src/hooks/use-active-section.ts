import { useEffect, useState } from "react";

/** Scroll margin (5.5rem) every section uses under the sticky header. */
const DEFAULT_MARGIN = 88;

/**
 * Returns the id of the section that has reached the line just under the
 * sticky header (same rule as the original site's scroll spy).
 */
export function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      const header = document.querySelector<HTMLElement>("[data-site-header]");
      const line = (header?.getBoundingClientRect().height ?? 72) + 80;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        // A target with a larger scroll margin (e.g. Education, whose id sits
        // below the section padding) counts from where its link lands it.
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || DEFAULT_MARGIN;
        if (el.getBoundingClientRect().top - margin + DEFAULT_MARGIN <= line) current = id;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = ids[ids.length - 1] ?? current;
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids, enabled]);

  return active;
}
