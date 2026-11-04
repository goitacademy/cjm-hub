# CJM hub

Static site with Customer Journey Maps (CJM) of GoIT courses. Published to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. Only `site/` is published.

- `site/_shared/cjm.css`, `site/_shared/cjm.js` — the one shared template: design, layout, checkboxes, progress.
- `site/<course-slug>-<6 hex>/index.html` — one CJM. It contains only the course data (`const CJM = {...}`) and loads the template.

Each CJM is shared by direct link only. There is no index page or list of CJMs. Do not create one.

## Add a new CJM

The user usually pastes the course program as text. It can also be a file or an old CJM HTML.

1. Run `scripts/new-cjm.sh <course-slug>` (lowercase latin letters, digits, hyphens; e.g. `ai-automator`).
   It prints the new folder, e.g. `site/ai-automator-3fa9c1`. Never create or rename CJM folders by hand.
2. Copy `index.html` from an existing CJM folder into the new folder. Change `<title>` and replace the `CJM` object with the data of the new course (format below). Change nothing else in the file.
3. If information is missing (weeks per block, finish items), ask the user. Do not invent course content.
4. Run `scripts/check.sh` and fix every error.
5. Open the page for the user to review: `open site/<folder>/index.html`. Publish only after the user says it is OK.
6. Commit (`feat(cjm): add <course-slug>`) and push to `main`.
7. Give the user the URL: `https://cjm.goit.global/<folder>/`. It works 1–2 minutes after the push.

## Change a CJM

1. Find the folder: `ls site | grep <course-slug>`. If there is more than one, ask the user which one.
2. Change only the `CJM` object (and `<title>` if the course name changes). Never rename the folder: the URL changes and old links stop working.
3. Run `scripts/check.sh`, open the page for review, then commit (`fix(cjm): <what changed> in <course-slug>`) and push to `main`.

## Remove a CJM

Ask the user to confirm, then delete the folder, commit (`chore(cjm): remove <course-slug>`) and push.
The URL then returns 404. The old version stays in the public git history.

## CJM data format

All text values may contain HTML: `<br>` (line break), `<strong>`, `&amp;`. Unknown fields are errors.

```js
const CJM = {
  course: 'AI Automator',                 // required; heading: "Твій шлях на курсі AI Automator"
  subtitle: '20 домашніх завдань · 4 блоки · від нуля до власних AI-агентів',  // optional
  blocks: [                               // required; left to right
    {
      intro: true,                        // intro block: chip "ВСТУПНИЙ БЛОК", purple, not numbered
      title: 'Прекурс + Soft Skills',
      badge: 'Без домашніх завдань',      // optional purple badge
      note: '🚀 <strong>Розпочинаємо навчання з цього блоку.</strong><br><br>...'  // optional dashed box
    },
    {
      title: 'Prompt Engineering<br>&amp; AI Agents',   // required
      weeks: 6,                           // chip: "БЛОК 1 · 6 тижнів · 5 ДЗ" (ДЗ count is calculated)
      difficulty: 'Вступний блок — потрібен час на адаптацію',  // optional black badge
      tasks: [                            // checkboxes; text before " — " is bold
        'ДЗ 1 — Модуль 1+2. Основи промпт-інжинірингу',
        { text: '(Бонусний модуль) — Модуль 4. Voice AI Agent', bonus: true }  // not counted as ДЗ
      ],
      tip: '💡 Цей блок — фундамент...',  // optional box at the bottom of the card
      label: 'ВСТУПНИЙ БЛОК · Модуль 0'   // optional; replaces the calculated chip text
    }
  ],
  finish: {                               // required; last card with the trophy
    title: 'Проходимо фінальне тестування &amp; Отримуємо сертифікат GoIT',
    items: ['Підтримка карʼєрного центру', 'Доступ до спільноти']
  },
  tips: ['<strong>Блок AI Sales</strong> — найскладніший...']  // optional "Поради для планування" cards
};
```

The template sets the block colors (intro purple, then blue, pink, yellow, green), counts ДЗ and progress, and stores progress per page URL.

## Change the template

`site/_shared/` changes every CJM at once. After a change, run `scripts/check.sh`, open every CJM and check it, then commit (`feat(template): ...` or `fix(template): ...`).
If the data format changes, update `validate()` in `cjm.js`, the format above, and every CJM in the same commit.

## Rules

- One change touches one CJM folder, or only the template.
- Never put CSS or JS into a CJM page. Design and behavior belong in `site/_shared/`.
- Never link one CJM to another.
- Never add files to the root of `site/`.
- Never put personal data (names, emails, phone numbers) or internal information in a CJM: the repository is public.
