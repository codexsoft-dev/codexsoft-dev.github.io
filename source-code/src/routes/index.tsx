import { createFileRoute } from "@tanstack/react-router";

import { EducationAndAbout } from "@/components/site/Education";
import { Experience } from "@/components/site/Experience";
import { Hero } from "@/components/site/Hero";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Skills } from "@/components/site/Skills";

const TITLE = "Marko Z. Petković — Go & Java Backend Engineer | CODEX · SOFT";
const DESCRIPTION =
  "Portfolio of Marko Z. Petković, a Go and Java backend engineer in Serbia. iGaming and fintech experience, plus free courses such as GoPath and Cup 'o Go.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <Skills />
      <Experience />
      <EducationAndAbout />
    </SiteLayout>
  );
}
