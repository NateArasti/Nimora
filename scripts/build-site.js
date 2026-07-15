const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { renderCharacterSheetPage, labels: sheetLabels } = require("./character-sheet");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs");

const locales = [
  {
    code: "en",
    source: "rules.en.md",
    readmeSource: "README.md",
    title: "Nimora Rules",
    languageLabel: "English",
    homeLabel: "Documentation",
  },
  {
    code: "ru",
    source: "rules.ru.md",
    readmeSource: "README.ru.md",
    title: "Правила Nimora",
    languageLabel: "Русский",
    homeLabel: "Документация",
  },
];

const site = {
  version: "v0.2.0",
  repository: "https://github.com/NateArasti/Nimora",
  latestRelease: "https://github.com/NateArasti/Nimora/releases/latest",
  author: "https://github.com/NateArasti",
  labels: {
    en: { release: "Latest release", credit: "Made by" },
    ru: { release: "Последний релиз", credit: "Создано" },
  },
};

function createBuildId() {
  const hash = crypto.createHash("sha256");
  const inputs = [
    "README.md",
    "README.ru.md",
    "rules.en.md",
    "rules.ru.md",
    "scripts/build-site.js",
    "scripts/character-sheet.js",
    "site/styles.css",
  ];

  for (const input of inputs) {
    hash.update(fs.readFileSync(path.join(root, input)));
  }

  return hash.digest("hex").slice(0, 12);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "section";
}

function uniqueSlug(base, used) {
  let slug = base;
  let index = 2;

  while (used.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  used.add(slug);
  return slug;
}

function stripManualToc(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const firstHeading = lines.findIndex((line) => /^#\s+/.test(line));

  if (firstHeading !== 0) return markdown;

  const title = lines[0].replace(/^#\s+/, "").trim().toLowerCase();
  if (title !== "table of contents" && title !== "содержание") return markdown;

  const separator = lines.findIndex((line, index) => index > 0 && /^-{3,}\s*$/.test(line));
  return separator === -1 ? lines.slice(1).join("\n") : lines.slice(separator + 1).join("\n");
}

function stripSections(markdown, titles) {
  const normalizedTitles = new Set(titles.map((title) => title.toLowerCase()));
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const result = [];
  let skippingLevel = null;

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim().toLowerCase();

      if (skippingLevel !== null && level <= skippingLevel) {
        skippingLevel = null;
      }

      if (skippingLevel === null && normalizedTitles.has(title)) {
        skippingLevel = level;
        continue;
      }
    }

    if (skippingLevel === null) result.push(line);
  }

  return result.join("\n");
}

function splitPages(markdown, options = {}) {
  const lines = stripManualToc(markdown).split("\n");
  const pages = [];
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      if (current) pages.push(current);
      current = {
        title: match[1].trim(),
        lines: [line],
      };
      continue;
    }

    if (current) {
      if (/^-{3,}\s*$/.test(line) && lines.slice(index + 1).some((next) => /^#\s+/.test(next))) {
        continue;
      }
      current.lines.push(line);
    }
  }

  if (current) pages.push(current);

  const used = new Set();
  return pages
    .filter((page) => !options.excludeTitles?.some((title) => title.toLowerCase() === page.title.toLowerCase()))
    .map((page, index) => ({
      ...page,
      source: options.source || "content",
      key: `${options.source || "content"}:${slugify(page.title)}`,
      slug: index === 0 && options.firstSlug ? options.firstSlug : uniqueSlug(slugify(page.title), used),
    }));
}

function normalizeHref(href) {
  const targets = {
    "rules.en.md": "app:en:rules:important-note",
    "rules.ru.md": "app:ru:rules:важное-замечание",
    "README.md": "app:en:readme:index",
    "README.ru.md": "app:ru:readme:index",
    "LICENSE.md": "https://github.com/NateArasti/Nimora/blob/main/LICENSE.md",
  };
  return targets[href] || href;
}

function inlineMarkdown(text) {
  const code = [];
  let result = escapeHtml(text).replace(/`([^`]+)`/g, (_, value) => {
    code.push(`<code>${value}</code>`);
    return `\u0000CODE${code.length - 1}\u0000`;
  });
  const math = [];
  result = result.replace(/\$([^$\n]+)\$/g, (_, value) => {
    math.push(`<span class="math-inline">${renderMath(value)}</span>`);
    return `\u0000MATH${math.length - 1}\u0000`;
  });

  result = result
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${escapeHtml(normalizeHref(href))}">${label}</a>`);

  return result
    .replace(/\u0000MATH(\d+)\u0000/g, (_, index) => math[Number(index)])
    .replace(/\u0000CODE(\d+)\u0000/g, (_, index) => code[Number(index)]);
}

function renderMath(value) {
  return escapeHtml(value.trim()).replace(
    /([\p{L}\p{N}])_(?:\{([^}]+)\}|([\p{L}\p{N}]+))/gu,
    (_, base, braced, plain) => `${base}<sub>${braced || plain}</sub>`
  );
}

function parseTable(lines) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );
  const head = rows[0] || [];
  const body = rows.slice(2);

  return `<div class="table-wrap"><table><thead><tr>${head
    .map((cell) => `<th>${inlineMarkdown(cell)}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function parseBlocks(lines, baseLevel = 1, options = {}) {
  const html = [];
  const headings = [];
  const usedHeadings = new Set();
  let index = 0;

  function readList(indent = 0) {
    const listStart = lines[index].match(/^\s*(\d+)\.\s+/);
    const ordered = Boolean(listStart);
    const tag = ordered ? "ol" : "ul";
    const attributes = ordered && listStart[1] !== "1" ? ` start="${escapeHtml(listStart[1])}"` : "";
    const items = [];

    while (index < lines.length) {
      const line = lines[index];
      const match = line.match(/^(\s*)(?:[-*]|\d+\.)\s+(.+)$/);
      if (!match || match[1].length < indent) break;
      if (match[1].length > indent) {
        const nested = readList(match[1].length);
        items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, `${nested}</li>`);
        continue;
      }

      const itemLines = [inlineMarkdown(match[2])];
      index += 1;

      while (index < lines.length) {
        const next = lines[index];
        if (!next.trim()) {
          index += 1;
          break;
        }
        if (/^(\s*)(?:[-*]|\d+\.)\s+/.test(next) || /^#{1,6}\s+/.test(next)) break;
        if (next.startsWith(" ".repeat(indent + 2))) {
          const trimmed = next.trim();
          itemLines.push(trimmed.startsWith(">") ? `<span class="list-quote">${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</span>` : inlineMarkdown(trimmed));
          index += 1;
          continue;
        }
        break;
      }

      items.push(`<li>${itemLines.join("<br>")}</li>`);
    }

    return `<${tag}${attributes}>${items.join("")}</${tag}>`;
  }

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) {
      html.push("<hr>");
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      const code = codeLines.join("\n");
      if (fence[1] === "text" && code.includes("_")) {
        html.push(`<div class="math-block">${renderMath(code)}</div>`);
      } else {
        html.push(`<pre><code${language}>${escapeHtml(code)}</code></pre>`);
      }
      continue;
    }

    const singleLineMath = line.match(/^\$\$\s*(.+?)\s*\$\$\s*$/);
    if (singleLineMath) {
      html.push(`<div class="math-block">${renderMath(singleLineMath[1])}</div>`);
      index += 1;
      continue;
    }

    if (/^\$\$\s*$/.test(line)) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^\$\$\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(`<div class="math-block">${renderMath(codeLines.join("\n"))}</div>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + baseLevel - 1);
      const text = heading[2].trim();
      const id = uniqueSlug(slugify(text), usedHeadings);
      headings.push({ level, text, id });
      html.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.trim().startsWith("|") && lines[index + 1] && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])) {
      const tableLines = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(parseTable(tableLines));
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quote = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${parseBlocks(quote, 1, { preserveLineBreaks: true }).html}</blockquote>`);
      continue;
    }

    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      html.push(readList(line.match(/^(\s*)/)[1].length));
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,6}\s+/.test(lines[index]) &&
      !/^```/.test(lines[index]) &&
      !/^\$\$/.test(lines[index]) &&
      !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith(">") &&
      !lines[index].trim().startsWith("|") &&
      !/^-{3,}\s*$/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    const paragraphHtml = options.preserveLineBreaks
      ? paragraph.map((item) => inlineMarkdown(item)).join("<br>")
      : inlineMarkdown(paragraph.join(" "));
    html.push(`<p>${paragraphHtml}</p>`);
  }

  return { html: html.join("\n"), headings };
}

function extractBetween(source, startPattern, endPattern) {
  const start = source.search(startPattern);
  if (start === -1) return "";
  const startMatch = source.slice(start).match(startPattern);
  const contentStart = start + startMatch[0].length;
  const end = source.slice(contentStart).search(endPattern);
  return end === -1 ? "" : source.slice(contentStart, contentStart + end);
}

function extractSheet(pageHtml) {
  return {
    style: extractBetween(pageHtml, /<style>\s*/, /\s*<\/style>/),
    html: pageHtml.match(/<main class="sheet-shell">[\s\S]*?<\/main>/)?.[0] || "",
  };
}

function buildData() {
  const builtLocales = locales.map((locale) => {
    const readmeFile = fs.existsSync(path.join(root, locale.readmeSource)) ? locale.readmeSource : "README.md";
    const readme = stripSections(fs.readFileSync(path.join(root, readmeFile), "utf8"), ["Rules", "Правила", "Localizations", "Локализации"]);
    const rules = fs.readFileSync(path.join(root, locale.source), "utf8");
    return {
      ...locale,
      pages: [
        ...splitPages(readme, { source: "readme", firstSlug: "index" }),
        ...splitPages(rules, { source: "rules", excludeTitles: ["Overview", "Описание"] }),
        {
          title: sheetLabels[locale.code].title,
          lines: [],
          source: "tool",
          key: "tool:character-sheet",
          slug: "character-sheet",
          type: "character-sheet",
        },
      ],
    };
  });

  const sheets = {};
  let sheetStyle = "";

  for (const locale of builtLocales) {
    locale.pages = locale.pages.map((page) => {
      if (page.type === "character-sheet") {
        const html = renderCharacterSheetPage({ locale, page, allLocales: builtLocales });
        const sheet = extractSheet(html);
        sheetStyle = sheetStyle || sheet.style;
        sheets[locale.code] = {
          html: sheet.html,
          labels: sheetLabels[locale.code],
        };
        return {
          title: page.title,
          source: page.source,
          key: page.key,
          slug: page.slug,
          type: page.type,
        };
      }

      const parsed = parseBlocks(page.lines);
      return {
        title: page.title,
        source: page.source,
        key: page.key,
        slug: page.slug,
        type: "doc",
        html: parsed.html,
        headings: parsed.headings.filter((heading) => heading.level > 1 && heading.level <= 4),
      };
    });
  }

  return { locales: builtLocales, sheets, sheetStyle, site: { ...site, buildId: createBuildId() } };
}

function renderIndex(data) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nimora</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Cinzel:wght@400;700&family=Inter:wght@400;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/styles.css">
  <style>${data.sheetStyle}</style>
</head>
<body>
  <header class="topbar">
    <button class="brand" type="button" data-brand>
      <span class="brand-mark"></span>
      <span class="brand-copy"><span class="brand-name">Nimora</span><span class="brand-version">${data.site.version}</span></span>
    </button>
    <div class="top-actions">
      <a class="top-link" href="${data.site.repository}" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 22v-3.87a4.15 4.15 0 0 0-1-3.11c3.28-.36 6.72-1.61 6.72-7.27A5.68 5.68 0 0 0 19.2 3.8 5.3 5.3 0 0 0 19.06.66S17.86.28 15 2.2a13.1 13.1 0 0 0-6 0C6.14.28 4.94.66 4.94.66A5.3 5.3 0 0 0 4.8 3.8a5.68 5.68 0 0 0-1.52 3.95C3.28 13.4 6.72 14.65 10 15a4.15 4.15 0 0 0-1 3.11V22"></path><path d="M9 18c-4.51 1.5-5-2-7-2"></path></svg><span>GitHub</span></a>
      <a class="top-link" data-release-link href="${data.site.latestRelease}" target="_blank" rel="noreferrer" title="Latest release"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg><span></span></a>
      <button class="top-tool-link" type="button" data-page-key="tool:character-sheet"></button>
      <nav class="locale-tabs" aria-label="Language"></nav>
    </div>
  </header>
  <div class="layout" data-layout>
    <aside class="sidebar">
      <div class="sidebar-title"></div>
      <nav class="sidebar-nav"></nav>
    </aside>
    <main class="content" id="content" tabindex="-1"></main>
    <aside class="toc" aria-label="On this page"></aside>
  </div>
  <footer class="site-footer"><span data-credit></span> <a href="${data.site.author}" target="_blank" rel="noreferrer">NateArasti</a></footer>
  <script>window.NIMORA_DATA = ${JSON.stringify({
    locales: data.locales.map((locale) => ({
      code: locale.code,
      title: locale.title,
      languageLabel: locale.languageLabel,
      homeLabel: locale.homeLabel,
      pages: locale.pages,
    })),
    sheets: data.sheets,
    site: data.site,
  })};</script>
  <script src="assets/app.js"></script>
</body>
</html>`;
}

function renderAppScript() {
  return `"use strict";

(() => {
  const data = window.NIMORA_DATA;
  const storageKey = "nimora-site-state-" + data.site.buildId;
  const root = document.documentElement;
  const content = document.querySelector("#content");
  const layout = document.querySelector("[data-layout]");
  const sidebarTitle = document.querySelector(".sidebar-title");
  const sidebarNav = document.querySelector(".sidebar-nav");
  const toc = document.querySelector(".toc");
  const localeTabs = document.querySelector(".locale-tabs");
  const toolLink = document.querySelector(".top-tool-link");
  const releaseLink = document.querySelector("[data-release-link]");
  const credit = document.querySelector("[data-credit]");
  const brand = document.querySelector("[data-brand]");
  let sheetInitialized = false;

  clearOldSiteState();
  const saved = readState();
  let localeCode = data.locales.some((locale) => locale.code === saved.locale) ? saved.locale : data.locales[0].code;
  let pageKey = saved.pageKey || currentLocale().pages[0].key;

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }

  function clearOldSiteState() {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key === "nimora-site-state" || (key.startsWith("nimora-site-state-") && key !== storageKey)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Keep the site usable when browser storage is unavailable.
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify({ locale: localeCode, pageKey }));
  }

  function currentLocale() {
    return data.locales.find((locale) => locale.code === localeCode) || data.locales[0];
  }

  function currentPage() {
    const locale = currentLocale();
    return locale.pages.find((page) => page.key === pageKey) || locale.pages[0];
  }

  function setPage(nextKey, nextLocale = localeCode) {
    localeCode = nextLocale;
    const locale = currentLocale();
    pageKey = locale.pages.some((page) => page.key === nextKey) ? nextKey : locale.pages[0].key;
    saveState();
    render();
    window.scrollTo(0, 0);
  }

  function button(className, text, active, attrs = "") {
    return \`<button class="\${className}\${active ? " active" : ""}" type="button" \${attrs}>\${escapeHtml(text)}</button>\`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderShell(locale, page) {
    document.title = \`\${page.title} | \${locale.title}\`;
    root.lang = locale.code;
    sidebarTitle.textContent = locale.homeLabel;
    toolLink.textContent = data.sheets[locale.code].labels.title;
    const releaseLabel = data.site.labels[locale.code].release;
    releaseLink.lastElementChild.textContent = releaseLabel;
    releaseLink.setAttribute("aria-label", releaseLabel);
    releaseLink.title = releaseLabel;
    credit.textContent = data.site.labels[locale.code].credit;
    toolLink.classList.toggle("active", page.type === "character-sheet");

    const pageIndex = locale.pages.findIndex((item) => item.key === page.key);
    localeTabs.innerHTML = data.locales
      .map((item) => {
        const target = item.pages.find((candidate) => candidate.key === page.key) || item.pages[pageIndex] || item.pages[0];
        const disabled = item.code === locale.code ? " disabled" : "";
        return button("locale-tab", item.languageLabel, item.code === locale.code, \`data-locale="\${item.code}" data-page-key="\${target.key}"\${disabled}\`);
      })
      .join("");

    sidebarNav.innerHTML = locale.pages
      .filter((item) => item.type !== "character-sheet")
      .map((item) => button("nav-link", item.title, item.key === page.key, \`data-page-key="\${item.key}"\`))
      .join("");
  }

  function renderDoc(page) {
    layout.classList.remove("sheet-mode");
    content.innerHTML = \`<article class="doc">\${page.html}</article>\`;
    toc.innerHTML = (page.headings || [])
      .map((heading) => \`<button class="toc-link level-\${heading.level}" type="button" data-heading="\${heading.id}">\${escapeHtml(heading.text)}</button>\`)
      .join("");
    sheetInitialized = false;
  }

  function renderSheet(locale) {
    layout.classList.add("sheet-mode");
    sheetInitialized = false;
    content.innerHTML = data.sheets[locale.code].html;
    toc.innerHTML = "";
    initCharacterSheet(locale.code, data.sheets[locale.code].labels);
  }

  function swapContent(update) {
    content.classList.remove("content-enter");
    update();
    requestAnimationFrame(() => content.classList.add("content-enter"));
  }

  function render() {
    const locale = currentLocale();
    const page = currentPage();
    renderShell(locale, page);
    swapContent(() => {
      if (page.type === "character-sheet") renderSheet(locale);
      else renderDoc(page);
    });
  }

  function initCharacterSheet(locale, labels) {
    if (sheetInitialized) return;
    sheetInitialized = true;

    const sheet = document.getElementById("sheet");
    if (!sheet) return;

    const characterStorageKey = \`nimora-character-sheet-\${locale}\`;
    const customizationStorageKey = \`nimora-character-sheet-customization-\${locale}\`;
    const shell = document.querySelector(".sheet-shell");
    const portraitBox = document.getElementById("portrait-box");
    const portraitInput = document.getElementById("portrait-input");
    const portraitImg = document.getElementById("portrait-img");
    const portraitHint = document.getElementById("portrait-hint");
    const clearButton = document.getElementById("clear-sheet");
    const customizeButton = document.getElementById("toggle-customize");
    const customizePanel = document.getElementById("customize-panel");
    const presetInput = document.getElementById("custom-preset");
    const fontInput = document.getElementById("custom-font");
    const resetStyleButton = document.getElementById("reset-style");
    const resetLabelsButton = document.getElementById("reset-labels");
    const minFontSize = 8;
    const minLineHeight = 8;
    const defaultStatLabels = {
      body: labels.body,
      agility: labels.agility,
      mind: labels.mind,
      intuition: labels.intuition,
      will: labels.will,
      influence: labels.influence,
    };
    const defaultFormula = labels.exhaustionFormula;
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
      const values = {};
      for (const field of fields()) {
        values[field.name] = field.type === "checkbox" ? field.checked : field.value;
      }
      if (portraitImg.src && portraitImg.style.display !== "none") values.portrait = portraitImg.src;
      localStorage.setItem(characterStorageKey, JSON.stringify(values));
    }

    function load() {
      const raw = localStorage.getItem(characterStorageKey);
      if (!raw) {
        fitAllTextareas();
        return;
      }
      const values = JSON.parse(raw);
      for (const field of fields()) {
        if (!Object.prototype.hasOwnProperty.call(values, field.name)) continue;
        if (field.type === "checkbox") field.checked = Boolean(values[field.name]);
        else field.value = values[field.name];
      }
      if (values.portrait) setPortrait(values.portrait);
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
    clearButton.addEventListener("click", () => {
      if (!confirm(labels.clearConfirm)) return;
      localStorage.removeItem(characterStorageKey);
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
  }

  document.addEventListener("click", (event) => {
    const appLink = event.target.closest("a[href^='app:']");
    if (appLink) {
      event.preventDefault();
      const [, nextLocale, source, slug] = appLink.getAttribute("href").split(":");
      const locale = data.locales.find((item) => item.code === nextLocale) || currentLocale();
      const target = locale.pages.find((page) => page.source === source && page.slug === slug) || locale.pages[0];
      setPage(target.key, locale.code);
      return;
    }

    const headingButton = event.target.closest("[data-heading]");
    if (headingButton) {
      const target = document.getElementById(headingButton.dataset.heading);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const pageButton = event.target.closest("[data-page-key]");
    if (pageButton) {
      setPage(pageButton.dataset.pageKey, pageButton.dataset.locale || localeCode);
      return;
    }

    if (event.target.closest("[data-brand]")) {
      setPage(currentLocale().pages[0].key);
    }
  });

  render();
})();
`;
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.rmSync(outDir, { recursive: true, force: true });

const data = buildData();
writeFile(path.join(outDir, "index.html"), renderIndex(data));
writeFile(path.join(outDir, "assets", "app.js"), renderAppScript());
writeFile(path.join(outDir, ".nojekyll"), "");
copyFile(path.join(root, "site", "styles.css"), path.join(outDir, "assets", "styles.css"));
copyFile(path.join(root, "site", "favicon.svg"), path.join(outDir, "assets", "favicon.svg"));
