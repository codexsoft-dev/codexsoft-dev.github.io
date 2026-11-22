import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

const TITLE = "Privacy Policy — CODEX · SOFT";
const DESCRIPTION = "Privacy Policy for the CODEX · SOFT website of Marko Z. Petković.";

export const Route = createFileRoute("/privacy")({
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
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={[
        {
          heading: "Overview",
          body: "This website is a personal presentation site of CODEX · SOFT, owned by Marko Z. Petković. It does not use accounts, forms or tracking cookies.",
        },
        {
          heading: "Data we collect",
          body: "No personal data is collected or stored by this website. If you contact us via social networks or e-mail, your message is handled only to reply to you.",
        },
        {
          heading: "Third-party services",
          body: "Fonts are loaded from Google Fonts, and links lead to external platforms (GitHub, X, Instagram, LinkedIn) that have their own privacy policies.",
        },
        {
          heading: "Contact",
          body: "For any privacy-related question, reach out via the social channels listed on the home page.",
        },
      ]}
    />
  );
}
