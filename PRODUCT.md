# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences carry equal weight:

- **Admissions reviewers and future employers** — reading quickly, often on a phone, to judge a student developer's judgement, craft and range. They are looking for evidence of real problems solved, not a list of technologies.
- **Organisations and individuals with a practical problem** — teachers, school administrators, church and community teams, small businesses, event organisers — who might ask Andrew to build something for them. They need to recognise their own situation in a case study and believe the result was reliable.

Secondary: peers, competition judges and the wider maker community following the build log.

## Product Purpose

A single authoritative showcase of Andrew Ung Wei En's project work from 2018 to 2026, presented as data-driven case studies rather than a résumé. It exists so that one link gives an accurate, honest picture of what he can build and how he thinks, and so that he can update the content himself without editing code.

Success means a visitor finishes a case study understanding the problem, the build and the outcome — and either contacts him or remembers the name.

## Positioning

Every project is documented as a chain from a specific person with a frustrating manual process to a shipped tool and its effect: a grandfather at risk of falling, drivers who did not know what they would be paid, a 204-school tablet rollout tracked by hand. A neighbouring portfolio could copy the project list but not the problem-first narrative, the range from 2018 Arduino hardware to 2026 AI-in-a-spreadsheet, and the willingness to publish uncertainty ("at the start, I wasn't even sure it would work").

## Operating Context

- Static site published on GitHub Pages at `https://andrewung2009.github.io/portfolio/` from `andrewung2009/portfolio`, branch `main`.
- All site copy and project content lives in `data/portfolio.json`; `index.html`, `project.html` and `admin.html` are shells rendered by `js/app.js`, `js/project.js` and `admin.js`.
- Content is edited through `admin.html`: either publish mode (a fine-grained GitHub token commits `data/portfolio.json`) or a local draft mode. Every publish is a commit, so previous versions can be restored; **Backup** downloads the current JSON.
- Local preview: `start.bat`, or `python -m http.server 8000`, then `http://localhost:8000`. The site must be served over HTTP because it fetches its content file.
- Images live in `assets/images/` (source) and `assets/uploads/` (uploaded through the admin, committed to the repo). Uploading an image switches that project's cover to an image cover.
- The site ships light by default with a light/dark toggle persisted in `localStorage`; the same toggle applies to the admin.
- Access is public. `admin.html` is `noindex` and disallowed in `robots.txt` but still reachable.

## Capabilities and Constraints

- Homepage sections: hero, about (achievements and the capability list), four curated case studies, the complete build-log index, contact.
- Case-study pages at `project.html?id=<slug>` with problem, process, impact, journey, improvements and gallery blocks; most projects currently fill only problem, process and impact.
- Twelve projects across four categories — app, web, hardware, AI — spanning 2018 to 2026. The build log is the full index; the work section curates four of them.
- Legacy URL `taskaiagent.html` redirects to `project.html?id=ai-logistics-agent`.
- No backend, no framework, no build step. Vanilla HTML, CSS and JavaScript from local files.
- The admin password in `js/admin-config.js` is a convenience lock, not security — it is readable in source. The real protection is the scoped GitHub token, stored only in the browser and revocable.
- Uploads are capped at 8 MB; PNG, JPG, WebP, GIF and SVG are accepted.
- Nothing private may ever be placed in the content file, because the content file is public.
- Contact state: email is `andrewungweien@gmail.com`; availability "Open to collaborations"; currently studying A-Levels; no CV/PDF is linked (`resumeUrl` is empty).
- Decided: project covers stay category plates with the uploaded artefact mounted as a print at a fixed scale, so logos, photographs and screenshots read as one person's evidence rather than a vendor wall. A downloadable CV remains deliberately undecided.

## Brand Commitments

- Name: **Andrew Ung Wei En** (short form "Andrew").
- Voice: first person, plain and specific, quietly confident, willing to admit difficulty. Concrete nouns over buzzwords; no agency or corporate register; no growth-marketing claims.
- The published work must stay attributable to him alone as designer and developer; the footer line "Designed and built by Andrew Ung Wei En" states that.

## Evidence on Hand

- Project narratives with named contexts already published: Sarawak tablet rollout and Program Anak Kita (Kayam), Chumbaka (student report tool), HTBB Alpha Course (11 years of participant data; film-series resource site), Young Innovators Challenge 2025 national finals, Planning Center, and personal hardware and family projects from 2018 to 2021.
- Verified figures already stated in published copy: 204 schools, 1,000+ rows of tracking data, 11 years of Alpha Course data, 2018–2026 span. Other metrics arrays are empty and must not be filled with invented numbers.
- Real assets in the repository: project screenshots and partner logos (Chumbaka, Young Innovators Challenge, Alpha Course, Planning Center), a portrait photograph, and two project videos (`Being Present.mp4`, `Vaccine Temperature Monitor.mp4`).
- Live links to repositories, AppSheet apps, deployed sites and slide decks for most projects.
- **Absences future work must not fabricate:** no testimonials, client quotes, press coverage, awards citations beyond those implied, user counts, revenue, or time-saved figures.

## Product Principles

1. **Start with the person, not the stack.** A project is explained by whose day it changed before it is explained by what it was built with.
2. **Publish only what is true.** An empty metric stays empty; an unfinished result is described as unfinished.
3. **Range is the argument.** Hardware, apps, spreadsheets and AI belong in one body of work because the method is the same: find the manual mess, automate it.
4. **The owner must be able to edit it.** Content changes go through the editor and a commit, never through a developer.
5. **Keep the reading load low.** A busy reviewer should reach the point of a case study without scrolling through decoration.

## Accessibility & Inclusion

No formal standard has been confirmed. The existing site already ships a skip link, ARIA live regions for loading and status messages, a persisted theme toggle, reduced-motion handling and keyboard-visible focus; future work preserves these rather than regressing them.
