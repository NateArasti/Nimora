"use strict";

(() => {
  const data = window.NIMORA_DATA;
  const storageKey = "nimora-site-state";
  const root = document.documentElement;
  const content = document.querySelector("#content");
  const layout = document.querySelector("[data-layout]");
  const sidebarTitle = document.querySelector(".sidebar-title");
  const sidebarNav = document.querySelector(".sidebar-nav");
  const toc = document.querySelector(".toc");
  const localeTabs = document.querySelector(".locale-tabs");
  const toolLink = document.querySelector(".top-tool-link");
  const brand = document.querySelector("[data-brand]");
  let sheetInitialized = false;

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
  }

  function button(className, text, active, attrs = "") {
    return `<button class="${className}${active ? " active" : ""}" type="button" ${attrs}>${escapeHtml(text)}</button>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderShell(locale, page) {
    document.title = `${page.title} | ${locale.title}`;
    root.lang = locale.code;
    sidebarTitle.textContent = locale.homeLabel;
    toolLink.textContent = data.sheets[locale.code].labels.title;
    toolLink.classList.toggle("active", page.type === "character-sheet");

    const pageIndex = locale.pages.findIndex((item) => item.key === page.key);
    localeTabs.innerHTML = data.locales
      .map((item) => {
        const target = item.pages.find((candidate) => candidate.key === page.key) || item.pages[pageIndex] || item.pages[0];
        const disabled = item.code === locale.code ? " disabled" : "";
        return button("locale-tab", item.languageLabel, item.code === locale.code, `data-locale="${item.code}" data-page-key="${target.key}"${disabled}`);
      })
      .join("");

    sidebarNav.innerHTML = locale.pages
      .filter((item) => item.type !== "character-sheet")
      .map((item) => button("nav-link", item.title, item.key === page.key, `data-page-key="${item.key}"`))
      .join("");
  }

  function renderDoc(page) {
    layout.classList.remove("sheet-mode");
    content.innerHTML = `<article class="doc">${page.html}</article>`;
    toc.innerHTML = (page.headings || [])
      .map((heading) => `<button class="toc-link level-${heading.level}" type="button" data-heading="${heading.id}">${escapeHtml(heading.text)}</button>`)
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

    const characterStorageKey = `nimora-character-sheet-${locale}`;
    const portraitBox = document.getElementById("portrait-box");
    const portraitInput = document.getElementById("portrait-input");
    const portraitImg = document.getElementById("portrait-img");
    const portraitHint = document.getElementById("portrait-hint");
    const clearButton = document.getElementById("clear-sheet");
    const minFontSize = 8;
    const minLineHeight = 8;

    function fields() {
      return [...sheet.querySelectorAll("input:not([type=file]), textarea")];
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
      portraitHint.style.display = "block";
      fitAllTextareas();
    });
    window.addEventListener("resize", fitAllTextareas);
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
