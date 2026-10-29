/*
 * Builds a CJM page from the global `CJM` object that the page defines before loading this script.
 * Data format: see CLAUDE.md. All text values may contain HTML (<br>, <strong>, &amp;).
 * In Node, this file only exports validate() for scripts/validate-cjm.js.
 */
(function () {
  'use strict';

  const SEP = ' · ';
  const ACCENTS = ['blue', 'pink', 'yellow', 'green'];

  const KEYS = {
    root: ['course', 'subtitle', 'blocks', 'finish', 'tips'],
    block: ['intro', 'label', 'title', 'weeks', 'difficulty', 'badge', 'tasks', 'note', 'tip'],
    task: ['text', 'bonus'],
    finish: ['title', 'items'],
  };

  const isText = (v) => typeof v === 'string' && v.trim() !== '';
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

  function unknownKeys(obj, allowed, at, errors) {
    for (const key of Object.keys(obj)) {
      if (!allowed.includes(key)) errors.push(`${at}${key}: unknown field (allowed: ${allowed.join(', ')})`);
    }
  }

  /* Returns a list of problems in the data; an empty list means the data is valid. */
  function validate(cjm) {
    const errors = [];
    if (!isObject(cjm)) return ['CJM: must be an object'];
    unknownKeys(cjm, KEYS.root, '', errors);

    if (!isText(cjm.course)) errors.push('course: required text');
    if (cjm.subtitle !== undefined && !isText(cjm.subtitle)) errors.push('subtitle: must be text');

    if (!Array.isArray(cjm.blocks) || cjm.blocks.length === 0) {
      errors.push('blocks: required non-empty list');
    } else {
      cjm.blocks.forEach((b, i) => {
        const at = `blocks[${i}].`;
        if (!isObject(b)) { errors.push(`blocks[${i}]: must be an object`); return; }
        unknownKeys(b, KEYS.block, at, errors);
        if (!isText(b.title)) errors.push(`${at}title: required text`);
        for (const key of ['label', 'difficulty', 'badge', 'note', 'tip']) {
          if (b[key] !== undefined && !isText(b[key])) errors.push(`${at}${key}: must be text`);
        }
        if (b.intro !== undefined && typeof b.intro !== 'boolean') errors.push(`${at}intro: must be true or false`);
        if (b.weeks !== undefined && !(Number.isInteger(b.weeks) && b.weeks > 0)) errors.push(`${at}weeks: must be a positive whole number`);
        if (b.tasks !== undefined && !Array.isArray(b.tasks)) {
          errors.push(`${at}tasks: must be a list`);
        } else {
          (b.tasks || []).forEach((t, j) => {
            if (isText(t)) return;
            if (isObject(t) && isText(t.text) && (t.bonus === undefined || typeof t.bonus === 'boolean')) {
              unknownKeys(t, KEYS.task, `${at}tasks[${j}].`, errors);
              return;
            }
            errors.push(`${at}tasks[${j}]: must be text or { text, bonus: true }`);
          });
        }
      });
    }

    if (!isObject(cjm.finish)) {
      errors.push('finish: required { title, items }');
    } else {
      unknownKeys(cjm.finish, KEYS.finish, 'finish.', errors);
      if (!isText(cjm.finish.title)) errors.push('finish.title: required text');
      if (!Array.isArray(cjm.finish.items) || !cjm.finish.items.every(isText)) errors.push('finish.items: required list of text');
    }

    if (cjm.tips !== undefined && (!Array.isArray(cjm.tips) || !cjm.tips.every(isText))) errors.push('tips: must be a list of text');
    return errors;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validate };
    return;
  }

  /* ──────────── BROWSER ──────────── */

  const STORAGE_KEY = 'cjm-progress:' + location.pathname;

  const UNCHECKED_SVG = '<svg class="px-check" viewBox="0 0 9 9"><rect x="0" y="0" width="9" height="9" rx="1.5" fill="none" stroke="#CCC" stroke-width="1"/></svg>';
  const CHECKED_SVG = '<svg class="px-check" viewBox="0 0 9 9"><rect x="0" y="0" width="9" height="9" rx="1.5" fill="#1A1A1A"/><polyline points="2,4.5 4,7 7,2.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CONNECTOR = `<div class="connector"><svg width="52" height="24" viewBox="0 0 52 24">
      <line x1="2" y1="12" x2="40" y2="12" stroke="#BBBBBB" stroke-width="2" stroke-dasharray="4 3"/>
      <polygon points="40,7 50,12 40,17" fill="#BBBBBB"/>
    </svg></div>`;
  const TROPHY_SVG = `<svg class="trophy-icon" width="54" height="54" viewBox="0 0 9 9" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0" width="5" height="1" fill="#FFD700"/>
      <rect x="1" y="1" width="7" height="3" fill="#FFD700"/>
      <rect x="0" y="1" width="1" height="2" fill="#FFD700"/>
      <rect x="8" y="1" width="1" height="2" fill="#FFD700"/>
      <rect x="2" y="4" width="5" height="1" fill="#FFD700"/>
      <rect x="4" y="5" width="1" height="1" fill="#FFD700"/>
      <rect x="2" y="6" width="5" height="1" fill="#FFD700"/>
      <rect x="1" y="7" width="7" height="1" fill="#FFD700"/>
      <rect x="3" y="1" width="1" height="1" fill="#FFF9C4" opacity="0.7"/>
    </svg>`;

  /* 1 тиждень, 2–4 тижні, 5+ тижнів (with the 11–14 exception). */
  function weeksLabel(n) {
    const d = n % 10;
    const dd = n % 100;
    if (d === 1 && dd !== 11) return `${n} тиждень`;
    if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} тижні`;
    return `${n} тижнів`;
  }

  /* "ДЗ 1 — Модуль 1. Назва" → "<b>ДЗ 1</b> — Модуль 1. Назва" */
  function taskText(text) {
    const i = text.indexOf(' — ');
    return i === -1 ? text : `<b>${text.slice(0, i)}</b>${text.slice(i)}`;
  }

  function normalize(cjm) {
    let number = 0;
    let accent = 0;
    return cjm.blocks.map((b) => {
      const tasks = (b.tasks || []).map((t) => (typeof t === 'string' ? { text: t } : t));
      const homeworks = tasks.filter((t) => !t.bonus).length;
      let chip;
      let color;
      if (b.intro) {
        chip = 'ВСТУПНИЙ БЛОК';
        color = 'purple';
      } else {
        number += 1;
        chip = [`БЛОК ${number}`, b.weeks && weeksLabel(b.weeks), homeworks && `${homeworks} ДЗ`].filter(Boolean).join(SEP);
        color = ACCENTS[accent++ % ACCENTS.length];
      }
      return { ...b, tasks, chip: b.label || chip, color };
    });
  }

  function renderBlock(b, bi) {
    const items = b.tasks.map((t, ti) => `
      <li class="module-item" data-block="${bi}" data-task="${ti}">
        <div class="module-row" role="checkbox" aria-checked="false" tabindex="0">
          <span class="check">${UNCHECKED_SVG}</span>
          <span class="module-text">${taskText(t.text)}</span>
        </div>
      </li>`).join('');

    return `
    <div class="block-card accent-${b.color}">
      <span class="block-chip">${b.chip}</span>
      <h2 class="block-title">${b.title}</h2>
      ${b.difficulty ? `<span class="difficulty-badge">${b.difficulty}</span>` : ''}
      ${b.badge ? `<span class="no-dz-badge">${b.badge}</span>` : ''}
      ${b.tasks.length ? `
      <div class="mini-bar-wrap">
        <div class="mini-bar-label" data-label="${bi}"></div>
        <div class="mini-bar-track"><div class="mini-bar-fill" data-bar="${bi}"></div></div>
      </div>
      <ul class="module-list">${items}</ul>` : ''}
      ${b.note ? `<div class="softskills-note">${b.note}</div>` : ''}
      ${b.tip ? `<div class="tip-box">${b.tip}</div>` : ''}
    </div>`;
  }

  function renderFinish(finish) {
    return `
    <div class="final-card">
      ${TROPHY_SVG}
      <div class="final-badge">🎓 ФІНІШ</div>
      <p class="final-title">${finish.title}</p>
      <ul class="final-items">${finish.items.map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>`;
  }

  function renderTips(tips) {
    const cards = tips.map((tip, i) => `
      <div class="tip-card">
        <div class="tip-num">${String(i + 1).padStart(2, '0')}</div>
        <p class="tip-text">${tip}</p>
      </div>`).join('');
    return `
    <section class="tips-section">
      <h2 class="section-title">Поради для планування</h2>
      <div class="tips-grid">${cards}</div>
    </section>`;
  }

  function renderPage(cjm, blocks) {
    const total = blocks.reduce((sum, b) => sum + b.tasks.length, 0);
    return `
    <header class="header">
      <div class="logo">GoIT</div>
      <div class="header-center">
        <h1 class="main-title">Твій шлях на курсі ${cjm.course}</h1>
        ${cjm.subtitle ? `<p class="subtitle">${cjm.subtitle}</p>` : ''}
      </div>
      ${total ? '<div class="header-right"><button class="reset-btn" type="button">↺ Скинути прогрес</button></div>' : ''}
    </header>
    ${total ? `
    <section class="progress-section">
      <div class="progress-meta">
        <span>Загальний прогрес</span>
        <span id="progress-label"></span>
      </div>
      <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
    </section>` : ''}
    <section class="roadmap-wrap">
      <div class="roadmap">
        ${blocks.map(renderBlock).join(CONNECTOR)}${CONNECTOR}${renderFinish(cjm.finish)}
      </div>
    </section>
    ${cjm.tips && cjm.tips.length ? renderTips(cjm.tips) : ''}`;
  }

  function setDone(item, done) {
    item.classList.toggle('done', done);
    item.querySelector('.module-row').setAttribute('aria-checked', String(done));
    item.querySelector('.check').innerHTML = done ? CHECKED_SVG : UNCHECKED_SVG;
  }

  function updateProgress(blocks) {
    let doneTotal = 0;
    let total = 0;
    blocks.forEach((b, bi) => {
      if (!b.tasks.length) return;
      const done = document.querySelectorAll(`.module-item.done[data-block="${bi}"]`).length;
      document.querySelector(`[data-label="${bi}"]`).textContent = `${done} / ${b.tasks.length} виконано`;
      document.querySelector(`[data-bar="${bi}"]`).style.width = Math.round(done / b.tasks.length * 100) + '%';
      doneTotal += done;
      total += b.tasks.length;
    });
    if (!total) return;
    const pct = Math.round(doneTotal / total * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-label').textContent = `${doneTotal} / ${total} завдань виконано · ${pct}%`;
  }

  function saveProgress(blocks) {
    const state = blocks.map((b, bi) =>
      [...document.querySelectorAll(`.module-item[data-block="${bi}"]`)].map((item) => item.classList.contains('done')));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function loadProgress() {
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      state.forEach((tasks, bi) => (tasks || []).forEach((done, ti) => {
        const item = document.querySelector(`.module-item[data-block="${bi}"][data-task="${ti}"]`);
        if (done && item) setDone(item, true);
      }));
    } catch (e) {}
  }

  function showErrors(errors) {
    document.body.innerHTML = '<pre class="cjm-error"></pre>';
    document.querySelector('.cjm-error').textContent = 'CJM data errors:\n\n' + errors.map((e) => '• ' + e).join('\n');
    console.error('CJM data errors:', errors);
  }

  const data = typeof CJM === 'undefined' ? undefined : CJM;
  const errors = validate(data);
  if (errors.length) {
    showErrors(errors);
    return;
  }

  const blocks = normalize(data);
  document.body.insertAdjacentHTML('beforeend', renderPage(data, blocks));

  function toggle(row) {
    const item = row.closest('.module-item');
    setDone(item, !item.classList.contains('done'));
    saveProgress(blocks);
    updateProgress(blocks);
  }

  document.addEventListener('click', (e) => {
    const row = e.target.closest('.module-row');
    if (row) toggle(row);
    if (e.target.closest('.reset-btn')) {
      document.querySelectorAll('.module-item.done').forEach((item) => setDone(item, false));
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
      updateProgress(blocks);
    }
  });
  document.addEventListener('keydown', (e) => {
    const row = e.target.closest && e.target.closest('.module-row');
    if (row && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      toggle(row);
    }
  });

  loadProgress();
  updateProgress(blocks);
})();
