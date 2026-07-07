const fs = require("fs");
const path = require("path");

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

  if (firstHeading !== 0) {
    return markdown;
  }

  const title = lines[0].replace(/^#\s+/, "").trim().toLowerCase();
  if (title !== "table of contents" && title !== "содержание") {
    return markdown;
  }

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

    if (skippingLevel === null) {
      result.push(line);
    }
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
      if (current) {
        pages.push(current);
      }
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

  if (current) {
    pages.push(current);
  }

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
  if (href === "rules.en.md") {
    return "../en/important-note.html";
  }
  if (href === "rules.ru.md") {
    return "../ru/важное-замечание.html";
  }
  if (href === "README.md") {
    return "../en/index.html";
  }
  if (href === "README.ru.md") {
    return "../ru/index.html";
  }
  return href;
}

function inlineMarkdown(text) {
  const code = [];
  let result = escapeHtml(text).replace(/`([^`]+)`/g, (_, value) => {
    code.push(`<code>${value}</code>`);
    return `\u0000CODE${code.length - 1}\u0000`;
  });

  result = result
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${escapeHtml(normalizeHref(href))}">${label}</a>`);

  return result.replace(/\u0000CODE(\d+)\u0000/g, (_, index) => code[Number(index)]);
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

function parseBlocks(lines, baseLevel = 1) {
  const html = [];
  const headings = [];
  const usedHeadings = new Set();
  let index = 0;

  function readList(indent = 0) {
    const ordered = /^\s*\d+\.\s+/.test(lines[index]);
    const tag = ordered ? "ol" : "ul";
    const items = [];

    while (index < lines.length) {
      const line = lines[index];
      const match = line.match(/^(\s*)(?:[-*]|\d+\.)\s+(.+)$/);
      if (!match || match[1].length < indent) {
        break;
      }
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
        if (/^(\s*)(?:[-*]|\d+\.)\s+/.test(next) || /^#{1,6}\s+/.test(next)) {
          break;
        }
        if (next.startsWith(" ".repeat(indent + 2))) {
          const trimmed = next.trim();
          if (trimmed.startsWith(">")) {
            itemLines.push(`<span class="list-quote">${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</span>`);
          } else {
            itemLines.push(inlineMarkdown(trimmed));
          }
          index += 1;
          continue;
        }
        break;
      }

      items.push(`<li>${itemLines.join("<br>")}</li>`);
    }

    return `<${tag}>${items.join("")}</${tag}>`;
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
      html.push(`<blockquote>${parseBlocks(quote).html}</blockquote>`);
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
      !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith(">") &&
      !lines[index].trim().startsWith("|") &&
      !/^-{3,}\s*$/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return { html: html.join("\n"), headings };
}

function renderPage(locale, page, pageIndex, pages, allLocales) {
  const parsed = parseBlocks(page.lines);

  const sidebar = pages
    .map((item) => {
      const active = item.slug === page.slug ? " active" : "";
      const href = `${item.slug}.html`;
      return `<a class="nav-link${active}" href="${href}">${escapeHtml(item.title)}</a>`;
    })
    .join("");

  const pageToc = parsed.headings
    .filter((heading) => heading.level > 1 && heading.level <= 3)
    .map((heading) => `<a class="toc-link level-${heading.level}" href="#${heading.id}">${escapeHtml(heading.text)}</a>`)
    .join("");

  const localeTabs = allLocales
    .map((item) => {
      const targetPage =
        item.pages.find((candidate) => candidate.key === page.key) ||
        item.pages[pageIndex] ||
        item.pages[0];
      const active = item.code === locale.code ? " active" : "";
      return `<a class="locale-tab${active}" href="../${item.code}/${targetPage.slug}.html">${escapeHtml(item.languageLabel)}</a>`;
    })
    .join("");

  return `<!doctype html>
<html lang="${locale.code}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} | ${escapeHtml(locale.title)}</title>
  <link rel="stylesheet" href="../assets/styles.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="index.html" aria-label="${escapeHtml(locale.title)}">
      <span class="brand-mark"></span>
      <span>Nimora</span>
    </a>
    <nav class="locale-tabs" aria-label="Language">
      ${localeTabs}
    </nav>
  </header>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-title">${escapeHtml(locale.homeLabel)}</div>
      <nav>${sidebar}</nav>
    </aside>
    <main class="content">
      <article class="doc">
${parsed.html}
      </article>
    </main>
    <aside class="toc" aria-label="On this page">
      ${pageToc}
    </aside>
  </div>
</body>
</html>`;
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

const builtLocales = locales.map((locale) => {
  const readmeFile = fs.existsSync(path.join(root, locale.readmeSource))
    ? locale.readmeSource
    : "README.md";
  const readme = stripSections(fs.readFileSync(path.join(root, readmeFile), "utf8"), ["Rules", "Правила"]);
  const rules = fs.readFileSync(path.join(root, locale.source), "utf8");
  return {
    ...locale,
    pages: [
      ...splitPages(readme, { source: "readme", firstSlug: "index" }),
      ...splitPages(rules, { source: "rules", excludeTitles: ["Overview", "Описание"] }),
    ],
  };
});

for (const locale of builtLocales) {
  for (const page of locale.pages) {
    const pageIndex = locale.pages.indexOf(page);
    const filename = `${page.slug}.html`;
    writeFile(path.join(outDir, locale.code, filename), renderPage(locale, page, pageIndex, locale.pages, builtLocales));
  }
}

writeFile(
  path.join(outDir, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0; url=en/index.html"><title>Nimora</title><link rel="canonical" href="en/index.html"></head><body><a href="en/index.html">Nimora Rules</a></body></html>`
);
writeFile(path.join(outDir, ".nojekyll"), "");
copyFile(path.join(root, "site", "styles.css"), path.join(outDir, "assets", "styles.css"));
