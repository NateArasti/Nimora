const labels = {
  en: {
    title: "Character Sheet",
    lang: "en",
    clear: "Clear",
    print: "Print",
    customize: "Customize",
    preset: "Preset",
    font: "Font",
    pageColor: "Page",
    screenColor: "Screen",
    styleGroup: "Style",
    colorsGroup: "Colors",
    namesGroup: "Characteristic names",
    accentColor: "Lines",
    headingColor: "Header text",
    borderColor: "Border",
    goldColor: "Corner marks",
    inkColor: "Body text",
    resetStyle: "Reset style",
    resetLabels: "Reset labels",
    classicPreset: "Classic parchment",
    steelPreset: "Ink & steel",
    forestPreset: "Forest",
    crimsonPreset: "Crimson",
    printPreset: "Minimal print",
    upload: "Click to upload",
    uploadAria: "Upload portrait",
    name: "Name",
    rank: "Rank",
    player: "Player",
    campaign: "Campaign",
    archetype: "Archetype / role",
    description: "Description",
    characteristics: "Characteristics",
    body: "Body",
    agility: "Agility",
    mind: "Mind",
    intuition: "Intuition",
    will: "Will",
    influence: "Influence",
    rankShort: "Rank",
    mod: "Mod",
    exhaustion: "Exhaustion",
    exhaustionFormula: "Threshold i = (5 + max(Body, Mind, Will)) x i",
    exhaustion0: "full strength",
    exhaustion1: "hindrance on checks",
    exhaustion2: "no movement / extra action",
    exhaustion3: "unconscious",
    hp: "HP",
    dr: "DR",
    speed: "Speed",
    health: "Health",
    maxHp: "Max =",
    dying: "Dying",
    inspiration: "Inspiration",
    antiInspiration: "Anti-inspiration",
    traits: "Traits",
    abilities: "Abilities",
    inventory: "Inventory",
    effects: "Effects",
    backstory: "Backstory",
    notes: "Notes",
    clearConfirm: "Clear this character sheet?",
  },
  ru: {
    title: "Лист Персонажа",
    lang: "ru",
    clear: "Очистить",
    print: "Печать",
    upload: "Нажмите<br>для загрузки",
    uploadAria: "Загрузить портрет",
    name: "Имя",
    rank: "Ранг",
    player: "Игрок",
    campaign: "Кампания",
    archetype: "Архетип / роль",
    description: "Описание",
    characteristics: "Характеристики",
    body: "Тело",
    agility: "Ловкость",
    mind: "Разум",
    intuition: "Интуиция",
    will: "Воля",
    influence: "Влияние",
    rankShort: "Ранг",
    mod: "Мод",
    exhaustion: "Истощение",
    exhaustionFormula: "Порог i = (5 + max(Тело, Разум, Воля)) x i",
    exhaustion0: "полон сил",
    exhaustion1: "помехи на проверки",
    exhaustion2: "нет движения / доп. действия",
    exhaustion3: "без сознания",
    hp: "ОЗ",
    dr: "СЗ",
    speed: "Скорость",
    health: "Здоровье",
    maxHp: "Макс =",
    dying: "При смерти",
    inspiration: "Вдохновение",
    antiInspiration: "Анти-вдохновение",
    traits: "Черты",
    abilities: "Способности",
    inventory: "Инвентарь",
    effects: "Эффекты",
    backstory: "История",
    notes: "Заметки",
    clearConfirm: "Очистить лист персонажа?",
  },
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatExhaustionFormula(value) {
  return escapeHtml(value).replace(/^([\s\S]*?)\bi\b(?=\s*=)/, "$1<sub>i</sub>");
}

function field(name, extra = "") {
  return `<input type="text" name="${name}" ${extra}>`;
}

function textarea(name, extra = "", className = "fit-text") {
  return `<textarea class="${className}" name="${name}" ${extra}></textarea>`;
}

const ruUi = {
  customize: "\u041d\u0430\u0441\u0442\u0440\u043e\u0438\u0442\u044c",
  preset: "\u0421\u0442\u0438\u043b\u044c",
  font: "\u0428\u0440\u0438\u0444\u0442",
  styleGroup: "\u0421\u0442\u0438\u043b\u044c",
  colorsGroup: "\u0426\u0432\u0435\u0442\u0430",
  namesGroup: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u044f",
  pageColor: "\u041b\u0438\u0441\u0442",
  screenColor: "\u0424\u043e\u043d",
  accentColor: "\u041b\u0438\u043d\u0438\u0438",
  headingColor: "\u0428\u0430\u043f\u043a\u0430",
  borderColor: "\u0420\u0430\u043c\u043a\u0438",
  goldColor: "\u0423\u0433\u043b\u044b",
  inkColor: "\u0422\u0435\u043a\u0441\u0442",
  resetStyle: "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0441\u0442\u0438\u043b\u044c",
  resetLabels: "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f",
  classicPreset: "\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430",
  steelPreset: "\u0421\u0442\u0430\u043b\u044c",
  forestPreset: "\u041b\u0435\u0441",
  crimsonPreset: "\u0411\u0430\u0433\u0440\u044f\u043d\u0435\u0446",
  printPreset: "\u041f\u0435\u0447\u0430\u0442\u044c",
};

function ui(t, key) {
  return t[key] || (t.lang === "ru" ? ruUi[key] : "") || labels.en[key] || key;
}

function stat(id, label, rankName, modName, t) {
  return `<div class="stat-card"><div class="stat-name" data-stat-label="${id}">${escapeHtml(label)}</div><div class="stat-inputs">${field(rankName, 'class="stat-rank"')}<span class="stat-sep">(</span>${field(modName, 'class="stat-mod"')}<span class="stat-sep">)</span></div><div class="stat-sublabel"><span>${escapeHtml(t.rankShort)}</span><span>${escapeHtml(t.mod)}</span></div></div>`;
}

function circles(prefix, count) {
  return Array.from({ length: count }, (_, index) => {
    const id = `${prefix}-${index + 1}`;
    return `<input id="${id}" type="checkbox" name="${id}"><label for="${id}"></label>`;
  }).join("");
}

function buildLocaleTabs(locale, page, allLocales) {
  return allLocales
    .map((item) => {
      const targetPage = item.pages.find((candidate) => candidate.key === page.key) || item.pages[0];
      const active = item.code === locale.code ? " active" : "";
      return `<a class="locale-tab${active}" href="../${item.code}/${targetPage.slug}.html">${escapeHtml(item.languageLabel)}</a>`;
    })
    .join("");
}

const styleFields = [
  ["paper", "pageColor"],
  ["screen", "screenColor"],
  ["accent", "accentColor"],
  ["heading", "headingColor"],
  ["border", "borderColor"],
  ["gold", "goldColor"],
  ["ink", "inkColor"],
];

const statFields = ["body", "agility", "mind", "intuition", "will", "influence"];

function customizationPanel(t) {
  const presetOptions = [
    ["classic", ui(t, "classicPreset")],
    ["steel", ui(t, "steelPreset")],
    ["forest", ui(t, "forestPreset")],
    ["crimson", ui(t, "crimsonPreset")],
    ["print", ui(t, "printPreset")],
  ]
    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
    .join("");
  const fontOptions = [
    ["georgia", "Georgia"],
    ["merriweather", "Merriweather"],
    ["alegreya", "Alegreya"],
    ["lora", "Lora"],
    ["cinzel", "Cinzel"],
    ["inter", "Inter"],
  ]
    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
    .join("");
  const colorControls = styleFields
    .map(([name, label]) => `<div class="customize-field"><label for="custom-${name}">${escapeHtml(ui(t, label))}</label><input id="custom-${name}" type="color" data-custom-field data-style-field="${name}"></div>`)
    .join("");
  const statControls = statFields
    .map((name) => `<div class="customize-field"><label for="custom-stat-${name}">${escapeHtml(t[name])}</label><input id="custom-stat-${name}" type="text" data-custom-field data-stat-field="${name}"></div>`)
    .join("");

  return `<div class="customize-panel" id="customize-panel">
          <section class="customize-group customize-style">
            <div class="customize-group-title">${escapeHtml(ui(t, "styleGroup"))}</div>
            <div class="customize-row customize-stack">
              <div class="customize-field"><label for="custom-preset">${escapeHtml(ui(t, "preset"))}</label><select id="custom-preset" data-custom-field>${presetOptions}</select></div>
              <div class="customize-field"><label for="custom-font">${escapeHtml(ui(t, "font"))}</label><select id="custom-font" data-custom-field>${fontOptions}</select></div>
            </div>
          </section>
          <section class="customize-group customize-colors">
            <div class="customize-group-title">${escapeHtml(ui(t, "colorsGroup"))}</div>
            <div class="customize-row">${colorControls}</div>
          </section>
          <section class="customize-group customize-names">
            <div class="customize-group-title">${escapeHtml(ui(t, "namesGroup"))}</div>
            <div class="customize-row">${statControls}</div>
            <div class="customize-actions">
              <button type="button" id="reset-labels">${escapeHtml(ui(t, "resetLabels"))}</button>
            </div>
          </section>
          <div class="customize-footer">
            <button type="button" id="reset-style">${escapeHtml(ui(t, "resetStyle"))}</button>
          </div>
        </div>`;
}

function renderCharacterSheetPage({ locale, page, allLocales }) {
  const t = labels[locale.code] || labels.en;
  const combatLabel = locale.code === "ru" ? "Бой" : "Combat";
  const storageKey = `nimora-character-sheet-${locale.code}`;
  const localeTabs = buildLocaleTabs(locale, page, allLocales);

  return `<!doctype html>
<html lang="${t.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(t.title)} | ${escapeHtml(locale.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Cinzel:wght@400;700&family=Inter:wght@400;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/styles.css">
  <style>
    :root {
      --sheet-ink: #1a1410;
      --sheet-screen-bg: #3a2a1a;
      --sheet-paper: #f5efe0;
      --sheet-paper-dark: #ede3c8;
      --sheet-paper-mid: #e8dfc4;
      --sheet-accent: #8b2020;
      --sheet-heading: #8b2020;
      --sheet-gold: #b8960c;
      --sheet-border: #a08060;
      --sheet-border-light: #c4a87a;
      --sheet-font-family: Georgia, "Times New Roman", serif;
      --sheet-heading-font: "Cinzel", Georgia, serif;
      --sheet-label-font: "Alegreya", Georgia, serif;
      --sheet-default-texture: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      --sheet-texture: var(--sheet-default-texture);
      --sheet-gap: 8px;
      --sheet-radius: 4px;
      --label-size: 8px;
      --section-label-size: 9px;
      --small-label-size: 7px;
      --field-font-size: 13px;
      --stat-name-size: 8px;
      --stat-value-size: 16px;
      --stat-mod-size: 13px;
      --stat-gap: 3px;
      --stats-col-width: 156px;
      --exhaustion-formula-size: 6px;
      --circle-size: 14px;
      --portrait-ratio: 3 / 4;
      --portrait-width: 138px;
    }
    .sheet-shell {
      min-height: calc(100vh - 68px);
      padding: 1px 0 36px;
      background: var(--sheet-screen-bg);
      color: var(--sheet-ink);
      font-family: var(--sheet-font-family);
      font-size: 13px;
      line-height: 1.35;
    }
    .sheet-shell input,
    .sheet-shell textarea,
    .sheet-shell button {
      font: inherit;
      color: inherit;
    }
    .sheet-shell input[type="text"],
    .sheet-shell textarea {
      width: 100%;
      border: 0;
      border-bottom: 1px solid var(--sheet-border);
      background: transparent;
      outline: none;
      resize: none;
    }
    .sheet-shell textarea {
      border: 1px solid var(--sheet-border-light);
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.3);
      padding: 5px 7px;
      line-height: 1.25;
      overflow: hidden;
    }
    .top-tools {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      width: 210mm;
      max-width: calc(100vw - 32px);
      margin: 20px auto -8px;
    }
    .top-tools button {
      padding: 6px 10px;
      border: 1px solid var(--sheet-border);
      border-radius: 3px;
      background: var(--sheet-paper);
      cursor: pointer;
    }
    .customize-actions button,
    .customize-footer button {
      padding: 6px 10px;
      border: 1px solid var(--sheet-accent);
      border-radius: 3px;
      background: var(--sheet-accent);
      color: var(--sheet-paper);
      cursor: pointer;
      font-family: var(--sheet-label-font);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .customize-actions button:hover,
    .customize-footer button:hover {
      background: var(--sheet-heading);
      filter: brightness(1.15);
    }
    .customize-panel {
      display: none;
      grid-template-columns: minmax(120px, 0.75fr) minmax(260px, 1.35fr) minmax(260px, 1.4fr);
      gap: 8px;
      width: 210mm;
      max-width: calc(100vw - 32px);
      margin: 16px auto -8px;
      padding: 10px;
      border: 1px solid var(--sheet-border);
      border-radius: 4px;
      background: var(--sheet-paper);
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
    }
    .customize-panel.open {
      display: grid;
    }
    .customize-group {
      display: grid;
      gap: 7px;
      align-content: start;
      min-width: 0;
      padding: 8px;
      border: 1px solid var(--sheet-border-light);
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.18);
    }
    .customize-group-title {
      color: var(--sheet-heading);
      font-size: var(--section-label-size);
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .customize-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }
    .customize-colors .customize-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .customize-stack {
      grid-template-columns: 1fr;
    }
    .customize-field {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
    }
    .customize-field label {
      min-width: 0;
      color: var(--sheet-heading);
      font-size: var(--small-label-size);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .customize-field input,
    .customize-field select {
      min-width: 0;
      height: 28px;
      border: 1px solid var(--sheet-border);
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.35);
      color: var(--sheet-ink);
    }
    .customize-field input[type="color"] {
      padding: 2px;
    }
    .customize-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .customize-footer {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
    }
    .page {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 210mm;
      height: 297mm;
      margin: 20px auto;
      padding: 14mm 12mm 12mm;
      background: var(--sheet-paper);
      background-image: var(--sheet-texture);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
      break-after: page;
    }
    .page::before,
    .page::after {
      content: "*";
      position: absolute;
      top: 6mm;
      color: var(--sheet-gold);
      font-size: 16px;
      opacity: 0.6;
    }
    .page::before { left: 6mm; }
    .page::after { right: 6mm; }
    .sheet-header {
      display: flex;
      align-items: stretch;
      gap: 10px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--sheet-accent);
    }
    .header-title {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      padding-right: 8px;
      margin-right: 2px;
      border-right: 2px solid var(--sheet-accent);
      color: var(--sheet-heading);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.2em;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .portrait-wrap {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      width: var(--portrait-width);
      aspect-ratio: var(--portrait-ratio);
    }
    .portrait-box {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      flex: 1 1 auto;
      border: 2px solid var(--sheet-border);
      border-radius: 4px;
      background: var(--sheet-paper-mid);
      overflow: hidden;
      cursor: pointer;
    }
    .portrait-box:hover { border-color: var(--sheet-accent); }
    .portrait-box img {
      display: none;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      min-width: 0;
      min-height: 0;
      object-fit: cover;
    }
    .portrait-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      color: var(--sheet-border);
      font-size: 8px;
      letter-spacing: 0.05em;
      line-height: 1.15;
      text-align: center;
      text-transform: uppercase;
      pointer-events: none;
    }
    #portrait-input { display: none; }
    .header-main {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 6px;
    }
    .header-top {
      display: grid;
      grid-template-columns: 1fr 68px;
      gap: 10px;
      align-items: end;
    }
    .rank-badge {
      padding: 4px 5px 5px;
      border: 2px solid var(--sheet-accent);
      border-radius: 5px;
      background: rgba(184, 150, 12, 0.12);
      text-align: center;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    }
    .rank-badge label {
      display: block;
      margin-bottom: 1px;
      font-size: var(--small-label-size);
      letter-spacing: 0.12em;
    }
    .rank-badge input {
      border-bottom: 0;
      color: var(--sheet-heading);
      font-size: 22px;
      font-weight: 700;
      text-align: center;
    }
    .charname-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .sheet-shell label,
    .section-label,
    .box-title {
      color: var(--sheet-heading);
      font-family: var(--sheet-heading-font);
      font-size: var(--label-size);
      font-weight: 700;
      letter-spacing: 0.1em;
      line-height: 1;
      text-transform: uppercase;
    }
    .charname-row label { white-space: nowrap; }
    .charname-row input {
      flex: 1;
      border-bottom: 1.5px solid var(--sheet-accent);
      color: var(--sheet-heading);
      font-size: 20px;
      font-weight: 700;
    }
    .header-meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--sheet-gap);
    }
    .field {
      display: flex;
      flex: 1;
      flex-direction: column-reverse;
    }
    .field label {
      margin-top: 2px;
      font-size: var(--label-size);
    }
    .section-label {
      margin-bottom: 3px;
      font-size: var(--section-label-size);
    }
    .compact-label {
      margin-bottom: 0;
      min-width: 0;
    }
    .main-grid {
      display: grid;
      grid-template-columns: var(--stats-col-width) 1fr 1fr;
      gap: var(--sheet-gap);
      flex: 1;
      min-height: 0;
    }
    .stats-col,
    .middle-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 0;
    }
    .stats-col > .left-top,
    .stats-col > .effects-box,
    .middle-col > .grow-section {
      flex: 1 1 0;
      min-height: 0;
    }
    .right-col {
      display: grid;
      gap: 6px;
      min-height: 0;
      grid-template-rows: auto auto auto minmax(0, 1fr);
    }
    .left-top {
      display: flex;
      flex-direction: column;
      gap: 0;
      min-height: 0;
    }
    .characteristics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px;
    }
    .left-top .characteristics-grid {
      margin-top: 0;
    }
    .stat-card {
      border: 1.5px solid var(--sheet-border);
      border-radius: var(--sheet-radius);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
    }
    .combat-stat,
    .health-block,
    .inspiration-block {
      border: 1px solid var(--sheet-border-light);
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.3);
    }
    .combat-stat {
      border: 1.5px solid var(--sheet-border);
      border-radius: var(--sheet-radius);
    }
    .stat-card {
      display: grid;
      grid-template-rows: 18px 1fr 10px;
      align-items: center;
      aspect-ratio: 1;
      gap: 1px;
      padding: 3px 5px;
      text-align: center;
    }
    .stat-name {
      margin-bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      overflow: hidden;
      color: var(--sheet-heading);
      font-size: var(--stat-name-size);
      line-height: 1;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }
    .stat-inputs {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
      align-items: center;
      justify-content: center;
      column-gap: var(--stat-gap);
      width: 100%;
    }
    .stat-rank {
      width: 100%;
      border-bottom: 1.5px solid var(--sheet-border);
      font-size: var(--stat-value-size);
      font-weight: 700;
      text-align: center;
    }
    .stat-mod {
      width: 100%;
      padding: 1px 0;
      border: 1px solid var(--sheet-border);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.5);
      font-size: var(--stat-mod-size);
      text-align: center;
    }
    .stat-sep {
      color: var(--sheet-border);
      font-size: 12px;
      line-height: 1;
      text-align: center;
    }
    .stat-sublabel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
      justify-content: center;
      column-gap: var(--stat-gap);
      width: 100%;
      margin-top: 0;
      color: #907850;
      font-size: var(--small-label-size);
      line-height: 1;
    }
    .stat-sublabel span:first-child { grid-column: 1; }
    .stat-sublabel span:last-child { grid-column: 3; }
    .combat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    .combat-section {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .combat-section > .section-label {
      margin-bottom: 3px;
    }
    .combat-stat {
      display: grid;
      grid-template-rows: 30px 12px;
      align-items: center;
      padding: 5px 4px 3px;
      text-align: center;
    }
    .combat-stat input {
      border-bottom: 0;
      font-size: 20px;
      text-align: center;
    }
    .box-title {
      margin-top: 2px;
      text-align: center;
    }
    .health-block {
      display: grid;
      gap: 4px;
      padding: 5px 7px;
    }
    .health-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      margin-bottom: 2px;
    }
    .health-row label {
      color: #7a5c3a;
      font-size: var(--small-label-size);
      white-space: nowrap;
    }
    .health-row input {
      width: 38px;
      flex-shrink: 0;
      text-align: center;
    }
    .exhaustion-score input {
      width: 36px;
      font-size: 18px;
      font-weight: 700;
    }
    .exhaustion-block > .section-label {
      text-align: center;
    }
    .left-top .exhaustion-block {
      flex: 1 1 auto;
      margin-top: 4px;
    }
    .exhaustion-score {
      display: grid;
      grid-template-columns: 36px 10px 36px;
      justify-content: center;
      width: max-content;
      margin: 0 auto;
    }
    .exhaustion-score input {
      width: 36px;
      max-width: 36px;
    }
    .exhaustion-score span {
      text-align: center;
    }
    .exhaustion-note {
      margin-top: 2px;
      color: #7a5c3a;
      font-size: 10px;
      line-height: 1.35;
    }
    .health-formula.exhaustion-formula {
      font-size: var(--exhaustion-formula-size);
      line-height: 8px;
      text-align: center;
      white-space: nowrap;
      overflow-wrap: normal;
    }
    .exhaustion-formula sub {
      font-size: 70%;
      line-height: 0;
    }
    .health-formula {
      margin-top: 1px;
      color: #7a5c3a;
      font-size: 9.5px;
      font-style: italic;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .hp-formula {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 4px;
      width: 100%;
      white-space: nowrap;
      overflow-wrap: normal;
    }
    .health-formula input {
      display: inline-block;
      width: 22px;
      max-width: 22px;
      font-size: 10px;
      text-align: center;
    }
    .hp-formula input {
      flex: 1 1 0;
      width: auto;
      max-width: none;
      min-width: 0;
    }
    .death-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid var(--sheet-border-light);
    }
    .death-circles,
    .circle-track {
      display: flex;
      gap: 5px;
    }
    .circle-track input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .circle-track label {
      display: block;
      width: var(--circle-size);
      height: var(--circle-size);
      border: 1.5px solid var(--sheet-accent);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      cursor: pointer;
    }
    .circle-track input:checked + label {
      background: radial-gradient(circle, var(--sheet-accent) 0 45%, transparent 47%);
    }
    .inspiration-block {
      display: grid;
      gap: 4px;
      padding: 5px 7px;
    }
    .inspiration-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      gap: 6px;
      align-items: center;
    }
    .grow-section {
      display: flex;
      flex: 1;
      min-height: 0;
      flex-direction: column;
    }
    .grow-section textarea {
      flex: 1;
      min-height: 0;
    }
    .effects-box {
      display: flex;
      min-height: 0;
      flex-direction: column;
    }
    .effects-box textarea {
      flex: 1;
      min-height: 0;
    }
    .text-page-title {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--sheet-accent);
      color: var(--sheet-heading);
      font-family: var(--sheet-heading-font);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.08em;
      line-height: 20px;
      text-transform: uppercase;
    }
    .full-page-text {
      flex: 1;
      font-size: 14px;
      line-height: 1.45;
    }
    @media (max-width: 860px) {
      .sheet-shell {
        overflow-x: auto;
      }
      .page,
      .top-tools,
      .customize-panel {
        margin-left: 16px;
        margin-right: 16px;
      }
      .customize-panel {
        grid-template-columns: 1fr;
      }
      .customize-colors .customize-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media print {
      html,
      body,
      .sheet-shell {
        width: 210mm;
        min-height: 0;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      .sheet-shell {
        --sheet-texture: none;
      }
      .topbar,
      .top-tools,
      .customize-panel,
      .site-footer {
        display: none !important;
      }
      #sheet {
        margin: 0;
        padding: 0;
      }
      .page {
        margin: 0;
        background-image: none !important;
        box-shadow: none;
        break-before: auto;
        break-after: page;
        break-inside: avoid;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
      }
      .page:last-of-type {
        break-after: auto;
        page-break-after: auto;
      }
      .sheet-shell textarea {
        overflow: hidden !important;
      }
      @page {
        size: A4;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="index.html" aria-label="${escapeHtml(locale.title)}"><span class="brand-mark"></span><span>Nimora</span></a>
    <div class="top-actions">
      <a class="top-tool-link" href="character-sheet.html">${escapeHtml(t.title)}</a>
      <nav class="locale-tabs" aria-label="Language">${localeTabs}</nav>
    </div>
  </header>
  <main class="sheet-shell">
    <form id="sheet" autocomplete="off">
      <div class="top-tools">
        <button type="button" id="toggle-customize" aria-expanded="false" aria-controls="customize-panel">${escapeHtml(ui(t, "customize"))}</button>
        <button type="button" id="clear-sheet">${escapeHtml(t.clear)}</button>
        <button type="button" onclick="window.print()">${escapeHtml(t.print)}</button>
      </div>
      ${customizationPanel(t)}
      <section class="page">
        <div class="sheet-header">
          <div class="header-title">${escapeHtml(t.title)}</div>
          <div class="portrait-wrap">
            <div class="portrait-box" id="portrait-box" role="button" tabindex="0" aria-label="${escapeHtml(t.uploadAria)}">
              <img id="portrait-img" alt="">
              <div class="portrait-placeholder" id="portrait-hint">${t.upload}</div>
            </div>
            <input type="file" id="portrait-input" accept="image/*">
          </div>
          <div class="header-main">
            <div class="header-top">
              <div class="charname-row"><label>${escapeHtml(t.name)}</label>${field("charname")}</div>
              <div class="rank-badge"><label>${escapeHtml(t.rank)}</label>${field("rank")}</div>
            </div>
            <div class="header-meta">
              <div class="field">${field("player")}<label>${escapeHtml(t.player)}</label></div>
              <div class="field">${field("campaign")}<label>${escapeHtml(t.campaign)}</label></div>
              <div class="field">${field("archetype")}<label>${escapeHtml(t.archetype)}</label></div>
            </div>
            <div><div class="section-label">${escapeHtml(t.description)}</div>${textarea("description", 'style="height:62px"')}</div>
          </div>
        </div>
        <div class="main-grid">
          <div class="stats-col">
            <div class="left-top">
              <div class="section-label">${escapeHtml(t.characteristics)}</div>
              <div class="characteristics-grid">
                ${stat("body", t.body, "body-rank", "body-mod", t)}
                ${stat("agility", t.agility, "agility-rank", "agility-mod", t)}
                ${stat("mind", t.mind, "mind-rank", "mind-mod", t)}
                ${stat("intuition", t.intuition, "intuition-rank", "intuition-mod", t)}
                ${stat("will", t.will, "will-rank", "will-mod", t)}
                ${stat("influence", t.influence, "influence-rank", "influence-mod", t)}
              </div>
              <div class="health-block exhaustion-block">
                <div class="section-label">${escapeHtml(t.exhaustion)}</div>
                <div class="health-row exhaustion-score">
                  ${field("exhaustion-current")}
                  <span style="color:var(--sheet-border)">/</span>
                  ${field("exhaustion-threshold")}
                </div>
                <div class="health-formula exhaustion-formula" data-exhaustion-formula>${formatExhaustionFormula(t.exhaustionFormula)}</div>
                <div class="exhaustion-note">
                  <div><b>0</b> - ${escapeHtml(t.exhaustion0)}</div>
                  <div><b>1</b> - ${escapeHtml(t.exhaustion1)}</div>
                  <div><b>2</b> - ${escapeHtml(t.exhaustion2)}</div>
                  <div><b>3</b> - ${escapeHtml(t.exhaustion3)}</div>
                </div>
              </div>
            </div>
            <div class="effects-box"><div class="section-label">${escapeHtml(t.effects)}</div>${textarea("effects")}</div>
          </div>
          <div class="middle-col">
            <div class="grow-section"><div class="section-label">${escapeHtml(t.traits)}</div>${textarea("traits")}</div>
            <div class="grow-section"><div class="section-label">${escapeHtml(t.abilities)}</div>${textarea("abilities")}</div>
          </div>
          <div class="right-col">
            <div class="combat-section">
              <div class="section-label">${escapeHtml(combatLabel)}</div>
              <div class="combat-row">
                <div class="combat-stat">${field("hp-current")}<div class="box-title">${escapeHtml(t.hp)}</div></div>
                <div class="combat-stat">${field("defense-rating")}<div class="box-title">${escapeHtml(t.dr)}</div></div>
                <div class="combat-stat">${field("speed")}<div class="box-title">${escapeHtml(t.speed)}</div></div>
              </div>
            </div>
            <div class="health-block">
              <div class="section-label">${escapeHtml(t.health)}</div>
              <div class="health-formula hp-formula"><span>${escapeHtml(t.maxHp)}</span>${field("hp-base")}<span>+</span>${field("hp-dice-count")}<span>x</span>${field("hp-dice")}<span>=</span>${field("hp-max")}</div>
              <div class="death-row"><div class="section-label compact-label">${escapeHtml(t.dying)}</div><div class="death-circles circle-track">${circles("dying", 3)}</div></div>
            </div>
            <div class="inspiration-block">
              <div class="inspiration-row"><div class="section-label compact-label">${escapeHtml(t.inspiration)}</div><div class="inspiration-marks circle-track" aria-label="${escapeHtml(t.inspiration)}">${circles("insp", 3)}</div></div>
              <div class="inspiration-row"><div class="section-label compact-label">${escapeHtml(t.antiInspiration)}</div><div class="inspiration-marks circle-track" aria-label="${escapeHtml(t.antiInspiration)}">${circles("anti-insp", 3)}</div></div>
            </div>
            <div class="grow-section"><div class="section-label">${escapeHtml(t.inventory)}</div>${textarea("inventory")}</div>
          </div>
        </div>
      </section>
      <section class="page">
        <div class="text-page-title">${escapeHtml(t.backstory)}</div>
        ${textarea("backstory", "", "fit-text full-page-text")}
      </section>
      <section class="page">
        <div class="text-page-title">${escapeHtml(t.notes)}</div>
        ${textarea("notes", "", "fit-text full-page-text")}
      </section>
    </form>
  </main>
  <script>
    (() => {
      const storageKey = ${JSON.stringify(storageKey)};
      const customizationStorageKey = ${JSON.stringify(`nimora-character-sheet-customization-${locale.code}`)};
      const sheet = document.getElementById("sheet");
      const shell = document.querySelector(".sheet-shell");
      const portraitBox = document.getElementById("portrait-box");
      const portraitInput = document.getElementById("portrait-input");
      const portraitImg = document.getElementById("portrait-img");
      const portraitHint = document.getElementById("portrait-hint");
      const customizeButton = document.getElementById("toggle-customize");
      const customizePanel = document.getElementById("customize-panel");
      const presetInput = document.getElementById("custom-preset");
      const fontInput = document.getElementById("custom-font");
      const resetStyleButton = document.getElementById("reset-style");
      const resetLabelsButton = document.getElementById("reset-labels");
      const minFontSize = 8;
      const minLineHeight = 8;
      const defaultStatLabels = ${JSON.stringify({
        body: t.body,
        agility: t.agility,
        mind: t.mind,
        intuition: t.intuition,
        will: t.will,
        influence: t.influence,
      })};
      const defaultFormula = ${JSON.stringify(t.exhaustionFormula)};
      const presets = {
        classic: { paper: "#f5efe0", screen: "#3a2a1a", accent: "#8b2020", heading: "#8b2020", border: "#a08060", gold: "#b8960c", ink: "#1a1410", texture: true },
        steel: { paper: "#eef1f2", screen: "#202932", accent: "#2f5268", heading: "#2f5268", border: "#7b8992", gold: "#8a6f3a", ink: "#111820", texture: true },
        forest: { paper: "#f0efd9", screen: "#243225", accent: "#426b3c", heading: "#426b3c", border: "#79885d", gold: "#a7873f", ink: "#172012", texture: true },
        crimson: { paper: "#f7eadc", screen: "#321b1d", accent: "#9f1f2d", heading: "#9f1f2d", border: "#9a6f58", gold: "#c19a2e", ink: "#21100e", texture: true },
        print: { paper: "#ffffff", screen: "#d8d8d8", accent: "#111111", heading: "#111111", border: "#666666", gold: "#444444", ink: "#000000", texture: false },
      };
      const fonts = {
        georgia: "Georgia, \\"Times New Roman\\", serif",
        merriweather: "\\"Merriweather\\", Georgia, serif",
        alegreya: "\\"Alegreya\\", Georgia, serif",
        lora: "\\"Lora\\", Georgia, serif",
        cinzel: "\\"Cinzel\\", Georgia, serif",
        inter: "\\"Inter\\", Arial, sans-serif",
      };

      function fields() {
        return [...sheet.querySelectorAll("input:not([type=file]):not([data-custom-field]), textarea:not([data-custom-field])")];
      }

      function defaultCustomization() {
        return { style: { preset: "classic", font: "georgia", ...presets.classic }, labels: { ...defaultStatLabels } };
      }

      function readCustomization() {
        try {
          const saved = JSON.parse(localStorage.getItem(customizationStorageKey)) || {};
          const defaults = defaultCustomization();
          const preset = presets[saved.style?.preset] ? saved.style.preset : defaults.style.preset;
          return {
            style: { ...defaults.style, ...saved.style, preset },
            labels: { ...defaults.labels, ...saved.labels },
          };
        } catch {
          return defaultCustomization();
        }
      }

      function saveCustomization(customization) {
        localStorage.setItem(customizationStorageKey, JSON.stringify(customization));
      }

      function formatExhaustionFormula(formula) {
        return formula
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replace(/^([\\s\\S]*?)\\bi\\b(?=\\s*=)/, "$1<sub>i</sub>");
      }

      function applyCustomization(customization) {
        const style = customization.style;
        shell.style.setProperty("--sheet-paper", style.paper);
        shell.style.setProperty("--sheet-paper-dark", style.paper);
        shell.style.setProperty("--sheet-paper-mid", style.paper);
        shell.style.setProperty("--sheet-screen-bg", style.screen);
        shell.style.setProperty("--sheet-accent", style.accent);
        shell.style.setProperty("--sheet-heading", style.heading);
        shell.style.setProperty("--sheet-border", style.border);
        shell.style.setProperty("--sheet-border-light", style.border);
        shell.style.setProperty("--sheet-gold", style.gold);
        shell.style.setProperty("--sheet-ink", style.ink);
        shell.style.setProperty("--sheet-font-family", fonts[style.font] || fonts.georgia);
        shell.style.setProperty("--sheet-texture", style.texture ? "var(--sheet-default-texture)" : "none");
        presetInput.value = style.preset;
        fontInput.value = style.font;
        document.querySelectorAll("[data-style-field]").forEach((input) => {
          input.value = style[input.dataset.styleField];
        });
        document.querySelectorAll("[data-stat-field]").forEach((input) => {
          input.value = customization.labels[input.dataset.statField] || "";
        });
        document.querySelectorAll("[data-stat-label]").forEach((item) => {
          item.textContent = customization.labels[item.dataset.statLabel] || defaultStatLabels[item.dataset.statLabel];
        });
        const formula = document.querySelector("[data-exhaustion-formula]");
        if (formula) {
          const formulaText = defaultFormula
            .replace(defaultStatLabels.body, customization.labels.body || defaultStatLabels.body)
            .replace(defaultStatLabels.mind, customization.labels.mind || defaultStatLabels.mind)
            .replace(defaultStatLabels.will, customization.labels.will || defaultStatLabels.will);
          formula.innerHTML = formatExhaustionFormula(formulaText);
        }
        fitAllTextareas();
      }

      function updateCustomization(update) {
        const customization = readCustomization();
        update(customization);
        saveCustomization(customization);
        applyCustomization(customization);
      }

      function fitTextarea(textarea) {
        if (!textarea.dataset.baseFontSize) {
          textarea.dataset.baseFontSize = String(Number.parseFloat(getComputedStyle(textarea).fontSize) || 13);
        }
        if (!textarea.dataset.baseLineHeight) {
          const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight);
          textarea.dataset.baseLineHeight = String(Number.isFinite(lineHeight) ? lineHeight : Number(textarea.dataset.baseFontSize) * 1.25);
        }
        const baseSize = Number.parseFloat(textarea.dataset.baseFontSize);
        const baseLineHeight = Number.parseFloat(textarea.dataset.baseLineHeight);
        let size = baseSize;
        let lineHeight = baseLineHeight;
        textarea.style.overflowY = "hidden";
        textarea.style.fontSize = size + "px";
        textarea.style.lineHeight = lineHeight + "px";
        while (textarea.scrollHeight > textarea.clientHeight + 1 && size > minFontSize) {
          size -= 0.5;
          lineHeight = Math.max(minLineHeight, baseLineHeight * (size / baseSize));
          textarea.style.fontSize = size + "px";
          textarea.style.lineHeight = lineHeight + "px";
        }
        while (textarea.scrollHeight > textarea.clientHeight + 1 && lineHeight > minLineHeight) {
          lineHeight -= 0.5;
          textarea.style.lineHeight = lineHeight + "px";
        }
        textarea.style.overflowY = textarea.scrollHeight > textarea.clientHeight + 1 ? "auto" : "hidden";
      }

      function fitAllTextareas() {
        requestAnimationFrame(() => {
          sheet.querySelectorAll("textarea").forEach(fitTextarea);
        });
      }

      function setPortrait(src) {
        portraitImg.src = src;
        portraitImg.style.display = "block";
        portraitHint.style.display = "none";
      }

      function save() {
        const data = {};
        for (const field of fields()) {
          data[field.name] = field.type === "checkbox" ? field.checked : field.value;
        }
        if (portraitImg.src && portraitImg.style.display !== "none") {
          data.portrait = portraitImg.src;
        }
        localStorage.setItem(storageKey, JSON.stringify(data));
      }

      function load() {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
          fitAllTextareas();
          return;
        }
        const data = JSON.parse(raw);
        for (const field of fields()) {
          if (!Object.prototype.hasOwnProperty.call(data, field.name)) continue;
          if (field.type === "checkbox") field.checked = Boolean(data[field.name]);
          else field.value = data[field.name];
        }
        if (data.portrait) setPortrait(data.portrait);
        fitAllTextareas();
      }

      customizeButton.addEventListener("click", () => {
        const open = !customizePanel.classList.contains("open");
        customizePanel.classList.toggle("open", open);
        customizeButton.setAttribute("aria-expanded", String(open));
      });
      presetInput.addEventListener("change", () => {
        updateCustomization((customization) => {
          const preset = presetInput.value;
          customization.style = { ...customization.style, ...presets[preset], preset };
        });
      });
      fontInput.addEventListener("change", () => {
        updateCustomization((customization) => {
          customization.style.font = fontInput.value;
        });
      });
      document.querySelectorAll("[data-style-field]").forEach((input) => {
        input.addEventListener("input", () => {
          updateCustomization((customization) => {
            customization.style[input.dataset.styleField] = input.value;
          });
        });
      });
      document.querySelectorAll("[data-stat-field]").forEach((input) => {
        input.addEventListener("input", () => {
          updateCustomization((customization) => {
            customization.labels[input.dataset.statField] = input.value.trim() || defaultStatLabels[input.dataset.statField];
          });
        });
      });
      resetStyleButton.addEventListener("click", () => {
        updateCustomization((customization) => {
          customization.style = defaultCustomization().style;
        });
      });
      resetLabelsButton.addEventListener("click", () => {
        updateCustomization((customization) => {
          customization.labels = defaultCustomization().labels;
        });
      });
      portraitBox.addEventListener("click", () => portraitInput.click());
      portraitBox.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          portraitInput.click();
        }
      });
      portraitInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setPortrait(reader.result);
          save();
        };
        reader.readAsDataURL(file);
      });
      sheet.addEventListener("input", (event) => {
        if (event.target.matches("textarea")) requestAnimationFrame(() => fitTextarea(event.target));
        save();
      });
      document.getElementById("clear-sheet").addEventListener("click", () => {
        if (!confirm(${JSON.stringify(t.clearConfirm)})) return;
        localStorage.removeItem(storageKey);
        sheet.reset();
        portraitImg.removeAttribute("src");
        portraitImg.style.display = "none";
        portraitHint.style.display = "flex";
        fitAllTextareas();
      });
      window.addEventListener("resize", fitAllTextareas);
      applyCustomization(readCustomization());
      load();
      setTimeout(fitAllTextareas, 50);
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderCharacterSheetPage, labels };
