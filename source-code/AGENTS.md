<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All site copy, skills, jobs and courses live in `src/content/portfolio.ts`; components only render it, so text edits never touch layout code.
- Reveal rules (the "Show All Courses"/"Show Fewer Courses" toggle, the "Show All Skills"/"Show Fewer Skills" toggle, About show more/less ↔ courses via `revealReducer`, linked only on desktop where the columns sit side by side) are pure functions in `src/content/portfolio.ts` with tests beside it; keep logic there, not in components.
- On desktop the Education column is absolutely positioned inside its grid cell so its height follows the code window + About column, and the course list scrolls; do not let it drive the row height.
- Site images are Lovable Assets pointers under `src/assets/`; the favicon and apple-touch icon stay as real files in `public/`.
- The course list hides its native scrollbar and renders a custom always-visible track/thumb, because native bars auto-hide on phones and macOS; never set overscroll containment on it, so page scrolling continues past the list end.
- The hero's background shapes are the traced outlines of the header logo, stored as SVG paths in `src/components/site/logo-outline.ts`, so they stay crisp at any size.
- A nav target whose id sits below its section's top padding uses a larger scroll margin; the scroll spy subtracts each target's scroll margin, so the highlight still matches where the link lands.
