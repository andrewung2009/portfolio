---
name: Andrew Ung Wei En — Portfolio
description: A field-notebook portfolio of practical tools, documented as case studies.
colors:
  signal-blue: "#2563eb"
  signal-blue-deep: "#1d4ed8"
  signal-blue-wash: "#eef4ff"
  lagoon-cyan: "#0891b2"
  ochre-amber: "#c2760a"
  ultraviolet: "#7c3aed"
  ledger-green: "#047857"
  caution-amber: "#b45309"
  alert-red: "#b91c1c"
  paper: "#ffffff"
  cool-paper: "#f6f8fb"
  panel-mist: "#f1f4f9"
  panel-deep: "#e8eef7"
  ink: "#0b1220"
  slate-ink: "#1e293b"
  faded-ink: "#526071"
  ghost-ink: "#7b8798"
  hairline: "#e2e8f0"
  hairline-strong: "#cbd5e1"
  night-paper: "#0b1120"
  night-panel: "#111c33"
  night-panel-raised: "#16223b"
  night-ink: "#f8fafc"
  night-ink-muted: "#a9b4c7"
  night-hairline: "#24324d"
  night-signal-blue: "#60a5fa"
  night-signal-blue-deep: "#93c5fd"
  night-on-signal: "#08111f"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(58px, 10.5vw, 116px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(34px, 5vw, 58px)"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(21px, 2.4vw, 27px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  xs: "8px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
  xl: "36px"
  section: "clamp(72px, 9vw, 120px)"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 22px"
    height: "48px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 22px"
    height: "48px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 22px"
    height: "48px"
    typography: "{typography.label}"
  nav-link:
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.xs}"
    padding: "0 12px"
    height: "36px"
  nav-cta:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "9px"
    padding: "0 14px"
    height: "38px"
  filter-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  filter-chip-active:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  tag:
    backgroundColor: "{colors.panel-mist}"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  project-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  input-console:
    backgroundColor: "{colors.panel-mist}"
    textColor: "{colors.ink}"
    rounded: "2px"
    padding: "9px 11px"
    height: "38px"
---

# Design System: Andrew Ung Wei En — Portfolio

## Overview

**Creative North Star: "The Field Notebook"**

The site reads like a well-kept engineering notebook left open on a desk: cool paper, navy ink, one blue pen, and annotations in the margin. Every page is a dated record of work rather than a pitch. The hero lays the name out at poster scale over a faint blueprint grid; the build log runs down a ruled spine with sticky years; project cards are category-tinted plates with each uploaded artefact mounted on them as a print. Nothing is illustrated for its own sake. The grid, the rule and the index number do the decorating.

The voice of the interface matches the voice of the writing: plain, specific, quietly confident. Inter carries every headline and paragraph at editorial sizes, with negative tracking that makes large type feel drawn rather than set. JetBrains Mono appears only where a record-keeping device would put it: entry indices, counts, dates, category labels, small metadata. The result should feel precise and slightly technical without ever becoming a dashboard.

Density is generous but not luxurious. Sections breathe at 72–120px, two-column splits are deliberately asymmetric, and prose is held to 46–68 characters per line. Depth comes from tonal panels and one-pixel hairlines; shadows are reserved for contact (hover), overlays and the sticky nav. Motion is a short lift, an arrow nudge, a marquee that pauses when read. The work is the evidence; the interface stays out of its way.

**Key Characteristics:**
- Cool paper and navy ink, with a single Signal Blue accent at roughly 10% of any screen.
- Asymmetric editorial grids: 1.3/0.7 hero, 1.18/0.62 about, ruled three-track build log.
- One-pixel hairlines and pale tonal panels instead of borders, cards-on-cards or heavy chrome.
- Inter for reading, JetBrains Mono for annotation; no second display face.
- Category colour (cyan, amber, violet) reserved for discipline coding, never for mood.
- Flat at rest, lifted on contact; no decorative shadows.

## Colors

A cool, high-contrast paper palette: white and misted blue-greys under navy ink, with a single saturated blue carrying every action and identity cue.

### Primary
- **Signal Blue** (#2563eb): The one true accent. Primary buttons, active filter chips, link accents, kicker dashes, focus rings, the timeline spine node, and the "Wei En" accent word in the hero name. It marks action and authorship.
- **Deep Signal** (#1d4ed8): The text-safe accent. Hover state for primary buttons and the colour of accent text on light paper, where Signal Blue would vibrate.
- **Blue Wash** (#eef4ff): The accent's tint. Ghost-button hover fills, active case-study nav pills, skill-icon tiles and the cool half of gradient panels.

### Secondary
- **Lagoon Cyan** (#0891b2): Category colour for web projects. Appears only as a dot, a cover-field tint and a ghost index numeral.
- **Ochre Amber** (#c2760a): Category colour for hardware projects.
- **Ultraviolet** (#7c3aed): Category colour for AI projects. Also supplies the second, cooler wash in the brand-mark gradient and the page's ambient background.

### Tertiary
- **Ledger Green** (#047857): Success and availability. The status dot in the nav, portrait label and contact plaque.
- **Caution Amber** (#b45309): Warning states in the editor.
- **Alert Red** (#b91c1c): Danger, destructive actions and error text in the editor.

### Neutral
- **Paper** (#ffffff): The page and card ground in light theme.
- **Cool Paper** (#f6f8fb): Section tint behind the marquee and footer; the scrollbar track.
- **Panel Mist** (#f1f4f9): Resting tonal panel. Skill-tag fill, nav-link hover, case-study meta strip.
- **Panel Deep** (#e8eef7): The deeper tonal step in portrait and cover gradients.
- **Ink** (#0b1220): Headlines and primary body text in light theme.
- **Slate Ink** (#1e293b): Secondary body text and dense metadata values.
- **Faded Ink** (#526071): Default paragraph and supporting copy colour; nav links and labels.
- **Ghost Ink** (#7b8798): Placeholders, dividers-as-dots and the quietest metadata.
- **Hairline** (#e2e8f0): Every 1px border and rule in light theme.
- **Hairline Strong** (#cbd5e1): Borders that need to hold a button or input shape; scrollbar thumb.

### Night Theme
The dark theme is the same notebook after dark, not a second identity. Paper becomes **Night Paper** (#0b1120), cards lift to **Night Panel** (#111c33) and **Night Panel Raised** (#16223b), ink inverts to **Night Ink** (#f8fafc), and Signal Blue brightens to **Night Signal Blue** (#60a5fa) with **Night Signal Blue Deep** (#93c5fd) for text. Borders drop to **Night Hairline** (#24324d). On-accent text flips to **Night On Signal** (#08111f) so blue buttons stay legible. Category hues lighten in step: cyan to #22d3ee, amber to #fbbf24, violet to #a78bfa.

### Named Rules
**The One Voice Rule.** Signal Blue is the only colour allowed to mean "do this". Keep it under roughly 10% of any screen; its rarity is what makes it read as authorship.

**The Discipline, Not Decoration Rule.** Cyan, amber and violet encode project category. Never use them for generic emphasis, hover states, or section variety. The App category reuses Signal Blue.

**The Paper-First Rule.** Every colour decision must survive both themes with the same hierarchy. Never introduce a colour that only works on white or only on navy.

## Typography

**Display Font:** Inter (with -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif)
**Body Font:** Inter (same stack)
**Label/Mono Font:** JetBrains Mono (with SFMono-Regular, Consolas, monospace)

**Character:** One humanist-geometric sans does all the reading, so the page feels authored rather than assembled. Large sizes carry tight negative tracking and heavy weights; body copy opens back up to normal spacing. Mono is the annotation hand: small, uppercase, letter-spaced, never used for sentences.

### Hierarchy
- **Display** (800, clamp(58px, 10.5vw, 116px), 0.98, -0.055em): The hero name only. It should occupy the first viewport and wrap deliberately across two lines, with the accent word in Signal Blue.
- **Headline** (750, clamp(34px, 5vw, 58px), 1.05, -0.035em): Section headings and case-study titles. The contact headline may reach clamp(34px, 5.4vw, 62px); case titles reach clamp(44px, 7.5vw, 82px) at 800 weight.
- **Title** (700, clamp(21px, 2.4vw, 27px), 1.2, -0.025em): Project card titles, journey steps and other in-card headings.
- **Body** (400, 16.5px, 1.65): Default reading size. Long-form case prose steps to 1.75–1.78 with a 64–68ch measure; card summaries sit at 15px/1.65 and 54ch.
- **Label** (600, 11–13px, 0.01em): Kickers, filter chips, buttons and metadata keys. Uppercase is reserved for the mono micro-label, not Inter labels.
- **Mono** (400-500, 11px, 0.06-0.08em, uppercase): Entry indices, counts, years, category names and timestamps. JetBrains Mono never appears above label scale in the public site. The public site holds the 11px floor; the admin console keeps its own 8-9px sub-dialect.

### Named Rules
**The One Family Rule.** Inter sets every sentence and every headline. Do not introduce a serif, a geometric display face, or a second sans to create contrast; create it with weight, size and tracking.

**The Tight Headline Rule.** Anything at 34px or larger takes negative tracking between -0.025em and -0.06em. Body copy never takes negative tracking.

**The Annotation Rule.** Mono is a record-keeping device, not a style. If a string is not an index, count, date, category or technical tag, set it in Inter.

## Layout

The page is an editorial column, not a dashboard. A single `.container` caps at **1180px** with a fluid gutter of `clamp(20px, 4vw, 44px)`; sections use `clamp(72px, 9vw, 120px)` of vertical padding. The nav is fixed at **72px** (64px under 620px), and every section carries a scroll offset of nav height plus 16px.

Layout is built from two-column asymmetric splits. The hero is `1.3fr / 0.7fr` ending on the baseline, with the portrait right-aligned at a 380px cap. Section headers are `1fr / 0.72fr`, headline left and supporting paragraph right. The about block is `1.18fr / 0.62fr`; the portrait plaque intentionally overhangs the frame by 24px. Work shows four curated case studies: one featured card spanning the full width and splitting internally `1.05fr / 0.95fr` into cover and body, then three secondary cards on a three-column 20px grid (one column under 860px). The build log beneath it is the complete index of every project.

Each section opens on a **ledger line** - a full-width hairline carrying the section's name at the left and one piece of real metadata at the right (location, "4 of 12 case studies", the year span). It replaces the stacked kicker and gives the page its running-head rhythm.

The build log is the signature spatial device: a three-track grid of year (`clamp(110px, 12vw, 150px)`), spine (44px) and entries. Year labels stick 26px below the nav while their entries scroll past; a 1px rule runs the full height with a 13px ringed node at each year and an 8px blue terminal dot at the end. Entries stack at 10px gap inside each year.

Case studies switch to a reading layout: a 21:9 cover, a four-cell metadata strip, a 54px sticky section nav, then a two-column body of a 120–210px sticky label rail and a content column. Prose is capped at 68ch; bullets and cards split into two columns, features into three.

Breakpoints are **1080px** (collapse nav links into the sheet, skills to 2 columns), **860px** (single-column sections, featured card un-splits, timeline drops the year track to a 32px spine, case rail becomes static), and **620px** (nav 64px, gutter 18px, 16px body, one-column everything, full-width hero buttons, all interactive targets at least 44px).

Density is comfortable-editorial: 24px card padding, 20px grid gaps, 12px small-card gaps. Nothing is tighter than a 10px gap except inline metadata.

## Elevation & Depth

This is a **flat-by-default** system. At rest, surfaces are separated by a 1px hairline and a tonal step, not by shadow. Depth appears in three situations only: contact (a card lifting 2–4px on hover), overlay (sticky nav and the portrait plaque), and the page's ambient light. The body carries two fixed radial washes — Signal Blue at 9% in the top-right, Ultraviolet at 5% at mid-left — which give the paper a faintly lit quality without becoming a gradient hero.

### Shadow Vocabulary
- **Resting hairline** (`box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05)`): Timeline entries at rest and the scrolled nav. Barely visible; it keeps a white card from dissolving into white paper.
- **Contact lift** (`box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08)`): Hover state for project cards, skill tiles and timeline entries; the portrait frame and plaque at rest. Paired with `translateY(-2px)` to `-4px`.
- **Overlay depth** (`box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12)`): Dialogs and menus in the editor; not used on the public page at rest.
- **Accent glow** (`box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 22%, transparent)`): Primary buttons only, so the one action colour appears to emit light.
- **Category glow** (`box-shadow: 0 10px 24px color-mix(in srgb, var(--cat) 18%, transparent)`): The centred icon tile on a project cover plate.

In night theme the same roles darken to `rgba(0,0,0,0.25)`, `0.35` and `0.45`; the hierarchy of softness stays identical.

### Named Rules
**The Lift-On-Contact Rule.** A surface may move only when the pointer or keyboard is on it. No card floats at rest, and no shadow is used to fill empty space.

**The Hairline First Rule.** When two surfaces need separating, try a 1px line and a tonal step before a shadow. If a shadow is doing structural work, the layout is wrong.

## Shapes

The form language is **soft-cornered rectangles with technical detailing**. Cards and containers use a 16px radius; large panels (portrait frame, about note, contact panel, case cover) use 24px; small entries, buttons and case cards use 10px; nav links and the skip link use 8px. Pills (999px) are reserved for filter chips, tags, status labels and the portrait label. Perfect circles are reserved for icon buttons, theme toggle, project arrows, timeline nodes and category dots.

Borders are always 1px. There are no 2px outlines except focus rings, and no heavy strokes or drop-cap rules. Geometry supplies the personality: a faint square grid (80px in the hero, 44px inside cover plates and the portrait), a single concentric circle behind the cover icon, and oversized ghost numerals in the lower-right of each project plate. The kicker dash is a 22px × 2px rounded bar; the eyebrow dash is 26px. The logo mark is a 38px rounded square (11px radius) carrying a 135-degree Signal Blue → Ultraviolet gradient.

The editor is a deliberate sub-dialect: same palette, but a **2px radius**, mono uppercase 8–9px labels, 40px controls and panel-first composition. That hardness is the console's identity; it should not leak into the public site.

### Named Rules
**The Pills-Are-Labels Rule.** Full-round shapes only mark a label or a filter. Primary buttons, cards and inputs are never pills.

**The Two-Radius Rule.** A surface uses one radius, not nested radii. If a card is 16px, its cover and inner blocks clip to the card, they do not add their own.

## Components

### Buttons
Tactile but restrained: a 48px minimum height, 10px corners, Inter 600 at 14px, and a short 0.2s state transition.
- **Primary:** Signal Blue fill, white text, 1px matching border, 0–22px horizontal padding, accent glow. Hover deepens to Deep Signal and lifts 1px. Active scales to 0.98.
- **Ghost:** Paper fill, Hairline Strong border, Ink text. Hover swaps the border to Signal Blue, the text to Deep Signal and the fill to Blue Wash.
- **Text:** No box; 4px bottom border in Hairline Strong, 0 radius. Hover moves the border and text to accent. Used for tertiary actions such as "View all work".
- **Icon behaviour:** Trailing 16px SVG arrows nudge `translate(2px, -2px)` on hover; never spin or bounce.

### Navigation
A fixed, translucent bar: `color-mix(bg 82%, transparent)` with a 16px backdrop blur, gaining a Hairline bottom border and resting shadow once scrolled. Height 72px (64px mobile). Brand is a 38px gradient mark plus a two-line lockup (13.5px/650 name, 11px muted role). Links are 36px tall, 8px radius, 13.5px/500 muted, with a Panel Mist fill on hover/active. The availability status uses a 7px Ledger Green dot with a 3px 16% ring. The nav CTA is a 38px, 9px-radius ghost chip. Under 1080px, links collapse into a full-screen sheet with 28–38px headline links, ending in a full-width primary "Start a conversation" action, the location line and the email; under 620px the role and status text hide.

### Ledger Line
The section opener: a 1px Hairline rule with 18px of clearance, the section's name at the left in 11px mono uppercase 0.08em, and one piece of real metadata at the right in the same mono at Ghost Ink. It is a running head, not an eyebrow: it sits on the rule, never stacks decorative type above a heading, and it is the only rule separating sections in the night theme. Lists inside a section (achievements, capabilities) use the same device at 11px mono as a `list-label` with a Hairline underline.

### Filter Chips and Tags
The category filter is retired: twelve projects do not repay a classify-before-browsing step, and medium was never the argument. Category now appears only as the dot-and-label pill on each cover and as a category dot in the build log.
- **Tag:** 999px pill, Panel Mist fill, Hairline border, 5px 9px padding, 11.5px/500 muted. Tags are read-only metadata; they do not hover.

### Cards / Containers
Project cards are the canonical container: Paper fill, Hairline border, 16px radius, cover clipped to the top. Hover lifts 4px, adds the contact shadow and strengthens the border; focus-within adds a 2px accent ring. The cover is a 16:10 category-tinted field - 38% category radial at top-right, a 13% linear tint below, a masked 44px grid, and a 62% concentric ring in category colour. Every artefact is **mounted as a print** at a fixed scale (46% of the plate, capped at 210px; 52% capped at 300px on the featured card): a 4:3 white sheet with a 10px radius, Hairline Strong border and contact shadow, holding the image `contain` for marks and logos or `cover` for photographs. A project with no upload shows a category glyph on the same sheet. No asset is ever full-bleed on a card, and no logo is enlarged to fill a frame.
- **Body padding:** 24px (featured: clamp(28–44px)).
- **Meta:** 12px/500 with 3px dot dividers; the second item is the project's context ("Sarawak tablet rollout"), not its medium.
- **Title:** 21–27px, no reserved arrow gutter.
- **Foot:** "Read the case study" at 12.5px/600 in Faded Ink with the 38px circle arrow at the far right; the row sits on `margin-top: auto` so every card in a row ends level.

### Build Log Entry (signature)
The timeline entry is the most characteristic component: a 10px-radius white row with Hairline border and resting shadow, laid out `28px / 1fr / 18px` — mono index, body, arrow. Meta sits above the title in 11px uppercase mono with a 6px category dot, then the project's context after a middot. Titles are 16px/650; descriptions 13.5px muted at 58ch. Hover lifts 2px, adds the contact shadow and turns the arrow accent. The year label is 36–52px/750 with an 11px uppercase mono count beneath.

### Case Study Blocks
- **Case meta strip:** four cells in Panel Mist, 16px radius, 18px 20px padding, 11px muted keys over 14px Slate Ink values.
- **Metrics:** 10px-radius cards, 20px padding, value at clamp(30–42px)/750 in Deep Signal, label at 12px muted. Only real figures go here.
- **Journey:** a 2px Hairline left rail with 10px ringed nodes; each step has an 11.5px accent label over a 20–26px/700 title.
- **Prose:** first paragraph in Slate Ink, the rest in Faded Ink, 1.78 line height, 68ch.

### Contact Panel
A 24px-radius panel on a diagonal Blue Wash → Panel Mist gradient with a violet radial in the top-right. Headline 34–62px/750 with the key phrase in Signal Blue. The address block pairs the email link - 19–27px/650, a 1px underline sized to the address (`fit-content`), and a 45-degree paper-plane icon that rotates upright on hover - with a separate 36px "Copy" button beside it, so a clipboard utility never sits as a peer of the outbound profiles. Detail cells are 10px-radius translucent Paper panels; social links are 999px outlined chips.

### Footer
A Cool Paper band with a single hairline top border and a 12.5px muted utility row. Its signature is the giant ghost wordmark: clamp(64px, 15vw, 200px), 800 weight, -0.06em tracking, set in `color-mix(text 7%, transparent)` and cropped at the baseline.

### Editor Console (admin.html)
Operate-mode counterpart: same palette, fixed 72px topbar and 264px sidebar, but controls are 40px tall with 2px corners, mono uppercase 9px labels and a 0.1em tracking. Inputs are 38px with 2px corners on Panel Mist. Primary buttons share Signal Blue; destructive actions use Alert Red with a soft tint.

## Do's and Don'ts

### Do:
- **Do** keep Signal Blue for action and authorship only, and hold it to roughly 10% of the viewport.
- **Do** separate surfaces with a 1px Hairline and a tonal step before reaching for a shadow.
- **Do** mount every card artefact as a print on the category plate at a fixed scale; cover images are evidence, not wallpaper.
- **Do** set indices, counts, dates and category labels in JetBrains Mono at 11px uppercase; nothing functional on the public site drops below 11px.
- **Do** give anything above 34px negative tracking (-0.025em to -0.06em) and leave body copy at 0.
- **Do** use 16px for cards, 24px for large panels, 10px for small entries, and 999px only for labels.
- **Do** keep the 2px accent focus ring with 3px offset visible in both themes.
- **Do** let category colour live in dots, cover tints and the plate ring, at low opacity.
- **Do** preserve the reduced-motion fallback: no marquee, no reveal transform, no scroll animation.

### Don't:
- **Don't** use cyan, amber or violet as generic accents; they are category codes.
- **Don't** add resting shadows to cards, sections or panels.
- **Don't** introduce a second typeface for display, quotes or "personality".
- **Don't** set long labels or sentences in mono, or uppercase Inter paragraphs.
- **Don't** make primary buttons or cards into pills.
- **Don't** nest radii: a card clips its cover and inner blocks to its own 16px corner.
- **Don't** stack cards inside cards or add decorative gradients outside cover plates and the ambient washes.
- **Don't** invent metrics, logos or screenshots to fill a layout; an empty slot stays empty.
