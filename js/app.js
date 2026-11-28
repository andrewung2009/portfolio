/* ============================================================
   Homepage renderer
   Reads data/portfolio.json and builds the whole page.
   Also supports live preview from admin via ?preview=1
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

  var headerHost = document.getElementById("siteHeader");
  var mainHost = document.getElementById("main");
  var footerHost = document.getElementById("siteFooter");
  var toastEl = document.getElementById("toast");

  var siteData = null;
  var revealObserver = null;
  var toastTimer = null;

  var NAV_ITEMS = [
    { id: "about", label: "About" },
    { id: "work", label: "Work" },
    { id: "buildlog", label: "Build log" },
    { id: "contact", label: "Contact" }
  ];

  /* ---------- data ---------- */

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
    return fetch(DATA_URL, { cache: "no-cache" }).then(function (res) {
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
        render();
        bindGlobal();
        if (window.location.hash && window.location.hash.length > 1) {
          window.setTimeout(function () {
            try {
              var target = document.querySelector(window.location.hash);
              if (target) target.scrollIntoView();
            } catch (err) { /* ignore */ }
          }, 120);
        }
      })
      .catch(function (err) {
        renderError(err);
      });
  }

  function renderError(err) {
    var isFile = window.location.protocol === "file:";
    var message = isFile
      ? "This page needs a local web server so it can load <strong>data/portfolio.json</strong>. Run <code>start.bat</code> (or <code>python -m http.server 8000</code>) in this folder, then open <code>http://localhost:8000</code>."
      : "Could not load <strong>data/portfolio.json</strong> (" + esc(err.message) + "). Check that the file exists, then reload.";
    headerHost.innerHTML = "";
    footerHost.innerHTML = "";
    mainHost.innerHTML =
      '<section class="load-error"><div class="container">' +
      '<p class="kicker">Content unavailable</p>' +
      "<h1>Almost there.</h1>" +
      "<p>" + message + "</p>" +
      '<a class="btn btn--primary" href="' + DATA_URL + '">Open the data file</a>' +
      "</div></section>";
  }

  /* ---------- render ---------- */

  function render() {
    applyMeta();
    headerHost.innerHTML = navMarkup();
    mainHost.innerHTML =
      heroMarkup() +
      marqueeMarkup() +
      aboutMarkup() +
      workMarkup() +
      buildlogMarkup() +
      contactMarkup();
    footerHost.innerHTML = footerMarkup();

    setupMenu();
    setupMarquee();
    setupReveals();
    setupImageFallbacks();
    syncThemeToggles();
    updateScrollUI();
  }

  /* A ruled ledger line opens each section: the section's name on the left,
     one piece of real metadata on the right. It replaces the stacked kicker. */
  function ledger(label, meta) {
    return (
      '<div class="ledger reveal">' +
      '<span class="ledger-label">' + esc(label) + "</span>" +
      (meta ? '<span class="ledger-meta">' + esc(meta) + "</span>" : "") +
      "</div>"
    );
  }

  function applyMeta() {
    var meta = siteData.meta || {};
    document.title = (meta.name || "Portfolio") + " — " + (meta.role || "Student developer");
    setMeta('meta[name="description"]', "description", meta.role + " based in " + meta.location + ". Projects across education, logistics, hardware and AI.");
    setMeta('meta[property="og:title"]', "property", meta.name + " — " + meta.role, "og:title");
    setMeta('meta[property="og:description"]', "property", (siteData.hero && siteData.hero.intro) || meta.role, "og:description");
    setMeta('meta[property="og:type"]', "property", "website", "og:type");
    if (meta.siteUrl) setMeta('link[rel="canonical"]', "rel", meta.siteUrl, "canonical");
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", currentTheme() === "dark" ? "#0b1120" : "#ffffff");
  }

  function setMeta(selector, attr, value, attrValue) {
    if (!value) return;
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement(selector.indexOf("link") === 0 ? "link" : "meta");
      el.setAttribute(attr, attrValue || selector.match(/="([^"]+)"/)[1]);
      document.head.appendChild(el);
    }
    el.setAttribute(selector.indexOf("link") === 0 ? "href" : "content", value);
  }

  /* ---------- navigation ---------- */

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

  function navMarkup() {
    var meta = siteData.meta || {};
    var links = NAV_ITEMS.map(function (item) {
      return '<li><a class="nav-link" href="#' + item.id + '" data-section="' + item.id + '">' + esc(item.label) + "</a></li>";
    }).join("");

    var mobileLinks = NAV_ITEMS.map(function (item, i) {
      return (
        '<li><a href="#' + item.id + '">' + esc(item.label) +
        "<span>" + UI.pad(i + 1) + "</span></a></li>"
      );
    }).join("");

    return (
      '<nav class="site-nav" id="siteNav" aria-label="Main navigation">' +
      '<div class="container nav-inner">' +
      '<a class="brand" href="#top" aria-label="' + esc(meta.name) + ' — home">' +
      '<span class="brand-mark">' + esc(initials(meta.name)) + "</span>" +
      '<span class="brand-text">' +
      '<span class="brand-name">' + esc(meta.name) + "</span>" +
      '<span class="brand-role">' + esc(meta.role) + "</span>" +
      "</span></a>" +
      '<ul class="nav-links">' + links + "</ul>" +
      '<div class="nav-actions">' +
      (meta.availability
        ? '<span class="nav-status"><span class="status-dot"></span>' + esc(meta.availability) + "</span>"
        : "") +
      themeToggleMarkup() +
      '<a class="nav-cta" href="#contact">Let&rsquo;s talk ' + icon("arrowUpRight") + "</a>" +
      '<button class="nav-toggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">' +
      icon("menu") + "</button>" +
      "</div></div></nav>" +
      '<div class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Mobile navigation" aria-hidden="true">' +
      '<ul class="mobile-links">' + mobileLinks + "</ul>" +
      '<div class="mobile-footer">' +
      '<a class="btn btn--primary mobile-cta" href="#contact">Start a conversation ' + icon("arrowUpRight") + "</a>" +
      "<p>" + esc(meta.location) + "</p>" +
      (meta.email ? '<a href="mailto:' + esc(meta.email) + '">' + esc(meta.email) + "</a>" : "") +
      '<span class="nav-status"><span class="status-dot"></span>' + esc(meta.availability || "Open to collaborations") + "</span>" +
      "</div></div>"
    );
  }

  function setupMenu() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    menu.inert = true;

    function close() {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      menu.inert = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      toggle.innerHTML = icon("menu");
      document.body.classList.remove("menu-open");
      if (mainHost) mainHost.inert = false;
      if (footerHost) footerHost.inert = false;
      if (menu.contains(document.activeElement)) toggle.focus();
    }

    function open() {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      menu.inert = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      toggle.innerHTML = icon("close");
      document.body.classList.add("menu-open");
      if (mainHost) mainHost.inert = true;
      if (footerHost) footerHost.inert = true;
      var firstLink = menu.querySelector("a[href], button");
      if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 30);
    }

    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) close();
      else open();
    });

    menu.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var focusables = Array.prototype.slice.call(menu.querySelectorAll("a[href], button"))
        .filter(function (el) { return el.offsetParent !== null && !el.disabled; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", close);
    });
  }

  /* ---------- hero ---------- */

  function heroMarkup() {
    var meta = siteData.meta || {};
    var hero = siteData.hero || {};
    var name = meta.name || "";
    var portrait = hero.portrait
      ? '<img class="portrait-img" src="' + esc(hero.portrait) + '"' +
        (hero.portraitSrcset ? ' srcset="' + esc(hero.portraitSrcset) + '" sizes="(max-width: 620px) 92vw, 380px"' : "") +
        ' alt="Portrait of ' + esc(name) + '" width="' + (hero.portraitWidth || 900) + '" height="' + (hero.portraitHeight || 1200) + '" loading="eager" fetchpriority="high" decoding="async">'
      : '<span class="portrait-monogram">' + esc(initials(name)) + "</span>";

    var socials = [];
    if (meta.github) {
      socials.push('<a href="' + esc(meta.github) + '" target="_blank" rel="noopener">' + icon("github") + "GitHub</a>");
    }
    if (meta.email) {
      socials.push('<a href="mailto:' + esc(meta.email) + '">' + icon("mail") + "Email</a>");
    }

    return (
      '<section class="hero" id="top">' +
      '<div class="container">' +
      '<div class="hero-grid">' +
      '<div class="hero-main">' +
      '<p class="hero-eyebrow">' + esc(hero.eyebrow || meta.location) + "</p>" +
      '<h1 class="hero-name" aria-label="' + esc(name) + '">' +
      '<span class="line">' + esc(hero.titleTop || name.split(" ")[0]) + "</span> " +
      '<span class="line">' + esc(hero.titleBottom || name.split(" ")[1] || "") + " <em>" + esc(hero.titleAccent || "") + "</em></span>" +
      "</h1>" +
      '<p class="hero-intro">' + esc(hero.intro) + "</p>" +
      '<div class="hero-actions">' +
      '<a class="btn btn--primary" href="' + esc(hero.primaryCta && hero.primaryCta.href || "#work") + '">' + esc(hero.primaryCta && hero.primaryCta.label || "View work") + icon("arrowDown") + "</a>" +
      '<a class="btn btn--ghost" href="' + esc(hero.secondaryCta && hero.secondaryCta.href || "#about") + '">' + esc(hero.secondaryCta && hero.secondaryCta.label || "About me") + "</a>" +
      "</div>" +
      '<div class="hero-socials">' + socials.join("") + '<span class="rule"></span></div>' +
      "</div>" +
      '<div class="portrait reveal">' +
      '<div class="portrait-frame">' +
      '<span class="portrait-label">' + esc(meta.availability || "Available") + "</span>" +
      portrait +
      "</div>" +
      '<div class="portrait-plaque"><span class="status-dot"></span><p>' + esc(hero.statusNote || meta.role) + "</p></div>" +
      "</div>" +
      "</div>" +
      '<div class="hero-meta">' +
      "<span>" + esc(meta.location) + " · GMT+8</span>" +
      '<span class="scroll-cue">' + esc(hero.scrollNote || "Scroll to explore") + icon("arrowDown") + "</span>" +
      "</div></div></section>"
    );
  }

  function marqueeMarkup() {
    var items = siteData.marquee || [];
    if (!items.length) return "";
    var row = items.map(function (item) {
      return '<span class="marquee-item">' + esc(item) + "</span>";
    }).join("");
    return (
      '<div class="marquee" role="group" aria-label="Tools and skills">' +
      '<p class="sr-only">Tools and skills: ' + esc(items.join(", ")) + "</p>" +
      '<div class="marquee-track" aria-hidden="true">' + row + row + "</div>" +
      '<button class="marquee-toggle" type="button" aria-pressed="false" aria-label="Pause scrolling tools">' + icon("pause") + "</button>" +
      "</div>"
    );
  }

  function setupMarquee() {
    var marquee = document.querySelector(".marquee");
    var toggle = document.querySelector(".marquee-toggle");
    if (!marquee || !toggle) return;

    function setPaused(paused) {
      marquee.classList.toggle("is-paused", paused);
      marquee.classList.toggle("is-playing", !paused);
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Play scrolling tools" : "Pause scrolling tools");
      toggle.innerHTML = icon(paused ? "play" : "pause");
    }

    toggle.addEventListener("click", function () {
      setPaused(!marquee.classList.contains("is-paused"));
    });
  }

  /* ---------- about ---------- */

  function aboutMarkup() {
    var about = siteData.about || {};
    var meta = siteData.meta || {};
    var hero = siteData.hero || {};
    var contact = siteData.contact || {};
    var paragraphs = (about.paragraphs || []).map(function (p) {
      return "<p>" + esc(p) + "</p>";
    }).join("");

    var focusDetail = (contact.details || []).filter(function (detail) {
      return /focus/i.test(detail.label || "");
    })[0];
    var focus = focusDetail ? focusDetail.value : "EdTech, logistics, IoT";
    var noteText = hero.statusNote || "Building practical tools for education, logistics and community.";

    var noteMeta = "";
    if (meta.location) noteMeta += "<span>" + icon("pin") + esc(meta.location) + "</span>";
    if (focus) noteMeta += "<span>" + icon("layers") + esc(focus) + "</span>";

    var aboutNote =
      '<aside class="about-note reveal" style="--delay:120ms">' +
      '<p class="about-note-kicker"><span class="status-dot"></span>The short version</p>' +
      '<p class="about-note-text">' + esc(noteText) + "</p>" +
      (noteMeta ? '<div class="about-note-meta">' + noteMeta + "</div>" : "") +
      '<a class="about-note-link" href="#contact">Let&rsquo;s work together ' + icon("arrowRight") + "</a>" +
      "</aside>";

    var achievements = (about.achievements || []).map(function (item, i) {
      return (
        '<div class="achievement">' +
        '<span class="achievement-index">' + UI.pad(i + 1) + "</span>" +
        "<h3>" + esc(item.title) + "</h3>" +
        "<p>" + esc(item.text) + "</p>" +
        "</div>"
      );
    }).join("");

    var capabilities = (about.skills || []).map(function (skill) {
      return (
        '<div class="capability">' +
        '<span class="capability-icon" aria-hidden="true">' + icon(skill.icon) + "</span>" +
        "<h3>" + esc(skill.title) + "</h3>" +
        "<p>" + esc(skill.description) + "</p>" +
        "</div>"
      );
    }).join("");

    return (
      '<section class="section" id="about">' +
      '<div class="container">' +
      ledger(about.kicker || "01 — About", (meta.location || "") + " · GMT+8") +
      '<header class="section-head reveal">' +
      "<div>" +
      "<h2>" + esc(about.heading) + "</h2>" +
      "</div>" +
      "<p>" + esc(about.intro || "A short introduction to how I work and what I care about.") + "</p>" +
      "</header>" +
      '<div class="about-grid">' +
      '<div class="about-copy reveal">' + paragraphs + "</div>" +
      aboutNote +
      "</div>" +
      '<h3 class="list-label">Selected achievements</h3>' +
      '<div class="achievements reveal">' + achievements + "</div>" +
      '<h3 class="list-label">What I work with</h3>' +
      '<div class="capabilities reveal">' + capabilities + "</div>" +
      "</div></section>"
    );
  }

  /* ---------- work ---------- */

  function orderedProjects() {
    var projects = (siteData.projects || []).slice();
    var priority = ["ai-panel-google-sheets", "alpha-course-analysis", "young-innovators-judging"];
    projects.sort(function (a, b) {
      if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
      var aIndex = priority.indexOf(a.id);
      var bIndex = priority.indexOf(b.id);
      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }
      return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
    });
    return projects;
  }

  function workMarkup() {
    var work = siteData.work || {};
    var all = siteData.projects || [];
    var projects = orderedProjects();

    var cards = projects.map(function (project, index) {
      return (
        '<article class="project-card reveal' + (project.featured ? " is-featured" : "") + '" style="--delay:' + Math.min(index * 60, 240) + 'ms">' +
        '<a class="project-link" href="project.html?id=' + encodeURIComponent(project.id) + '">' +
        '<div class="project-cover">' + coverMarkup(project, index + 1, "plate") + "</div>" +
        '<div class="project-body">' +
        '<div class="project-meta"><span>' + esc(project.year) + '</span><span class="divider"></span><span>' + esc(project.context || category(project.category).label) + "</span></div>" +
        '<h3 class="project-title">' + esc(project.title) + "</h3>" +
        '<p class="project-summary">' + esc(project.summary) + "</p>" +
        '<span class="project-foot">' +
        '<span class="project-cta">Read the case study</span>' +
        '<span class="project-arrow" aria-hidden="true">' + icon("arrowUpRight") + "</span>" +
        "</span>" +
        "</div></a></article>"
      );
    }).join("");

    return (
      '<section class="section" id="work">' +
      '<div class="container">' +
      ledger(work.kicker || "02 — Selected work", all.length + " case studies") +
      '<div class="work-head reveal">' +
      "<div>" +
      "<h2>" + esc(work.heading) + "</h2>" +
      "</div>" +
      "<p>" + esc(work.intro) + "</p>" +
      "</div>" +
      '<div class="projects-grid">' + cards + "</div>" +
      "</div></section>"
    );
  }

  /* ---------- build log ---------- */

  function buildlogMarkup() {
    var timeline = siteData.timeline || {};
    var projects = siteData.projects || [];
    var groups = {};

    projects.forEach(function (project) {
      var year = String(project.year || "Undated");
      if (!groups[year]) groups[year] = [];
      groups[year].push(project);
    });

    var years = Object.keys(groups).sort(function (a, b) {
      return parseInt(a, 10) - parseInt(b, 10);
    });

    var sequence = 0;
    var items = years.map(function (year) {
      var entries = groups[year].map(function (project) {
        sequence += 1;
        var cat = category(project.category);
        var catKey = /^(app|web|hardware|ai)$/.test(project.category) ? project.category : "app";
        return (
          '<a class="tl-entry" href="project.html?id=' + encodeURIComponent(project.id) + '">' +
          '<span class="tl-index">' + UI.pad(sequence) + "</span>" +
          '<div class="tl-entry-body">' +
          '<div class="tl-entry-meta"><span class="tl-cat" style="--cat: var(--' + catKey + ')">' + esc(cat.label) + "</span>" +
          (project.context ? '<span class="tl-context">' + esc(project.context) + "</span>" : "") +
          "</div>" +
          "<h4>" + esc(project.title) + "</h4>" +
          "<p>" + esc(project.timelineNote || project.summary || "") + "</p>" +
          "</div>" +
          '<span class="tl-arrow" aria-hidden="true">' + icon("arrowUpRight") + "</span>" +
          "</a>"
        );
      }).join("");

      return (
        '<li class="tl-year" id="year-' + esc(String(year).replace(/[^\w-]/g, "-")) + '">' +
        '<div class="tl-year-sticky">' +
        '<h3 class="tl-year-label">' + esc(year) + "</h3>" +
        '<span class="tl-count">' + groups[year].length + " project" + (groups[year].length === 1 ? "" : "s") + "</span>" +
        '<span class="tl-node" aria-hidden="true"></span>' +
        "</div>" +
        '<div class="tl-entries">' + entries + "</div>" +
        "</li>"
      );
    }).join("");

    return (
      '<section class="section" id="buildlog">' +
      '<div class="container">' +
      ledger(timeline.kicker || "03 — Build log", projects.length + " projects · " + years[0] + "—" + years[years.length - 1]) +
      '<header class="section-head">' +
      "<div>" +
      "<h2>" + esc(timeline.heading) + "</h2>" +
      "</div>" +
      "<p>" + esc(timeline.intro) + "</p>" +
      "</header>" +
      '<ol class="tl-timeline" aria-label="Project timeline">' + items + "</ol>" +
      "</div></section>"
    );
  }

  /* ---------- contact ---------- */

  function contactMarkup() {
    var contact = siteData.contact || {};
    var meta = siteData.meta || {};
    var heading = contact.heading || "Let's build something useful.";
    var words = heading.trim().split(/\s+/);
    var last = words.pop();

    var details = (contact.details || []).map(function (item) {
      return '<div class="contact-detail"><dt>' + esc(item.label) + "</dt><dd>" + esc(item.value) + "</dd></div>";
    }).join("");

    var email = contact.email || meta.email || "";

    var socials = (contact.socials || []).filter(function (item) {
      return item && item.url;
    }).map(function (item) {
      return (
        '<a class="contact-social" href="' + esc(item.url) + '" target="_blank" rel="noopener">' +
        icon(UI.socialIcon(item.icon || item.label)) + esc(item.label) + "</a>"
      );
    }).join("");

    return (
      '<section class="section contact-section" id="contact">' +
      '<div class="container">' +
      '<div class="contact-panel reveal">' +
      "<div>" +
      '<p class="contact-label">' + esc(contact.kicker || "04 — Contact") + "</p>" +
      "<h2>" + esc(words.join(" ")) + " <em>" + esc(last) + "</em></h2>" +
      '<p class="contact-text">' + esc(contact.text) + "</p>" +
      (email
        ? '<div class="contact-address">' +
          '<a class="contact-email" href="mailto:' + esc(email) + '">' + esc(email) + icon("arrowUpRight") + "</a>" +
          '<button class="contact-copy" type="button" data-copy-email="' + esc(email) + '" aria-label="Copy email address">' + icon("copy") + "<span>Copy</span></button>" +
          "</div>"
        : "") +
      '<div class="contact-socials">' + socials + "</div>" +
      "</div>" +
      '<div><dl class="contact-details">' + details + "</dl></div>" +
      "</div></div></section>"
    );
  }

  /* ---------- footer ---------- */

  function footerMarkup() {
    var footer = siteData.footer || {};
    var meta = siteData.meta || {};
    var firstName = String(meta.name || "Andrew").split(" ")[0];

    return (
      '<footer class="footer">' +
      '<div class="container">' +
      '<div class="footer-inner">' +
      "<span>&copy; " + esc(footer.year || new Date().getFullYear()) + " " + esc(meta.name) + "</span>" +
      "<span>" + esc(footer.note || "") + "</span>" +
      "<span>" +
      (meta.github ? '<a href="' + esc(meta.github) + '" target="_blank" rel="noopener">GitHub</a> · ' : "") +
      (meta.email ? '<a href="mailto:' + esc(meta.email) + '">Email</a> · ' : "") +
      '<a href="#top">Back to top &uarr;</a>' +
      "</span>" +
      "</div>" +
      '<div class="footer-giant" aria-hidden="true">' + esc(firstName.toUpperCase()) + "</div>" +
      "</div></footer>"
    );
  }

  /* ---------- interactions ---------- */

  function setupReveals() {
    if (revealObserver) revealObserver.disconnect();
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { revealObserver.observe(el); });
  }

  function setupImageFallbacks() {
    document.querySelectorAll(".cover-img--main, .portrait-img").forEach(function (img) {
      function fail() {
        var art = img.closest(".cover-art");
        if (art) {
          art.classList.remove("has-image");
          art.querySelectorAll(".cover-img").forEach(function (image) {
            image.classList.add("is-broken");
          });
        } else {
          img.classList.add("is-broken");
        }
      }
      img.addEventListener("error", fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  function updateScrollUI() {
    var nav = document.getElementById("siteNav");
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-scrolled", y > 24);

    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
    var current = "";
    sections.forEach(function (section) {
      if (y >= section.offsetTop - 180) current = section.id;
    });
    document.querySelectorAll(".nav-link").forEach(function (link) {
      var active = link.getAttribute("data-section") === current;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2400);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("Email copied — " + text);
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      showToast("Email copied — " + text);
    } catch (err) {
      showToast(text);
    }
    area.remove();
  }

  var lastScrollFrame = null;

  function bindGlobal() {
    window.addEventListener("scroll", function () {
      if (lastScrollFrame) return;
      lastScrollFrame = requestAnimationFrame(function () {
        lastScrollFrame = null;
        updateScrollUI();
      });
    }, { passive: true });

    window.addEventListener("resize", updateScrollUI);

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var menu = document.getElementById("mobileMenu");
      if (menu && menu.classList.contains("is-open")) {
        var toggle = document.getElementById("navToggle");
        if (toggle) toggle.click();
      }
    });

    document.addEventListener("click", function (event) {
      var copyBtn = event.target.closest("[data-copy-email]");
      if (copyBtn) copyText(copyBtn.getAttribute("data-copy-email"));
      if (event.target.closest("[data-theme-toggle]")) toggleTheme();
    });

    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "portfolio-preview" || !event.data.data) return;
      var y = window.scrollY;
      siteData = event.data.data;
      render();
      window.scrollTo(0, y);
    });

    if (isPreview) {
      window.addEventListener("storage", function (event) {
        if (event.key !== DRAFT_KEY) return;
        var draft = readDraft();
        if (!draft) return;
        siteData = draft;
        render();
      });
    }
  }

  // Only load once.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
