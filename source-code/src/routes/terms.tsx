import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

const TITLE = "Terms of Service — CODEX · SOFT";
const DESCRIPTION = "Terms of Service for the CODEX · SOFT website of Marko Z. Petković.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      sections={[
        {
          heading: "Use of this website",
          body: "The content of this website is provided for informational purposes about the services and experience of CODEX · SOFT.",
        },
        {
          heading: "Intellectual property",
          body: "The logo, texts and images on this website belong to CODEX · SOFT / Marko Z. Petković and may not be reused without permission.",
        },
        {
          heading: "External links",
          body: "This website links to external resources. CODEX · SOFT is not responsible for the content of third-party websites.",
        },
        {
          heading: "Changes",
          body: "These terms may be updated at any time. The latest version is always available on this page.",
        },
      ]}
    />
  );
}
