# CJM hub

Static site with Customer Journey Maps (CJM) of GoIT courses. One CJM = one folder in `site/` with one `index.html`.
Only `site/` is published: GitHub Pages, by `.github/workflows/deploy.yml` on every push to `main`.

Each CJM is shared by direct link only. There is no index page or list of CJMs. Do not create one.

## Add a new CJM

1. Run `scripts/new-cjm.sh <course-slug>` (lowercase latin letters, digits, hyphens; e.g. `ai-automator`).
   It prints the new folder, e.g. `site/ai-automator-3fa9c1`. Never create or rename CJM folders by hand.
2. Save the page as `index.html` in that folder. Keep CSS and JS inline. If the page needs images, put them in `<folder>/assets/` and use relative paths (`assets/x.png`).
3. In `<head>`, add `<meta name="robots" content="noindex, nofollow">`.
4. If the page saves progress in `localStorage`, build the key from the page URL:
   `const STORAGE_KEY = 'cjm-progress:' + location.pathname;`
   All GitHub Pages sites of the organization share one origin, so a fixed key mixes progress between CJMs.
5. Run `scripts/check.sh` and fix every error.
6. Commit (`feat(cjm): add <course-slug>`) and push to `main`.
7. Give the user the URL: `https://goitacademy.github.io/cjm-hub/<folder-name>/`. It works 1–2 minutes after the push.

## Change a CJM

1. Find the folder: `ls site | grep <course-slug>`. If there is more than one, ask the user which one.
2. Change only files in that folder. Never rename the folder: the URL changes and old links stop working.
3. Run `scripts/check.sh`, commit (`fix(cjm): <what changed> in <course-slug>`), push to `main`.

## Remove a CJM

Ask the user to confirm, then delete the folder, commit (`chore(cjm): remove <course-slug>`) and push.
The URL then returns 404. The old version stays in the public git history.

## Rules

- One change touches one CJM folder.
- Never link one CJM to another.
- Never add files to the root of `site/`.
- Never put personal data (names, emails, phone numbers) or internal information in a CJM: the repository is public.
