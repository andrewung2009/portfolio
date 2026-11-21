/* ============================================================
   Case study renderer
   Reads ?id=<slug> and renders the matching project from
   data/portfolio.json.
   ============================================================ */
(function () {
  "use strict";

  var UI = window.UI;
  var icon = UI.icon;
  var esc = UI.esc;
  var category = UI.category;
  var coverMarkup = UI.coverMarkup;
  var initials = UI.initials;

  var DATA_URL = "data/portfolio.json";
  var DRAFT_KEY = "portfolioDraft:v1";
  var params = new URLSearchParams(window.location.search);
  var isPreview = params.has("preview");
  var projectId = params.get("id") || "";

  var headerHost = document.getElementById("siteHeader");
  var mainHost = document.getElementById("main");
  var footerHost = document.getElementById("siteFooter");
  var progressBar = document.getElementById("scrollProgress");

  var siteData = null;
  var project = null;
  var projectIndex = -1;

  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.data ? parsed.data : parsed;
    } catch (err) {
      return null;
    }
  }

  function fetchData() {
    return fetch(DATA_URL, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function boot() {
    var draft = isPreview ? readDraft() : null;
    var ready = draft ? Promise.resolve(draft) : fetchData();
    ready
      .then(function (data) {
        siteData = data;
        findProject();
        render();
        bindGlobal();
        updateScrollUI();
      })
      .catch(function (err) {
        renderError(err);
      });
  }

  function findProject() {
    var projects = siteData.projects || [];
    projectIndex = projects.findIndex(function (item) { return item.id === projectId; });
    project = projectIndex >= 0 ? projects[projectIndex] : null;
  }

  function renderError(err) {
    var isFile = window.location.protocol === "file:";
    var message = isFile
      ? "Open this page through <code>start.bat</code> or <code>python -m http.server 8000</code> so it can load <strong>data/portfolio.json</strong>."
      : "Could not load <strong>data/portfolio.json</strong> (" + esc(err.message) + ").";
    headerHost.innerHTML = "";
    footerHost.innerHTML = "";
    mainHost.innerHTML =
      '<section class="case-empty"><div class="container">' +
      '<p class="kicker">Content unavailable</p>' +
      "<h1>Almost there.</h1><p>" + message + "</p>" +
      '<a class="btn btn--primary" href="index.html">Back to the portfolio</a>' +
      "</div></section>";
  }

  function render() {
    if (!project) {
      headerHost.innerHTML = navMarkup(false);
      footerHost.innerHTML = footerMarkup();
      mainHost.innerHTML =
        '<section class="case-empty"><div class="container">' +
        '<p class="kicker">Case study not found</p>' +
        "<h1>That project has moved.</h1>" +
        "<p>We couldn&rsquo;t find a project with that address. Head back to the work index to browse everything.</p>" +
        '<a class="btn btn--primary" href="index.html#work">View all work</a>' +
        "</div></section>";
      return;
    }

    applyMeta();
    headerHost.innerHTML = navMarkup(true);
    mainHost.innerHTML = caseMarkup();
    footerHost.innerHTML = footerMarkup();

    setupReveals();
    setupImageFallbacks();
    setupCaseNav();
    syncThemeToggles();
  }

  function applyMeta() {
    var meta = siteData.meta || {};
    document.title = project.title + " — " + (meta.name || "Portfolio");
    setMeta('meta[name="description"]', "description", project.summary);
    setMeta('meta[property="og:title"]', "property", project.title + " — " + (meta.name || "Case study"), "og:title");
    setMeta('meta[property="og:description"]', "property", project.summary, "og:description");
    setMeta('meta[property="og:type"]', "property", "article", "og:type");
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", currentTheme() === "dark" ? "#0b1120" : "#ffffff");
  }

  function setMeta(selector, attr, value, attrValue) {
    if (!value) return;
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, attrValue || "");
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function themeToggleMarkup() {
    var dark = currentTheme() === "dark";
    return (
      '<button class="theme-toggle" type="button" data-theme-toggle aria-label="' +
      (dark ? "Switch to light mode" : "Switch to dark mode") +
      '" title="' +
      (dark ? "Switch to light mode" : "Switch to dark mode") +
      '">' + icon(dark ? "sun" : "moon") + "</button>"
    );
  }

  function syncThemeToggles() {
    var dark = currentTheme() === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.innerHTML = icon(dark ? "sun" : "moon");
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (err) { /* ignore */ }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1120" : "#ffffff");
    syncThemeToggles();
  }

  function toggleTheme() {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }

  function navMarkup(withLinks) {
    var meta = siteData.meta || {};
    return (
      '<nav class="site-nav is-scrolled" id="siteNav" aria-label="Main navigation">' +
      '<div class="container nav-inner">' +
      '<a class="brand" href="index.html" aria-label="' + esc(meta.name) + ' — home">' +
      '<span class="brand-mark">' + esc(initials(meta.name)) + "</span>" +
      '<span class="brand-text">' +
      '<span class="brand-name">' + esc(meta.name) + "</span>" +
      '<span class="brand-role">' + esc(meta.role) + "</span>" +
      "</span></a>" +
      (withLinks
        ? '<ul class="nav-links">' +
          '<li><a class="nav-link" href="index.html#work">All work</a></li>' +
          '<li><a class="nav-link" href="index.html#about">About</a></li>' +
          '<li><a class="nav-link" href="index.html#journey">Journey</a></li>' +
          "</ul>"
        : "") +
      '<div class="nav-actions">' +
      themeToggleMarkup() +
      '<a class="nav-cta" href="index.html#contact">Let&rsquo;s talk ' + icon("arrowUpRight") + "</a>" +
      "</div></div></nav>"
    );
  }

  function caseMarkup() {
    var cat = category(project.category);
    var meta = siteData.meta || {};
    var next = (siteData.projects || [])[(projectIndex + 1) % (siteData.projects || []).length];

    var metrics = (project.metrics || []).length
      ? '<div class="metrics-row" id="overview">' +
        project.metrics.map(function (metric) {
          return '<div class="metric"><span class="metric-value">' + esc(metric.value) + '</span><span class="metric-label">' + esc(metric.label) + "</span></div>";
        }).join("") +
        "</div>"
      : "";

    var links = (project.links || []).filter(function (link) { return link && link.url; }).map(function (link) {
      return '<a class="btn btn--ghost" href="' + esc(link.url) + '" target="_blank" rel="noopener">' + esc(link.label || "Visit project") + icon("arrowUpRight") + "</a>";
    }).join("");

    var sections = [];
    if (hasContent(project.problem)) sections.push(problemSection());
    if (hasContent(project.process)) sections.push(processSection());
    if (hasContent(project.impact)) sections.push(impactSection());
    if ((project.journey || []).length) sections.push(journeySection());
    if ((project.improvements || []).length) sections.push(improvementsSection());
    if ((project.gallery || []).length) sections.push(gallerySection());

    var navLinks = sections.map(function (section) {
      return '<a href="#' + section.id + '">' + esc(section.navLabel) + "</a>";
    }).join("");

    return (
      '<div class="case-page">' +
      '<section class="case-hero">' +
      '<div class="container">' +
      '<a class="back-link" href="index.html#work">' + icon("arrowLeft") + " All work</a>" +
      '<p class="kicker case-kicker">Case study · ' + esc(cat.label) + " · " + esc(project.year) + "</p>" +
      '<h1 class="case-title">' + esc(project.title) + "</h1>" +
      '<p class="case-summary">' + esc(project.summary) + "</p>" +
      (links ? '<div class="hero-actions">' + links + "</div>" : "") +
      '<dl class="case-meta">' +
      "<div><dt>Role</dt><dd>" + esc(project.role || "Design & development") + "</dd></div>" +
      "<div><dt>Context</dt><dd>" + esc(project.context || "Independent project") + "</dd></div>" +
      "<div><dt>Stack</dt><dd>" + esc((project.tags || []).slice(0, 3).join(", ") || cat.label) + "</dd></div>" +
      "<div><dt>Year</dt><dd>" + esc(project.year) + "</dd></div>" +
      "</dl>" +
      '<div class="case-cover">' + coverMarkup(project, projectIndex + 1) + "</div>" +
      metrics +
      "</div></section>" +
      (navLinks
        ? '<nav class="case-nav" aria-label="Case study sections"><div class="container case-nav-inner">' + navLinks + "</div></nav>"
        : "") +
      sections.map(function (section) { return section.html; }).join("") +
      (next
        ? '<section class="case-next"><div class="container" style="display:flex;align-items:flex-end;justify-content:space-between;gap:32px;flex-wrap:wrap;width:100%">' +
          "<div><p>Next case study</p><a href=\"project.html?id=" + encodeURIComponent(next.id) + "\">" + esc(next.title) + icon("arrowUpRight") + "</a></div>" +
          '<a class="btn btn--ghost" href="index.html#work">All work</a>' +
          "</div></section>"
        : "") +
      "</div>"
    );
  }

  function hasContent(block) {
    if (!block) return false;
    return (block.paragraphs || []).length || (block.bullets || []).length || (block.cards || []).length || (block.features || []).length;
  }

  function section(id, navLabel, index, title, body) {
    return {
      id: id,
      navLabel: navLabel,
      html:
        '<section class="case-section" id="' + id + '">' +
        '<div class="container case-section-grid">' +
        '<div class="case-section-label"><span>' + UI.pad(index) + " — " + esc(navLabel) + "</span><h2>" + esc(title) + "</h2></div>" +
        '<div class="case-content">' + body + "</div>" +
        "</div></section>"
    };
  }

  function prose(paragraphs) {
    if (!(paragraphs || []).length) return "";
    return '<div class="case-prose">' + paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
  }

  function problemSection() {
    var bullets = (project.problem.bullets || []).map(function (bullet) {
      return "<li><strong>" + esc(bullet.title) + "</strong><span>" + esc(bullet.text) + "</span></li>";
    }).join("");
    var body = prose(project.problem.paragraphs) + (bullets ? '<ul class="case-bullets">' + bullets + "</ul>" : "");
    return section("problem", "Problem", 1, project.problem.title || "The problem", body);
  }

  function processSection() {
    var cards = (project.process.cards || []).map(function (card, i) {
      return (
        '<div class="case-card">' +
        '<span class="case-card-index">' + UI.pad(i + 1) + "</span>" +
        "<h3>" + esc(card.title) + "</h3>" +
        "<p>" + esc(card.text) + "</p>" +
        "</div>"
      );
    }).join("");
    var body = prose(project.process.paragraphs) + (cards ? '<div class="case-cards">' + cards + "</div>" : "");
    return section("process", "Approach", 2, project.process.title || "The approach", body);
  }

  function impactSection() {
    var features = (project.impact.features || []).map(function (feature) {
      var bullets = (feature.bullets || []).map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("");
      return (
        '<div class="case-feature">' +
        "<h3>" + esc(feature.title) + "</h3>" +
        "<p>" + esc(feature.text) + "</p>" +
        (bullets ? "<ul>" + bullets + "</ul>" : "") +
        "</div>"
      );
    }).join("");
    var body = prose(project.impact.paragraphs) + (features ? '<div class="case-features">' + features + "</div>" : "");
    return section("impact", "Impact", 3, project.impact.title || "The impact", body);
  }

  function journeySection() {
    var steps = (project.journey || []).map(function (step) {
      var tags = (step.tags || []).map(function (tag) { return '<span class="tag">' + esc(tag) + "</span>"; }).join("");
      return (
        '<div class="journey-step">' +
        '<span class="journey-label">' + esc(step.label) + "</span>" +
        "<h3>" + esc(step.title) + "</h3>" +
        "<p>" + esc(step.description) + "</p>" +
        (tags ? '<div class="journey-tags">' + tags + "</div>" : "") +
        "</div>"
      );
    }).join("");
    return section("journey", "Journey", 4, "How it came together", '<div class="journey">' + steps + "</div>");
  }

  function improvementsSection() {
    var cards = (project.improvements || []).map(function (item, i) {
      return (
        '<div class="case-card">' +
        '<span class="case-card-index">' + UI.pad(i + 1) + "</span>" +
        "<h3>" + esc(item.title) + "</h3>" +
        "<p>" + esc(item.text) + "</p>" +
        "</div>"
      );
    }).join("");
    return section("improvements", "Next", 5, "What I would improve next", '<div class="case-cards">' + cards + "</div>");
  }

  function gallerySection() {
    var figures = (project.gallery || []).map(function (item, i) {
      return (
        "<figure>" +
        '<img src="' + esc(item.url) + '" alt="' + esc(item.alt || project.title + " image " + (i + 1)) + '" loading="lazy" decoding="async">' +
        (item.caption ? "<figcaption>" + esc(item.caption) + "</figcaption>" : "") +
        "</figure>"
      );
    }).join("");
    return section("gallery", "Gallery", 6, "Project gallery", '<div class="case-gallery">' + figures + "</div>");
  }

  function footerMarkup() {
    var footer = siteData.footer || {};
    var meta = siteData.meta || {};
    var firstName = String(meta.name || "Andrew").split(" ")[0];
    return (
      '<footer class="footer">' +
      '<div class="container">' +
      '<div class="footer-inner">' +
      "<span>&copy; " + esc(footer.year || new Date().getFullYear()) + " " + esc(meta.name) + "</span>" +
      "<span><a href=\"index.html#work\">All work</a> · <a href=\"index.html#contact\">Contact</a> · <a href=\"#top\">Back to top &uarr;</a></span>" +
      "</div>" +
      '<div class="footer-giant" aria-hidden="true">' + esc(firstName.toUpperCase()) + "</div>" +
      "</div></footer>"
    );
  }

  function setupReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { observer.observe(el); });
  }

  function setupImageFallbacks() {
    document.querySelectorAll(".cover-img").forEach(function (img) {
      function fail() {
        img.classList.add("is-broken");
        var art = img.closest(".cover-art");
        if (art) art.classList.remove("has-image");
      }
      img.addEventListener("error", fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  var lastFrame = null;

  function setupCaseNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".case-nav a"));
    if (!links.length) return;
    var sections = links.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);

    window.addEventListener("scroll", function () {
      if (lastFrame) return;
      lastFrame = requestAnimationFrame(function () {
        lastFrame = null;
        var y = window.scrollY + 160;
        var current = sections[0];
        sections.forEach(function (section) {
          if (section && y >= section.offsetTop) current = section;
        });
        links.forEach(function (link) {
          var active = current && link.getAttribute("href") === "#" + current.id;
          link.classList.toggle("is-active", active);
        });

        if (progressBar) {
          var height = document.documentElement.scrollHeight - window.innerHeight;
          progressBar.style.width = Math.max(0, Math.min(100, (window.scrollY / (height || 1)) * 100)) + "%";
        }
      });
    }, { passive: true });
  }

  function updateScrollUI() {
    if (progressBar) {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = Math.max(0, Math.min(100, (window.scrollY / (height || 1)) * 100)) + "%";
    }
  }

  function bindGlobal() {
    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-theme-toggle]")) toggleTheme();
    });
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "portfolio-preview" || !event.data.data) return;
      siteData = event.data.data;
      findProject();
      render();
    });
    if (isPreview) {
      window.addEventListener("storage", function (event) {
        if (event.key !== DRAFT_KEY) return;
        var draft = readDraft();
        if (!draft) return;
        siteData = draft;
        findProject();
        render();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
