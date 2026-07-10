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
  const releaseLink = document.querySelector("[data-release-link]");
  const credit = document.querySelector("[data-credit]");
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
    window.scrollTo(0, 0);
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
    const customizationStorageKey = `nimora-character-sheet-customization-${locale}`;
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
      georgia: "Georgia, \"Times New Roman\", serif",
      merriweather: "\"Merriweather\", Georgia, serif",
      alegreya: "\"Alegreya\", Georgia, serif",
      lora: "\"Lora\", Georgia, serif",
      cinzel: "\"Cinzel\", Georgia, serif",
      inter: "\"Inter\", Arial, sans-serif",
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
        formula.textContent = defaultFormula
          .replace(defaultStatLabels.body, customization.labels.body || defaultStatLabels.body)
          .replace(defaultStatLabels.mind, customization.labels.mind || defaultStatLabels.mind)
          .replace(defaultStatLabels.will, customization.labels.will || defaultStatLabels.will);
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
      portraitHint.style.display = "block";
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
