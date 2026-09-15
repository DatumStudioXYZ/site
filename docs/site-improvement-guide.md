# Datum: step-by-step improvement guide

Date: 14 September 2026  
Scope: the Datum website and the project practices discussed in the review.  
Status: implementation started. Steps 2, 3's unpublished-draft fallback, 4, 5, and 7 through 9 are complete locally. Step 11 is complete locally, pending runtime configuration and preview verification. Step 6 is corrected and verified locally, but remains pending in production; Step 10 and the remaining steps are pending unless recorded below.

## Implementation record

### 14 September 2026 — Local baseline and type correction

- Starting branch: `main`; HEAD: `bc98455a674e62fd2af8295a31c200f83f700ee0`.
- Existing work preserved: the email change in `src/data/site.ts`, the untracked article `src/content/articles/wled-thread-and-the-right-remote.mdx`, and this untracked guide.
- Runtime: Node `22.23.2`, npm `10.9.8`, both within `package.json` engine ranges. `.node-version` specifies `22.16.0`; that exact Node version was not used for these checks.
- Baseline: `npm run check` failed with one readonly-array assignment error in `Layout.astro`; `npm run build` passed (12 pages).
- Step 2 complete locally: `SocialLinks.astro` now accepts `readonly SocialLink[]`. No cast or data mutation was introduced.
- After the correction: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages); generated homepage HTML contains the named Bluesky and RSS links; `git diff --check` passed.
- Step 1 remains partial: production deployment ID, branch, commit, build settings, and custom-domain mapping have not been verified. No preview or production deployment was performed.
- At this baseline, the workshop route was absent from the generated build. Step 3's subsequent repair is recorded below.

### 14 September 2026 — Step 3: remove the unavailable workshop promise

- Read the complete workshop draft. It describes existing storage/floor frustrations, proposed task zones and storage/QR inventory, and claimed outcomes (clear floor, reliable inventory, reduced stress). The draft does not substantiate those outcomes or supply verified photograph dates. It also links to an unpublished article at `/articles/creating-the-first-shop/`.
- Used the step's explicit unpublished-draft fallback. Kept `draft: true`, `status: "in-progress"`, dates, and collection filtering unchanged.
- Removed the workshop destination from the homepage photograph and replaced “View case study” with a non-interactive progress statement. The system description now identifies the design and its aim rather than implying a verified working result.
- Replaced the generic Projects empty state with an explanation of the workshop study and the forthcoming report.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages); generated-output assertions confirmed both homepage links are absent, both progress messages render, and the workshop remains unpublished. `git diff --check` passed. No browser visual check or deployment was performed.
- Before publishing the workshop: confirm actual interventions and observed results, verify photograph dates/captions, rewrite unsupported outcomes, and remove or resolve the unpublished essay link.
- Next: step 5, shorten the commission-ready homepage without weakening the evidence path.

### 14 September 2026 — Step 4: confirm commission-ready positioning

- The private direction explicitly confirms that Datum accepts commissions now; its home renovation continues as a personal project alongside client work. This replaces the earlier experiment-first plan.
- The public implementation matches that decision: the homepage names commissions and directs visitors to “Start a conversation”; the Services page explains individually scoped and priced work; About distinguishes Gavin’s renovation from client work; and the shared description/structured data describe Datum as a commission-based studio.
- The workshop remains accurately framed as a personal project in progress. It is not presented as client work or as proof of an unobserved outcome.
- The commission branch deliberately avoids invented fees, fixed packages, availability claims, or testimonials. It gives visitors a truthful first step: share the space or routine, location, timing, and budget so the work can be scoped.
- Source audit: `src/pages/index.astro`, `src/pages/services/index.astro`, `src/pages/about/index.astro`, `src/data/site.ts`, `src/layouts/Layout.astro`, and `public/llms.txt` agree with the confirmed direction. `src/data/services.ts` remains a catalogue of service areas rather than a claim of fixed packages.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages). Generated homepage, Services, and About output contains the commission-ready descriptions, calls to action, and structured data. The workshop route remains absent, as intended while its progress report is unpublished.
- Follow-up verification: corrected the Services introduction heading to use its own layout instead of the numbered-service grid, which squeezed the heading into the number column. Type-check, build, and diff checks pass; the local browser confirms the corrected heading and project-specific pricing copy. Production deployment/domain provenance remains pending.

### 14 September 2026 — Step 5: shorten the homepage and put evidence first

- Reordered the homepage to: commission invitation, workshop evidence, concise reference-point explanation, service areas, and contact. The in-progress workshop now immediately follows the opening screen.
- Kept the workshop truthful: it remains a personal project, its system is labelled as a working hypothesis, and the progress-report statement stays non-interactive while the route is unpublished.
- Removed the duplicated homepage process, values, and promises sections. Their fuller material remains on the dedicated Process and About pages.
- Replaced the hero’s full-viewport minimum height with a bounded desktop height and content-driven mobile height. This reveals the next section sooner without reducing text size or removing the hero image.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages). Local browser review at desktop and 390px confirms the intended content order, visible commission action, and mobile layout. Production and both-colour-scheme review remain release tasks.

### 14 September 2026 — Step 6: correct dark-mode foreground tokens and identify production drift

- Root cause in source: the dark-mode override changed `.button-primary` foreground text to `var(--ink-dark)`, making its text dark against the moss background. The same older deployed stylesheet left small eyebrow/section-label text on the moss token against a dark surface.
- Added the semantic `--button-primary-text` token and use it for primary buttons in both colour schemes. Removed the dark-mode foreground override; the primary action now keeps white text. Existing dark-mode label and footer corrections remain intact.
- Local generated stylesheet verification in dark mode: primary CTA `#ffffff` on `#3f4a3d` is 9.3:1; eyebrow/section label `#d2ddc4` on the dark surface is 14.88:1; footer text is 13.74:1. `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages).
- Production comparison: `datumstudio.xyz` serves a different stylesheet than the local build. Its primary CTA is `#232320` on `#3f4a3d` (1.69:1), and its eyebrow is `#3f4a3d` on the dark surface (2.26:1). The production footer already passes at 13.74:1.
- Do not apply another CSS patch or broadly purge caches. Deploy the reviewed local revision through the established Pages workflow, then repeat the production dark-mode computed-style and visual checks for normal, hover, focus, disabled, and sending states.

### 14 September 2026 — Step 7: make the mobile menu operable

- Changed mobile navigation from visual-only hiding to progressive enhancement. Without JavaScript, the navigation remains visible as stacked links. Once JavaScript runs, the menu control appears and the closed navigation is hidden, non-interactive, and `inert`.
- The control synchronizes its label, `aria-expanded` value, menu class, and inert state. It measures 52.99px by 44px at the 390px test width.
- Escape closes an open menu and returns focus to its button. Following a navigation link closes the menu. A breakpoint change closes the mobile state and restores an active desktop navigation.
- Initialization now cancels prior listeners and rebinds after Astro page loads, preventing duplicate toggles and restoring the enhancement class after persistent-header transitions.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages). At 390px, closed menu links were absent from the accessibility tree; opening exposed all links; Escape returned focus to the collapsed Menu button. Desktop resize restored all links, and a Services-to-About internal transition retained a functional closed mobile menu.

### 14 September 2026 — Step 8: repair landmarks, headings, link names, and current-page feedback

- `PageHero` now emits a styled H1 for its page-level title. Its six uses are all page entry points, so no secondary heading-level variant was needed. The visual rules now target `.page-title`, preserving the existing title scale and spacing.
- Moved the header and footer outside the main landmark. Added a visible-on-focus “Skip to main content” link pointing to a focusable `main#main-content`, with scroll margin for the sticky header.
- Added the missing accessible name to the footer home link. The header home link already had the same name.
- Active page links are marked with `aria-current="page"` and a visible underline/colour treatment that is tokenized for both colour schemes. The persistent header refreshes this state after Astro navigation, including normalized trailing slashes.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages). Local Services and Projects checks show one H1 per index page, H2 content sections, an accessible footer-home name, header/footer outside main, and focus moving to `main-content` through the skip link. After an internal Projects-to-Services transition settles, Services becomes the sole current navigation link.

### 14 September 2026 — Step 9: link homepage services to their details

- Added stable slugs for Work Better, Live Better, Build Better, and Think Better. Each corresponding Services detail section has its matching ID.
- Homepage service titles are now standard links to `/services/#…`, with an underline that communicates their destination and retains the shared keyboard-focus treatment.
- Added `scroll-margin-top: 98px` to service anchors. The shared fragment handler now re-applies hash navigation after Astro transitions so internal and direct fragment URLs land consistently below the sticky header.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages). Generated homepage output includes all four anchor links and Services output includes all four targets. A desktop homepage click and a 390px direct `/services/#work-better` load both reached Work Better with its target positioned 98px below the header.

### 14 September 2026 — Step 11: harden contact submission and browser recovery

- The endpoint now validates actual `FormData` strings, trims required fields, enforces name/email/message limits (200/254/10,000), rejects excessive declared request bodies, and rejects invalid input before verification work.
- Turnstile verification uses the canonical form-encoded request, a ten-second timeout, response-shape and upstream-status checks, and checks both the `contact` action and configured allowed hostnames. `TURNSTILE_HOSTNAMES` is documented in `.env.example`; it must be configured separately for production and preview before release.
- Successful HTML posts redirect with a 303; failed HTML posts now receive a readable response at the true error status. JSON clients receive the same intended status. Stored submissions use UUIDs, avoid collecting IP/user-agent, expire after 90 days, and emit only submission IDs plus operational categories to logs.
- The enhanced form preserves native validation until initialization, sets matching client limits, explicitly recreates its Turnstile widget after Astro navigation, checks response content/status, times out after 15 seconds, resets a consumed challenge on failure, preserves entered text, and moves focus to the success heading after storage. Copy now says “received” only after durable storage and does not promise a reply time that has not been operationally confirmed.
- Added a near-form explanation of the retained fields and 90-day retention. The no-JavaScript state accurately says the challenge requires JavaScript; a public email fallback remains deliberately absent until `hello@datumstudio.xyz` is confirmed as monitored.
- Verification: `npm run check` passed with zero errors, warnings, or hints; `npm run build` passed (12 pages). Real Turnstile, KV, and navigation lifecycle tests are still required in a separately configured preview environment.

### 14 September 2026 — Step 10: contact operations remain blocked on owner decisions

- Repository review still found no notification provider, authenticated owner inbox, delivery-failure record, reconciliation process, or evidence that `hello@datumstudio.xyz` is monitored. These cannot be safely invented from source alone.
- Required direction before the step can be completed: confirm the inquiry owner and response expectation, the monitored fallback mailbox, the notification provider/verified sender identity, where the owner retrieves retained submissions, and the production/preview Turnstile host and KV setup. After that, a controlled preview submission can verify durable storage, notification, retry/reconciliation, and reply handling.

### 14 September 2026 — Step 12: add repeatable release verification

- Added a `parse5`-based generated-output checker. It walks every built HTML page, resolves relative and same-origin links, validates clean routes, `.html` files, local assets, encoded paths, and fragment IDs, and skips external/mail/tel links plus the documented `/api/contact` runtime route.
- The checker reports each source route and bad destination, has a compact fixture suite for valid links, missing routes, missing fragments, nested relative links, assets, and the runtime exception, and is included in `npm run verify` alongside `astro check` and the production build.
- Added a Node 22 GitHub Actions verification workflow using `npm ci`; it runs on pull requests and `main` pushes and never invokes publishing. The README now names `npm run verify` as the recommended Cloudflare build command.
- Verification: `npm run verify` passed: zero Astro diagnostics, 12 built pages, generated link check, and fixture test. Cloudflare’s configured dashboard build command and any deployment gating still need to be confirmed before this is release-enforced there.

### 14 September 2026 — Step 14: align the site documentation with current capability

- README now describes the actual static-rendering plus Pages Function/KV/Turnstile contact architecture, names `npm run verify` as the release check, and documents the deployment-specific `TURNSTILE_HOSTNAMES` setting.
- `INFRASTRUCTURE.md` now points to this repository rather than the obsolete `sites/datum/` path and separates implemented capabilities from planned federation and multi-platform publishing. It explicitly states that builds and previews do not publish.
- The document also distinguishes the implemented 90-day contact storage path from an as-yet unverified monitored inbox/notification/recovery workflow. The private roadmap remains outside this repository and needs a deliberate, separate edit if its priorities are to be changed.

### 14 September 2026 — Step 13: publishing inventory completed; route selection remains a product decision

- `npm run publish:dry-run` was non-mutating and reported two publishable articles, nine drafts, no configured platform credentials, and no would-publish actions. It did not contact a destination or write a publication log.
- Source review found that the generic orchestrator can claim “would publish” based on credentials even when its publisher is a stub; its handwritten frontmatter parser is duplicated by the separate Bluesky/Nostr scripts; generic Nostr can report partial relay failure as `ok`; and documentation incorrectly names `scripts/publish-log.json` while the generic script writes `.publish-log.json` and the Bluesky script writes `.publish-log-atproto.json`.
- No automated publishing route was changed or enabled: choosing manual canonical sharing, Nostr, or Bluesky changes external distribution behaviour and requires an owner decision. The infrastructure document now accurately labels this area as planned/partial rather than release capability. Once one route is selected, the registry, parser, log authority, retry behavior, command documentation, and real publication test can be reconciled around it.

This guide preserves Datum’s typography, earthy palette, drafting details, honest photography, and warm, specific voice. It addresses the broken proof path, unclear positioning, deployed contrast problems, navigation accessibility, contact reliability, verification, and unfinished publishing workflow.

## How to use this guide

Work through the phases in order. Each step identifies the files, the change, and the evidence needed to call it done. File paths below refer to the independent site repository unless a full path is provided.

The primary website repository is [site](/Users/gavin/Projects/Datum%20Workspace/site). The private philosophy and planning repository is [Datum](/Users/gavin/Projects/Datum%20Workspace/Datum). They have separate Git histories; changes to one are not committed by committing the other.

The review found:

| Finding | Evidence | Treatment |
|---|---|---|
| Featured workshop link returns 404 | Live browser and draft filtering in source | Fix immediately |
| Current business stage was ambiguous | Public service copy differed from the previous private experiment-first plan | Resolved in Step 4: commissions are open |
| Dark-mode button and labels are difficult to read | Live computed styles and screenshots | Establish deployed revision before editing CSS |
| Mobile navigation remains exposed when collapsed; Escape does not close it | Live browser, accessibility tree, and source | Fix interaction and visibility together |
| Index-page headings start at H2 | Shared PageHero component | Correct semantics and preserve styling |
| Type-check fails | `npm run check`: readonly social links passed to mutable prop | Small type correction |
| Build succeeds despite that type error | `npm run build` completed | Make both checks required |
| Contact saves to KV but no inbox/notification path was found | Local handler and repository search | Verify external arrangements, then implement missing operational steps |
| Contact live markup differs from local source | Independent browser inspection | Verify the released form before claiming delivery works |
| Several publishing integrations are stubs | Publisher registry | Reduce enabled scope and report unsupported platforms honestly |

The review did not submit a contact form, test actual delivery, run a complete security audit, or measure Core Web Vitals. No horizontal overflow was observed at the inspected 390px and 1280px widths, and the homepage images loaded. Treat untested behaviour as a verification task, not an established failure.

## Phase 1 — Establish a reliable baseline

### 1. Record the working copy and deployed revision

**Purpose:** avoid deploying an older build or accidentally including unrelated work.

1. Open the site repository and inspect its state:

   ```sh
   cd "/Users/gavin/Projects/Datum Workspace/site"
   git status --short
   git branch --show-current
   git rev-parse HEAD
   node --version
   npm --version
   ```

2. At review time, `src/data/site.ts` was modified and `src/content/articles/wled-thread-and-the-right-remote.mdx` was untracked. Inspect the current state; preserve these changes and do not stage them incidentally with the repair work.
3. Use the Node/npm versions allowed by `package.json` and the repository’s Node version file. Keep the lockfile unless dependencies actually change.
4. In the Cloudflare Pages project serving `datumstudio.xyz`, record the production deployment ID, branch, commit, build command, and build output directory. Confirm the custom domain points to that project.
5. Compare the production revision with the local revision. If production does not expose a commit, compare its built stylesheet and contact markup with a fresh local build; mark provenance unresolved until identified.
6. Capture the baseline commands and their results:

   ```sh
   npm run check
   npm run build
   ```

7. Keep a small release note listing the revision, intended changes, preview URL, and checks performed. A successful build alone does not prove that the custom domain serves it.

**Done when:** the local work is understood, the production source is identified, and build/type-check results are recorded separately.

### 2. Fix the existing type error

**File:** [SocialLinks.astro](/Users/gavin/Projects/Datum%20Workspace/site/src/components/SocialLinks.astro)

The component reads its links without mutating them. Its prop should accept a readonly collection.

1. Change the prop declaration from `links: SocialLink[]` to:

   ```ts
   interface Props {
     links: readonly SocialLink[];
     label?: string;
   }
   ```

2. Keep `socialLinks` readonly in `src/data/site.ts`. Do not suppress the error with a cast or loosen it to `any`.
3. Run `npm run check` and `npm run build` again.

**Done when:** both commands succeed, and Bluesky/RSS links still render. This small declaration correction does not need a dedicated unit test.

## Phase 2 — Restore evidence and clarify the offer

### 3. Make the workshop destination real

**Files:** `src/content/projects/workshop.mdx`, `src/pages/index.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`.

1. Read the entire workshop draft. Divide its claims into observed facts, planned interventions, and outcomes still to measure.
2. Rewrite unverified completed-outcome language. For example, if the QR inventory is only proposed, say that it is being tested or planned. Do not describe a completed improvement without evidence.
3. Keep the project status `in-progress`. Publication status and completion status mean different things: a useful unfinished project can be public.
4. Use this structure for the public progress report:

   ```md
   ## Who uses this room
   [Describe the actual user and routines.]

   ## What was getting in the way
   [One concrete recurring frustration and a dated photograph.]

   ## The decision being tested
   [The chosen intervention and why it addresses that frustration.]

   ## What we rejected
   [An alternative and the specific trade-off.]

   ## What has changed so far
   [Observed changes only; include limitations.]

   ## What comes next
   [The next test and what would count as success.]
   ```

5. Use photographs of the actual work with accurate captions. If comparing before and after, use comparable views and dates. A sketch is useful if clearly labelled as a proposal.
6. Once the factual edit is ready, set `draft: false`. Set publication/update dates truthfully using fields supported by the content schema.
7. Retain draft filtering in the collection queries. Removing that filter would expose unrelated unfinished content.
8. Build, confirm `dist/projects/workshop/index.html` exists, and follow both homepage links to it.
9. Confirm the Projects index includes the workshop and the page identifies it as in progress.

**If the draft is not ready:** keep it unpublished, replace both homepage links with a non-interactive progress statement, and change the empty Projects page to explain what is being developed. Do not point “View case study” at a missing route or quietly redirect it to the homepage.

**Done when:** every advertised workshop destination resolves, and the page’s claims match the actual state of the work.

### 4. Confirm the truthful positioning branch

**Decision recorded 14 September 2026:** Datum is accepting commissions. The home renovation is an ongoing personal project alongside client work. The private direction is [What I’m Doing Now](/Users/gavin/Projects/Datum%20Workspace/Datum/knowledge/10-philosophy/13-business/13.03-what_im_doing_now.md).

**Public files:** `src/pages/index.astro`, `src/data/site.ts`, `src/data/services.ts`, `src/layouts/Layout.astro`, `src/pages/about/index.astro`, `src/pages/services/index.astro`, `src/components/CallToAction.astro`.

1. Keep the first action consistent: visitors start a conversation about their space, routine, or problem. Do not substitute an unpublished workshop as the primary proof path.
2. Describe work as individually scoped and priced. Do not add fixed packages, fees, availability, or turnaround promises until they are decided.
3. Keep the service area truthful: Golden Horseshoe, GTA, Muskoka, and remote enquiries, with the need for a site visit determined by scope.
4. Present the workshop in first person as Gavin’s personal renovation. Use studio voice for client services; do not imply a larger team or present personal work as a commission.
5. Keep proposed workshop systems and outcomes distinct from observed results. The workshop may support the studio’s story, but it is not a prerequisite for client work.
6. Keep RSS and Bluesky as the available follow options. Do not introduce email subscriptions until a subscription system exists.
7. On each public-copy change, review title, description, social preview, and structured data with the visible page. Ask a reader to identify what Datum does now and what they can do next.

**Done when:** public copy, primary action, service promises, and private direction agree.

### 5. Shorten the homepage and make the work carry the philosophy

**File:** `src/pages/index.astro`, with supporting styles in `src/styles/global.css`.

1. Reorder the page around this sequence:

   1. Clear current purpose and primary action.
   2. Featured workshop progress and a working link.
   3. One annotated design decision with an observed result or explicit hypothesis.
   4. A short explanation of Datum’s reference-point philosophy.
   5. Relevant areas of work or available services.
   6. A next step appropriate to the chosen positioning.

2. Merge the five values and five promises into one short supporting passage. Keep fuller explanations on About or Process where useful.
3. Keep the existing imagery and visual language. Repetition, rather than the identity, is the main issue.
4. On mobile, revisit the hero’s `min-height: calc(100svh - 70px)` and large spacing. Let content determine height where the forced height delays the first piece of evidence.
5. Keep enough spacing for legibility; do not solve length by shrinking body text.
6. Check the page at 390px and 1280px, in both colour schemes, once the complete edit is ready. Fix findings together, then perform one confirmation pass.

**Done when:** a visitor reaches concrete work after the opening, every major section adds new information, and the next action remains obvious.

## Phase 3 — Correct presentation and navigation

### 6. Resolve live dark-mode contrast and source drift

**Files:** `src/styles/global.css`, `src/styles/tokens.css`, and the deployment record from step 1.

1. Confirm which stylesheet the live page actually loads. The review measured dark CTA text against a dark moss button, while local CSS already includes a light-text override.
2. Inspect the existing `.button-primary`, `.eyebrow`, and `.section-kicker` dark-mode rules before adding anything.
3. Compare computed foreground/background colours in the local build, deployment preview, and custom domain. Check cascade overrides if the same source produces different styles.
4. Preserve the existing light text on dark buttons. If consolidating tokens, create separate semantic tokens for button text and label text; do not globally change moss when only foreground contrast needs correcting.
5. Check normal, hover, focus, disabled, and sending states, including text over images or translucent layers.
6. Use at least 4.5:1 for normal-size text and 3:1 for qualifying large text; do not round a failing ratio up. The governing definitions are in [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
7. Verify footer text and wordmark in both schemes. Keep already-working corrections instead of duplicating them.
8. If preview is correct but production differs, resolve the deployment/domain/cache discrepancy before another CSS patch. Avoid broad cache purges without identifying the stale response.

**Done when:** the production site serves the intended styles, small labels and primary actions are readable in both themes, and evidence is recorded for each checked state.

### 7. Make the mobile menu fully operable

**Files:** `src/layouts/Layout.astro`, `src/styles/global.css`.

1. Keep a native button with `aria-controls="primary-nav"` and synchronized `aria-expanded`.
2. Increase its hit area to a practical minimum of 44px high and 44px wide. This is the design target for this repair, not a claim that every smaller target automatically fails WCAG.
3. Replace opacity/transform-only hiding. A closed mobile menu must not expose interactive links to keyboard or assistive-technology users.
4. Use an explicit open/closed state. Synchronize the class, expanded attribute, visible button label, and the navigation’s `inert` state. On desktop the navigation must always be non-inert and visible. The [inert attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) removes descendant interaction and accessibility exposure.
5. Move focus out of the menu before making it inert. Escape should close an open mobile menu and return focus to its button. Do not trap focus: this is a navigation disclosure, not a modal dialog.
6. Close it after following a navigation link. Handle resizing across the 800px breakpoint so desktop links never inherit a mobile-only inactive state.
7. Provide a usable no-JavaScript navigation fallback, for example visible stacked links until JavaScript enhancement is ready. Do not ship hidden links that require a failed script to become accessible.
8. Account for the persistent header and Astro navigation lifecycle. Either keep `ClientRouter` and make initialization idempotent, including cleanup of listeners, or deliberately remove client routing and header persistence for ordinary document navigation. Do not remove it without checking other components that depend on it. Astro describes script re-execution and `astro:page-load` in its [view-transitions documentation](https://docs.astro.build/en/guides/view-transitions/).
9. Respect the existing reduced-motion rules.

**Manual acceptance sequence:** start at 390px; Tab through the closed header; open the menu; Tab through links; press Escape; confirm focus returns; reopen and follow a link; navigate back; resize above 800px; repeat after an internal page transition. Closed links must not appear as reachable controls, and the menu must not toggle twice from duplicate listeners.

### 8. Repair headings, link names, and current-page feedback

**Files:** `src/components/PageHero.astro`, `src/layouts/Layout.astro`, `src/styles/global.css`.

1. Check every use of `PageHero`. It currently emits `h2` even when it supplies the page’s main title.
2. Make it emit `h1` on page-level uses. If a real secondary use exists, add an explicit heading-level prop instead of forcing all uses to H1.
3. Update relevant selectors, including `.section-heading h2` and mobile rules, so changing semantics preserves visual size and spacing. Prefer a component class over heading-level-dependent styling for this title.
4. Confirm each page has a clear H1; use H2 for its major sections and H3 for their subsections. Article cards can remain H2 below the index H1.
5. Give the footer logo link `aria-label="Datum Studio home"`. The wordmark’s visual contents are hidden from assistive technology, so the link otherwise lacks a usable name.
6. Add `aria-current="page"` to the active navigation destination and a visible state that works in both themes. Normalize trailing slashes when matching paths.
7. With a persistent header, refresh current-page state after navigation; a value calculated only on the initial server render can become stale.
8. Add a skip link to the main content, and ensure the site header/footer are outside the main-content landmark. Verify focus is visibly placed at the destination.
9. Give keyboard focus a clear outline and ensure sticky navigation does not cover focused headings or anchor destinations.

**Done when:** heading order is coherent, the footer home link has a name, current-page state updates, and keyboard users can bypass repeated navigation.

### 9. Link service summaries to their details

**Files:** `src/data/services.ts`, `src/pages/index.astro`, `src/pages/services/index.astro`, `src/styles/global.css`.

1. Add stable slugs to the four service entries: `work-better`, `live-better`, `build-better`, and `think-better`.
2. Give each detail section its slug:

   ```astro
   <section id={service.slug} class="service-detail section-pad">
   ```

3. Link each homepage service title to its section:

   ```astro
   <h3><a href={`/services/#${service.slug}`}>{service.title}</a></h3>
   ```

4. Add suitable `scroll-margin-top` to anchor targets so the header does not obscure the heading.
5. Use visible link/focus styling. Do not make a whole row clickable through a JavaScript click handler when a normal link works.
6. If step 4 chose experiment-first positioning, adjust labels to areas of practice and keep destinations consistent with that framing.

**Done when:** every homepage service link arrives at the matching section on desktop, mobile, and direct page load.

## Phase 4 — Make contact reliable from submission to reply

### 10. Define who receives and handles messages

**Files:** `functions/api/contact.ts`, `src/components/ContactForm.astro`, `src/pages/thank-you.astro`, `.env.example`, and an operational note in `docs/`.

1. Verify whether an external notification or inbox process already exists. Repository absence is not proof that no one receives messages today.
2. Confirm `hello@datumstudio.xyz` is a monitored mailbox before displaying it as a fallback.
3. Assign an owner for inquiries and confirm whether two business days is a realistic response promise.
4. Keep storage before notification. A successful submission means the message was durably accepted, not necessarily that an email was delivered immediately.
5. If no workflow exists, implement a server-side notification to the monitored mailbox and an authenticated way for the owner to retrieve stored messages. Keep storage as the recovery source if notification fails.
6. Record notification state and failures. Provide a retry/reconciliation process with a stable submission ID so repeated delivery attempts can be recognized. Do not rely solely on an untracked background request.
7. Use a verified sender identity for notifications; put the validated visitor address in Reply-To. Never use visitor input as an unrestricted sender or mail header.
8. Configure the chosen provider through server-side secrets. Select its exact API and bindings at implementation time; this guide does not assume an email provider is already installed or configured.
9. Document where messages are read, how failed notifications are noticed, and how replies are tracked. Avoid creating a public route that lists inquiries.
10. Explain the actual storage and use of contact data near the form or in a linked notice. Review whether storing IP/user-agent after verification is necessary; retain only operationally useful data. Keep the stated retention period consistent with the handler’s configured expiration.

**Done when:** an accepted test message is retrievable by its owner, notification failures are visible and recoverable, and the owner can reply through the documented process.

### 11. Harden the endpoint and browser states

**Endpoint: `functions/api/contact.ts`**

1. Validate FormData types instead of asserting every value is a string. Trim name/email/message and reject whitespace-only required values.
2. Adopt explicit field limits and enforce them in both client and server. Suggested initial limits are 200 characters for name, 254 for email, and 10,000 for message; these are product choices to confirm, not existing project requirements.
3. Reject malformed submissions before Turnstile/network work. Enforce an appropriate request-body limit before full parsing if the platform/implementation supports it; field limits alone do not bound multipart parsing cost.
4. Keep Turnstile server-side validation. Distinguish a failed challenge from a verification-service outage. Treat unsuccessful upstream HTTP responses and malformed responses as controlled failures.
5. Correct the response helper. For JSON requests, return a JSON body with the intended HTTP status. For successful HTML posts, return a 303 redirect to `/thank-you/`. For failed HTML posts, return a readable error response with the actual error status. `Response.redirect(..., 400)` is invalid and currently throws.
6. Do not blindly retry a consumed challenge token. Turnstile tokens expire after five minutes and are single-use; reset the widget when a fresh token is needed. See [server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
7. Use a stable generated submission ID. If implementing duplicate-request protection, use a storage primitive capable of enforcing uniqueness; do not assume a KV read-then-write sequence is atomic.
8. Log a submission ID and operational failure category without logging the full message or secrets by default.
9. Return understandable recovery instructions, not raw exceptions.

**Browser: `src/components/ContactForm.astro`**

1. Preserve explicit `action="/api/contact"` and `method="post"`.
2. Keep native required/email validation available until enhancement initializes. One approach is to remove markup-level `novalidate` and enable `form.noValidate = true` only after the custom handler is attached.
3. Initialize handlers when the form is present after internal navigation, not only on the first document load. Prevent duplicate listeners. Verify Turnstile’s widget lifecycle through navigation away and back.
4. Handle missing/expired verification with a clear message and fresh challenge. Do not tell visitors to resubmit indefinitely with the same token.
5. Check HTTP status and expected JSON shape before treating a response as success. Handle non-JSON server responses with a controlled message.
6. Add a reasonable request timeout and restore the submit button on failure. A timed-out browser request can still have reached the server; use the submission ID/idempotency design if automatically retrying.
7. Preserve entered text when an attempt fails. Keep the status region outside any container hidden on success, or move focus to an accessible success heading so confirmation is announced.
8. Offer the verified email fallback next to the form. With JavaScript disabled, Turnstile cannot complete; provide a `noscript` explanation and email option. Do not bypass challenge verification to make the form appear to support this case.
9. Keep confirmation copy accurate: “received” after storage, and only promise a reply time supported by the operational workflow.

**Environment checks:** confirm the production and preview `SUBMISSIONS` bindings, the secret used by each environment, and the public widget’s allowed hosts. Use separate preview resources for test inquiries. Pages exposes these resources through [Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/).

**Acceptance cases:** valid submission; missing field; whitespace-only value; invalid email; oversized input; missing/expired challenge; verification outage; storage failure; notification failure after successful storage; non-JSON server error; interrupted connection; repeated submit; direct homepage load; navigation to contact from another page; navigation away/back; keyboard/screen-reader confirmation; JavaScript-disabled email fallback.

Use mocked dependencies for endpoint failure tests and a controlled preview for the real integration check. Do not weaken production verification for testing. A successful notification test is necessary before declaring delivery complete.

## Phase 5 — Prevent recurrence and reduce maintenance

### 12. Make verification part of every release

**Files to add/update:** `scripts/check-site-links.mjs`, `package.json`, the chosen CI configuration, and a short release checklist.

1. Implement a generated-output link check with an HTML parser. Walk HTML files under `dist/`; extract internal page links; resolve relative paths against each page’s URL; map clean routes to their generated HTML files.
2. Handle same-origin absolute URLs, trailing slashes, query strings, URL-encoded paths, `.html`, and fragments. Verify fragment IDs on HTML targets. Check other local asset targets as files rather than trying to parse them as HTML.
3. Skip `mailto:`, `tel:`, external origins, and documented runtime routes such as the contact endpoint. Do not exempt all `/projects/` links or all missing paths.
4. Report the source page and broken destination, and exit nonzero on failures. The workshop link should fail this check when advertised but not generated.
5. Check a small fixture set containing valid links, a missing route, a missing fragment, relative nesting, and a runtime exception. This tests the checker’s behaviour, not a duplicate of its implementation.
6. Add scripts such as:

   ```json
   {
     "check:links": "node scripts/check-site-links.mjs",
     "verify": "npm run check && npm run build && npm run check:links"
   }
   ```

7. Only add `check:links` after its implementation exists. In a clean CI checkout, install from the lockfile with `npm ci`, then run `npm run verify`.
8. Make failure block the release path. If Cloudflare builds independently of CI, ensure its build command also runs the verification sequence or that the deployment workflow explicitly depends on the passing checks.
9. Add focused behavioural checks for the mobile menu and contact error handling. Do not build a large screenshot suite for unchanged decorative details.
10. Expand type-check coverage to publishing scripts/libraries with a suitable separate configuration if they become release-critical. The current TypeScript include list names `src` and `functions`; a green Astro check should not be assumed to validate every standalone script.
11. Keep builds free of social posting. Preview deployments must never announce unfinished content automatically.

**Done when:** a broken promoted link or the existing readonly-prop error causes a failed release check, while runtime endpoints are correctly recognized.

### 13. Reduce publishing to one dependable route

**Files:** `lib/platform-config.ts`, `lib/publish-stub.ts`, `scripts/orchestrate-publish.ts`, `scripts/publish-to-atproto.ts`, `README-publishing.md`.

1. Inventory each integration as working, partial, stub, or external. Credentials being present does not mean the integration is implemented.
2. Enable one distribution route that you intend to maintain. Manual sharing of a canonical site URL is a valid first workflow.
3. If choosing the separate Bluesky script, verify its actual content coverage: it currently models articles and notes, not workshop projects. Share the workshop manually or deliberately extend that coverage; do not assume the generic orchestrator’s AT Protocol stub will publish it.
4. Add explicit implementation capability to the platform registry. A dry run must report unsupported platforms as unsupported, not “would publish” solely because credentials exist.
5. Replace the handwritten frontmatter parser with a shared, established YAML/frontmatter parser before expanding automation. Validate parsed data and fail closed on malformed draft metadata so unfinished content cannot be treated as publishable accidentally.
6. Ensure dry runs do not post or mutate publication logs. Show the exact target platform, canonical URL, selected content, and reason for each skip.
7. Correct the Nostr success calculation: the current publisher reports `ok: true` after relay failures. Represent complete success, partial success, and failure explicitly; define the required acknowledgement policy before marking an item complete.
8. Track retryable outcomes per destination. Reuse stable identifiers where the destination permits it. Do not retry already-successful destinations blindly, and do not permanently skip failures because a partial result was logged as success.
9. Choose one publication-log authority for each workflow. The generic orchestrator currently writes `.publish-log.json` at the site root, while the publishing README describes a different local path; reconcile the documentation with the actual implementation. Document backup/recovery before moving execution to another machine.
10. Correct command descriptions: the current `publish:all` script invokes the orchestrator and does not itself build, despite the README description. Either implement the promised validation/build sequence or describe the real behaviour. Prefer an explicit verified release step before distribution.
11. Defer other social/federation integrations until the chosen route reliably publishes, records its result, and avoids duplicate posts.

**Done when:** supported capability, dry-run output, real outcomes, logs, and documentation all agree.

### 14. Align the roadmap and documentation with reality

**Files:** site `README.md`, `README-publishing.md`, `INFRASTRUCTURE.md`, and the private [roadmap](/Users/gavin/Projects/Datum%20Workspace/Datum/knowledge/30-Planning/31-Roadmap/31.00.00%20Roadmap.md).

1. Correct the README’s “no database or API dependency” description: rendering is static, but contact uses a Pages Function, Turnstile, and KV; publishing has additional dependencies.
2. Correct the infrastructure document’s old `sites/datum/` project path and separate implemented architecture from planned architecture.
3. Record operational completion separately from implementation. “Contact handler exists” and “a real inquiry reaches a monitored inbox” are different milestones.
4. Limit active work to the public workshop account, site reliability, and one distribution path. Move unfinished multi-platform integrations to a later queue instead of presenting all of them as concurrent priorities.
5. Use a small recurring content unit: one observed problem, one decision, one photo, and one result or next test. Measure actual change when practical, such as retrieval time or cleared floor area; never invent a metric for a stronger story.
6. Track phase-appropriate outcomes. Experiment-first: useful updates, actual learning, reader responses. Commission-ready: qualified conversations and successful engagements. Avoid treating publication count alone as progress.
7. When updating agent instructions later, correct the stale “all articles are drafts” statement in `Datum/AGENTS.md`; the review found two published articles. Make that a deliberate documentation edit in its own repository.

**Done when:** the roadmap reflects a short executable sequence and the docs distinguish current capability from intention.

## Phase 6 — Preview, release, and confirm

### 15. Release in three reviewable batches

| Batch | Changes | Completion evidence |
|---|---|---|
| A: correctness | Type fix, workshop route, dark-mode revision reconciliation, headings/menu | Passing checks and working preview paths |
| B: message and journey | Chosen positioning, shorter homepage, direct service links, accurate content | Reader understands current stage and reaches proof |
| C: operations | Contact delivery/recovery, release checks, publishing scope, docs | Preview integration tests and documented handling process |

1. Build each batch from an identified revision and run its relevant checks. Review the diff for unrelated local edits before committing.
2. Use a Pages preview deployment for the release candidate. Confirm preview resource isolation and whether the preview is publicly accessible before placing unpublished material there; see [preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/).
3. Inspect these routes: homepage, Services, Projects, Workshop when published, Articles, an article detail, About, Process, and a deliberately missing URL.
4. Check desktop/mobile, both themes, keyboard navigation, menu Escape, direct anchors, browser back, internal navigation to contact, form failure recovery, and successful preview delivery.
5. Compare metadata and visible positioning. Check the social preview image actually represents the linked page; avoid adding new metadata systems before fixing existing content.
6. Record the production deployment currently serving the site before release so the previous version is identifiable if rollback is needed.
7. Deploy through the project’s established release path only after the reviewed changes and checks are ready. This guide does not execute a deployment.
8. Verify the custom domain after release, not only the preview. Confirm the new revision, working workshop path, computed dark-mode colours, mobile menu behaviour, and intended contact markup.
9. Arrange a clearly identified production test inquiry with the owner when ready to test real delivery. Verify storage, notification, and reply handling; remove test records according to the documented process.
10. If a material regression appears, restore the known previous deployment through the established Pages workflow and record what failed. Recheck the public domain after restoration.

### Final completion checklist

- [x] The promoted workshop route works, or the unavailable promise has been removed. (Local fallback verified; production pending.)
- [ ] Workshop claims distinguish actual progress from plans.
- [x] Datum’s current stage is explicit and consistent across the reviewed public/private documents. (Local source audit complete; release verification pending.)
- [x] Concrete work appears early on the homepage. (Local build and desktop/mobile review complete; production pending.)
- [ ] Production dark-mode text and actions are readable.
- [x] Mobile navigation supports keyboard use, Escape, resizing, and repeated navigation. (Local verification complete; production pending.)
- [x] Page headings, footer link naming, skip navigation, and current-page state are correct. (Local verification complete; production pending.)
- [x] Service summaries lead directly to their details. (Local verification complete; production pending.)
- [ ] Contact success means stored acceptance; notifications and recovery are verified.
- [ ] Failed form attempts preserve text and explain the next step.
- [ ] The email fallback is monitored and visible.
- [ ] Type-check, build, generated links, and focused behavioural checks pass.
- [ ] Release checks block failures without triggering social publishing.
- [ ] Unsupported publishing integrations are visibly disabled or deferred.
- [ ] Publishing outcomes and logs support safe, explicit retries.
- [ ] Documentation matches the deployed architecture and available commands.
- [ ] The released revision and post-release checks are recorded.

Completion means these outcomes are verified. Writing the guide, passing the static build, or deploying a preview alone does not complete the repairs.
