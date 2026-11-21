/* ============================================================
   Portfolio admin editor
   - password gate + GitHub token (or local-only editing)
   - edits data/portfolio.json
   - autosaves a local draft, live preview, undo/redo
   - publishes to GitHub via the Contents API
   ============================================================ */
(function () {
  "use strict";

  var UI = window.UI;
  var icon = UI.icon;
  var esc = UI.esc;
  var coverMarkup = UI.coverMarkup;

  var CONFIG = window.ADMIN_CONFIG;
  var DRAFT_KEY = "portfolioDraft:v1";
  var TOKEN_KEY = "portfolioToken";
  var UNLOCK_KEY = "portfolioUnlocked";

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  var loginScreen = $("#loginScreen");
  var editorScreen = $("#editorScreen");
  var editorBody = $("#editorBody");
  var previewPane = $("#previewPane");
  var previewFrame = $("#previewFrame");
  var modalRoot = $("#modalRoot");
  var toastBox = $("#toastBox");
  var validationBox = $("#validationBox");
  var saveStatus = $("#saveStatus");
  var importFile = $("#importFile");

  var token = readToken();
  var source = null;
  var sha = null;
  var githubUser = "";
  var data = null;
  var originalJson = "";
  var dirty = false;
  var activeView = "site";
  var activeProject = 0;
  var activeProjectTab = "basics";
  var previewOpen = false;
  var previewSrc = "";
  var draftTimer = null;
  var previewTimer = null;
  var historyTimer = null;
  var history = [];
  var historyIndex = -1;
  var publishing = false;

  var VIEW_META = {
    site: { title: "Site & hero", eyebrow: "SECTION 01" },
    about: { title: "About", eyebrow: "SECTION 02" },
    projects: { title: "Projects", eyebrow: "SECTION 03" },
    contact: { title: "Contact", eyebrow: "SECTION 04" },
    health: { title: "Content checks", eyebrow: "SECTION 05" }
  };

  var PROJECT_TEMPLATE = {
    id: "new-project",
    title: "New project",
    year: new Date().getFullYear(),
    category: "app",
    featured: false,
    summary: "",
    role: "Design & development",
    context: "",
    timelineNote: "",
    tags: [],
    cover: { type: "icon", icon: "sparkles", url: "", alt: "" },
    links: [],
    metrics: [],
    problem: { paragraphs: [], bullets: [] },
    process: { paragraphs: [], cards: [] },
    impact: { paragraphs: [], features: [] },
    journey: [],
    improvements: [],
    gallery: []
  };

  var TEMPLATES = {
    achievement: { title: "", text: "" },
    skill: { title: "", icon: "code", description: "", tags: [] },
    metric: { value: "", label: "" },
    bullet: { title: "", text: "" },
    card: { title: "", text: "" },
    feature: { title: "", text: "", bullets: [] },
    journey: { label: "Step", title: "", description: "", tags: [] },
    improvement: { title: "", text: "" },
    social: { label: "", icon: "github", url: "" },
    detail: { label: "", value: "" },
    link: { label: "", url: "" },
    gallery: { url: "", alt: "", caption: "" }
  };

  /* ---------- small utilities ---------- */

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function storeToken(value) {
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch (err) {
      /* ignore */
    }
  }

  function removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function getPath(obj, path) {
    return String(path).split(".").reduce(function (current, key) {
      if (current === undefined || current === null) return undefined;
      return current[key];
    }, obj);
  }

  function setPath(obj, path, value) {
    var parts = String(path).split(".");
    var current = obj;
    for (var i = 0; i < parts.length - 1; i += 1) {
      var key = parts[i];
      if (current[key] === undefined || current[key] === null) {
        current[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      current = current[key];
    }
    current[parts[parts.length - 1]] = value;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function uniqueId(base, exclude) {
    var root = slugify(base) || "project";
    var candidate = root;
    var used = (data.projects || []).map(function (project, index) {
      return index === exclude ? "" : project.id;
    });
    var n = 2;
    while (used.indexOf(candidate) !== -1) {
      candidate = root + "-" + n;
      n += 1;
    }
    return candidate;
  }

  function formatTime(timestamp) {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return "";
    }
  }

  function toast(message, type) {
    var el = document.createElement("div");
    el.className = "toast-msg " + (type || "");
    el.textContent = message;
    toastBox.appendChild(el);
    window.setTimeout(function () { el.remove(); }, 4500);
  }

  function iconSpan(name) {
    return '<span class="btn-icon">' + icon(name) + "</span>";
  }

  function paintIcons(root) {
    $$("[data-icon]", root || document).forEach(function (el) {
      if (!el.dataset.painted) {
        el.innerHTML = icon(el.dataset.icon);
        el.dataset.painted = "1";
      }
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function syncThemeToggles() {
    var dark = currentTheme() === "dark";
    $$("[data-admin-theme-toggle]").forEach(function (button) {
      button.innerHTML = icon(dark ? "sun" : "moon");
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0b1120" : "#ffffff");
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (err) { /* ignore */ }
    syncThemeToggles();
    if (previewOpen) updatePreview(true);
  }


  /* ---------- github ---------- */

  var API = "https://api.github.com/repos/" + CONFIG.repo;

  function authHeaders(extra) {
    var headers = Object.assign({}, extra || {});
    if (token) {
      headers.Authorization = "Bearer " + token;
      headers.Accept = "application/vnd.github+json";
      headers["X-GitHub-Api-Version"] = "2022-11-28";
    }
    return headers;
  }

  function ghFetch(url, options) {
    options = options || {};
    return fetch(url, Object.assign({}, options, { headers: authHeaders(options.headers) })).then(function (response) {
      if (!response.ok) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          var error = new Error(body.message || "GitHub error " + response.status);
          error.status = response.status;
          throw error;
        });
      }
      return response.json();
    });
  }

  function base64ToUtf8(value) {
    var clean = String(value || "").replace(/\n/g, "");
    var binary = atob(clean);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function utf8ToBase64(value) {
    var bytes = new TextEncoder().encode(value);
    var binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function contentUrl() {
    return API + "/contents/" + CONFIG.contentPath.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(CONFIG.branch);
  }

  function fileUrl(path) {
    return API + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  }

  /* ---------- login ---------- */

  function showPassword() {
    loginScreen.hidden = false;
    editorScreen.hidden = true;
    $("#stepPassword").hidden = false;
    $("#stepToken").hidden = true;
    $("#loginState").textContent = "LOCKED";
    window.setTimeout(function () { $("#passwordInput").focus(); }, 40);
  }

  function showToken(message) {
    loginScreen.hidden = false;
    editorScreen.hidden = true;
    $("#stepPassword").hidden = true;
    $("#stepToken").hidden = false;
    $("#loginState").textContent = "TOKEN";
    setError("#tokenError", message || "");
    window.setTimeout(function () { $("#tokenInput").focus(); }, 40);
  }

  function setError(selector, message) {
    var el = $(selector);
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function unlock() {
    var value = $("#passwordInput").value;
    if (value !== CONFIG.password) {
      setError("#passwordError", "That password is not right. Try again.");
      $("#passwordInput").value = "";
      $("#passwordInput").focus();
      return;
    }
    setError("#passwordError", "");
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch (err) { /* ignore */ }
    if (token) {
      enterEditor("github");
    } else {
      showToken("");
    }
  }

  function connectToken() {
    var input = $("#tokenInput");
    var value = input.value.trim();
    if (!value) {
      setError("#tokenError", "Paste a GitHub token first.");
      return;
    }
    var button = $("#tokenBtn");
    button.disabled = true;
    button.textContent = "Checking…";
    var previous = token;
    token = value;
    ghFetch("https://api.github.com/user")
      .then(function (user) {
        githubUser = user.login || "";
        return ghFetch(API);
      })
      .then(function () {
        storeToken(value);
        try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch (err) { /* ignore */ }
        setError("#tokenError", "");
        enterEditor("github");
      })
      .catch(function (error) {
        token = previous;
        var message = "Could not connect: " + error.message;
        if (error.status === 401) message = "That token is invalid or has expired. Generate a new one and try again.";
        if (error.status === 404) message = 'This token cannot see "' + CONFIG.repo + '". Check that it includes this repository.';
        setError("#tokenError", message);
      })
      .then(function () {
        button.disabled = false;
        button.textContent = "Connect & open editor";
      });
  }

  function startLocalMode() {
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch (err) { /* ignore */ }
    enterEditor("local");
  }

  function enterEditor(mode) {
    source = mode;
    loginScreen.hidden = true;
    editorScreen.hidden = false;
    $("#viewSiteLink").href = CONFIG.siteUrl;
    $("#loginSiteLink").href = CONFIG.siteUrl;
    $("#publishBtn").disabled = true;
    editorBody.innerHTML = '<div class="empty-note">Loading content…</div>';
    setSourceUI();
    if (mode === "github" && !githubUser && token) {
      ghFetch("https://api.github.com/user").then(function (user) {
        githubUser = user.login || "";
        setSourceUI();
      }).catch(function () { /* ignore */ });
    }
    loadContent(mode);
  }

  function setSourceUI() {
    var badge = $("#sourceBadge");
    badge.textContent = source === "github" ? "GitHub · " + CONFIG.branch : "Local draft";
    badge.className = "source-badge " + (source === "github" ? "is-github" : "is-local");
    $("#sourceUser").textContent = source === "github" ? githubUser : "not publishing";
    $("#viewSiteLink").href = CONFIG.siteUrl;
  }

  function handleLoadError(error) {
    if (error && error.status === 401) {
      signOut(true, "Your token expired. Sign in with a new token.");
      return;
    }
    var message = "Could not load content: " + error.message;
    if (window.location.protocol === "file:") {
      message = "Open the admin through a local server (start.bat or python -m http.server 8000), then reload.";
    }
    editorBody.innerHTML = '<div class="empty-note">' + esc(message) + "</div>";
    showAlert(message);
    toast(message, "error");
  }

  function showAlert(message) {
    validationBox.innerHTML = esc(message);
    validationBox.hidden = false;
  }

  function loadContent(mode) {
    var promise;
    if (mode === "github") {
      promise = ghFetch(contentUrl()).then(function (info) {
        sha = info.sha;
        return JSON.parse(base64ToUtf8(info.content));
      });
    } else {
      promise = fetch(CONFIG.contentPath, { cache: "no-store" }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status + " — is start.bat running?");
        return response.json();
      });
    }

    promise
      .then(function (loaded) {
        data = loaded;
        originalJson = JSON.stringify(data);
        dirty = false;
        activeProject = 0;
        resetHistory();
        renderEditor();
        updateDraftStatus();
        $("#publishBtn").disabled = false;
        updateDirtyBadge();
        window.setTimeout(offerDraft, 150);
      })
      .catch(handleLoadError);
  }

  /* ---------- drafts ---------- */

  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed) return null;
      if (parsed.data) return { savedAt: parsed.savedAt || 0, data: parsed.data };
      return { savedAt: 0, data: parsed };
    } catch (err) {
      return null;
    }
  }

  function saveDraftNow() {
    if (!data) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), data: data }));
      updateDraftStatus();
    } catch (err) {
      /* storage full or private mode */
    }
  }

  function scheduleDraft() {
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraftNow, 600);
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* ignore */ }
    updateDraftStatus();
  }

  function updateDraftStatus() {
    var el = $("#draftStatus");
    if (!el) return;
    var draft = readDraft();
    el.textContent = draft ? "Draft saved " + formatTime(draft.savedAt) : "No local draft";
  }

  function offerDraft() {
    var draft = readDraft();
    if (!draft || !draft.data) return;
    try {
      if (JSON.stringify(draft.data) === JSON.stringify(data)) {
        clearDraft();
        return;
      }
    } catch (err) { /* ignore */ }

    openModal({
      title: "Resume your local draft?",
      body:
        "<p>There is an unsaved draft from <strong>" + esc(formatTime(draft.savedAt) || "earlier") +
        "</strong> that is different from the published content.</p><p>Resume it, or discard it and start from the live content.</p>",
      actions: [
        {
          label: "Discard draft",
          variant: "ghost",
          onClick: function () {
            clearDraft();
            closeModal();
            toast("Draft discarded");
          }
        },
        {
          label: "Resume draft",
          variant: "primary",
          onClick: function () {
            data = draft.data;
            activeProject = 0;
            dirty = JSON.stringify(data) !== originalJson;
            renderEditor();
            updateDirtyBadge();
            updatePreview(true);
            closeModal();
            toast("Draft restored", "success");
          }
        }
      ]
    });
  }

  /* ---------- history ---------- */

  function resetHistory() {
    history = [JSON.stringify(data)];
    historyIndex = 0;
  }

  function pushHistory() {
    if (!data) return;
    var snapshot = JSON.stringify(data);
    if (history[historyIndex] === snapshot) return;
    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    if (history.length > 60) history.shift();
    historyIndex = history.length - 1;
  }

  function scheduleHistory() {
    window.clearTimeout(historyTimer);
    historyTimer = window.setTimeout(pushHistory, 800);
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    data = JSON.parse(history[historyIndex]);
    dirty = JSON.stringify(data) !== originalJson;
    renderEditor();
    updateDirtyBadge();
    toast("Undone");
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    data = JSON.parse(history[historyIndex]);
    dirty = JSON.stringify(data) !== originalJson;
    renderEditor();
    updateDirtyBadge();
    toast("Redone");
  }

  /* ---------- dirty state & preview ---------- */

  function markDirty() {
    if (!data) return;
    dirty = JSON.stringify(data) !== originalJson;
    updateDirtyBadge();
    scheduleDraft();
    scheduleHistory();
    schedulePreview();
  }

  function updateDirtyBadge() {
    $("#dirtyBadge").hidden = !dirty;
    $("#publishBtn").disabled = !data || publishing;
  }

  function schedulePreview() {
    if (!previewOpen) return;
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(function () { updatePreview(false); }, 450);
  }

  function desiredPreviewSrc() {
    if (activeView === "projects" && data && data.projects && data.projects[activeProject]) {
      return "project.html?preview=1&id=" + encodeURIComponent(data.projects[activeProject].id);
    }
    return "index.html?preview=1";
  }

  function updatePreview(force) {
    if (!previewOpen || !data) return;
    saveDraftNow();
    var target = desiredPreviewSrc();
    if (force || previewSrc !== target) {
      previewSrc = target;
      previewFrame.src = target;
      return;
    }
    sendPreview();
  }

  function sendPreview() {
    try {
      if (previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage(
          { type: "portfolio-preview", data: data },
          window.location.origin
        );
      }
    } catch (err) {
      /* iframe not ready */
    }
  }

  function togglePreview(open) {
    previewOpen = open;
    previewPane.hidden = !open;
    $("#previewBtn").setAttribute("aria-pressed", String(open));
    if (open) {
      previewSrc = "";
      updatePreview(true);
    } else {
      previewFrame.src = "about:blank";
      previewSrc = "";
    }
  }

  /* ---------- render ---------- */

  function renderEditor() {
    if (!data) return;
    renderSidebar();
    renderView();
    updateTopbar();
    updateDirtyBadge();
    paintIcons();
    updatePreview(false);
  }

  function renderSidebar() {
    $$(".side-link").forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.view === activeView);
    });
    var issues = collectIssues();
    $("#healthCount").textContent = String(issues.filter(function (issue) { return issue.severity !== "info"; }).length);
    updateDraftStatus();
  }

  function updateTopbar() {
    var meta = VIEW_META[activeView] || VIEW_META.site;
    $("#viewEyebrow").textContent = meta.eyebrow;
    $("#viewTitle").textContent = meta.title;
    $("#viewSiteLink").href = CONFIG.siteUrl;
  }

  function renderView() {
    if (!data) return;
    validationBox.hidden = true;
    if (activeView === "site") editorBody.innerHTML = viewSite();
    else if (activeView === "about") editorBody.innerHTML = viewAbout();
    else if (activeView === "projects") editorBody.innerHTML = viewProjects();
    else if (activeView === "contact") editorBody.innerHTML = viewContact();
    else editorBody.innerHTML = viewHealth();
    paintIcons(editorBody);
  }

  function renderViewPreserve() {
    var y = window.scrollY;
    renderView();
    window.scrollTo(0, y);
    schedulePreview();
  }

  function switchView(view) {
    activeView = view;
    if (view === "projects") {
      var projects = data.projects || [];
      if (!projects.length) activeProject = 0;
      else if (activeProject >= projects.length) activeProject = projects.length - 1;
    }
    renderEditor();
    window.scrollTo(0, 0);
  }

  /* ---------- field builders ---------- */

  function fieldWrapper(label, content, opts) {
    opts = opts || {};
    return (
      '<label class="field' + (opts.wide ? " field--wide" : "") + '">' +
      "<span>" + esc(label) + "</span>" +
      content +
      (opts.help ? '<span class="field-help">' + esc(opts.help) + "</span>" : "") +
      "</label>"
    );
  }

  function textField(label, path, opts) {
    opts = opts || {};
    var value = getPath(data, path);
    if (value === undefined || value === null) value = "";
    return fieldWrapper(
      label,
      '<input class="input" type="' + (opts.type || "text") + '" data-path="' + path + '" value="' + esc(value) + '"' +
        (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") +
        (opts.type === "number" ? ' min="0" step="1"' : "") +
        ">",
      opts
    );
  }

  function textareaField(label, path, opts) {
    opts = opts || {};
    var value = opts.value !== undefined ? opts.value : getPath(data, path);
    if (value === undefined || value === null) value = "";
    return fieldWrapper(
      label,
      '<textarea class="input" rows="' + (opts.rows || 3) + '" data-path="' + path + '"' +
        (opts.list ? ' data-list="' + opts.list + '"' : "") +
        (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") +
        ">" + esc(value) + "</textarea>",
      opts
    );
  }

  function listField(label, path, opts) {
    opts = opts || {};
    var mode = opts.mode || "lines";
    var value = getPath(data, path);
    var joined = Array.isArray(value)
      ? value.join(mode === "comma" ? ", " : mode === "paragraphs" ? "\n\n" : "\n")
      : (value || "");
    return textareaField(label, path, Object.assign({}, opts, { value: joined, list: mode }));
  }

  function selectField(label, path, options, opts) {
    opts = opts || {};
    var current = getPath(data, path);
    var html = '<select class="input" data-path="' + path + '">' +
      options.map(function (option) {
        return '<option value="' + esc(option.value) + '"' + (String(option.value) === String(current) ? " selected" : "") + ">" + esc(option.label) + "</option>";
      }).join("") +
      "</select>";
    return fieldWrapper(label, html, opts);
  }

  function checkField(label, path, opts) {
    opts = opts || {};
    var checked = getPath(data, path) ? " checked" : "";
    return (
      '<div class="field' + (opts.wide ? " field--wide" : "") + '">' +
      '<label class="check-field"><input type="checkbox" data-path="' + path + '"' + checked + "><span>" + esc(label) + "</span></label>" +
      (opts.help ? '<span class="field-help">' + esc(opts.help) + "</span>" : "") +
      "</div>"
    );
  }

  function imageField(label, path, opts) {
    opts = opts || {};
    var value = getPath(data, path) || "";
    return (
      '<div class="field field--wide">' +
      "<span>" + esc(label) + "</span>" +
      '<div class="media-row">' +
      '<input class="input" data-path="' + path + '" value="' + esc(value) + '" placeholder="assets/images/… or https://…">' +
      '<label class="btn btn--small btn--ghost upload-btn">' + iconSpan("upload") + "Upload" +
      '<input type="file" accept="image/*" data-upload-path="' + path + '"></label>' +
      "</div>" +
      '<div class="media-preview">' +
      (value
        ? '<img src="' + esc(value) + '" alt="">'
        : '<span class="preview-empty">No image yet</span>') +
      "</div>" +
      (opts.help ? '<span class="field-help">' + esc(opts.help) + "</span>" : "") +
      "</div>"
    );
  }

  function slugField(label, path, sourcePath) {
    return (
      '<div class="field">' +
      "<span>" + esc(label) + "</span>" +
      '<div class="form-row">' +
      '<input class="input" data-path="' + path + '" value="' + esc(getPath(data, path) || "") + '">' +
      '<button class="btn btn--small btn--ghost" type="button" data-action="generate-slug" data-path="' + path + '" data-source="' + sourcePath + '">Generate</button>' +
      "</div>" +
      '<span class="field-help">Used in the project URL. Lowercase letters, numbers and hyphens.</span>' +
      "</div>"
    );
  }

  function iconOptions() {
    return Object.keys(UI.icons).sort().map(function (name) {
      return { value: name, label: name };
    });
  }

  function categoryOptions() {
    var categories = (data.work && data.work.categories) || [];
    var filtered = categories.filter(function (category) { return category.id !== "all"; });
    if (!filtered.length) {
      filtered = [
        { id: "app", label: "App" },
        { id: "web", label: "Web" },
        { id: "hardware", label: "Hardware" },
        { id: "ai", label: "AI" }
      ];
    }
    return filtered.map(function (category) { return { value: category.id, label: category.label }; });
  }

  function fieldFor(field, path) {
    if (field.type === "textarea") return textareaField(field.label, path, { rows: field.rows || 3, wide: field.wide, help: field.help });
    if (field.type === "list") return listField(field.label, path, { mode: field.mode || "lines", rows: field.rows || 3, wide: field.wide, help: field.help });
    if (field.type === "select") return selectField(field.label, path, field.options || [], { wide: field.wide, help: field.help });
    if (field.type === "image") return imageField(field.label, path, { help: field.help });
    if (field.type === "checkbox") return checkField(field.label, path, { wide: field.wide, help: field.help });
    return textField(field.label, path, { type: field.type, wide: field.wide, help: field.help, placeholder: field.placeholder });
  }

  function objectList(path, opts) {
    var items = getPath(data, path) || [];
    var body = items.map(function (item, index) {
      var fields = opts.fields.map(function (field) {
        return fieldFor(field, path + "." + index + "." + field.key);
      }).join("");
      return (
        '<div class="object-item">' +
        '<div class="object-head">' +
        '<span class="mono-label">' + esc(opts.label) + " " + (index + 1) + "</span>" +
        '<div class="object-actions">' +
        '<button class="icon-btn" type="button" data-action="move-object-up" data-path="' + path + '" data-index="' + index + '" aria-label="Move up" title="Move up">' + icon("chevronUp") + "</button>" +
        '<button class="icon-btn" type="button" data-action="move-object-down" data-path="' + path + '" data-index="' + index + '" aria-label="Move down" title="Move down">' + icon("chevronDown") + "</button>" +
        '<button class="icon-btn" type="button" data-action="remove-object" data-path="' + path + '" data-index="' + index + '" aria-label="Remove" title="Remove">' + icon("trash") + "</button>" +
        "</div></div>" +
        '<div class="object-fields">' + fields + "</div>" +
        "</div>"
      );
    }).join("");

    return (
      '<div class="object-list">' +
      (items.length ? body : '<div class="empty-note">No ' + esc(opts.label.toLowerCase()) + "s yet.</div>") +
      '<div class="add-row"><button class="btn btn--small btn--ghost" type="button" data-action="add-object" data-path="' + path + '" data-template="' + opts.template + '">' +
      iconSpan("plus") + esc(opts.addLabel || "Add item") + "</button></div>" +
      "</div>"
    );
  }

  function storyBlock(title, index, body) {
    return (
      '<div class="story-block">' +
      '<div class="story-block-head"><h3>' + esc(title) + "</h3><span>" + UI.pad(index) + "</span></div>" +
      '<div class="story-block-body">' + body + "</div>" +
      "</div>"
    );
  }

  /* ---------- view: site ---------- */

  function viewSite() {
    return (
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Identity</h2><p>Your name, role and contact details used across the site.</p></div></div>' +
      '<div class="grid-2">' +
      textField("Full name", "meta.name") +
      textField("Role / headline", "meta.role") +
      textField("Location", "meta.location") +
      textField("Email", "meta.email", { type: "email" }) +
      textField("GitHub URL", "meta.github", { type: "url", wide: true }) +
      textField("Site URL", "meta.siteUrl", { type: "url" }) +
      textField("Resume URL", "meta.resumeUrl", { type: "url", help: "Optional. Link to a PDF CV." }) +
      textField("Availability", "meta.availability") +
      "</div></div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Hero</h2><p>The first screen. Keep the intro short and specific.</p></div></div>' +
      '<div class="grid-2">' +
      textField("Eyebrow", "hero.eyebrow") +
      textField("First line of name", "hero.titleTop") +
      textField("Second line of name", "hero.titleBottom") +
      textField("Italic accent", "hero.titleAccent") +
      textareaField("Intro paragraph", "hero.intro", { wide: true, rows: 3 }) +
      textField("Status note", "hero.statusNote", { wide: true }) +
      textField("Scroll hint", "hero.scrollNote") +
      textField("Primary button label", "hero.primaryCta.label") +
      textField("Primary button link", "hero.primaryCta.href") +
      textField("Secondary button label", "hero.secondaryCta.label") +
      textField("Secondary button link", "hero.secondaryCta.href") +
      "</div>" +
      '<div style="margin-top:16px">' +
      imageField("Portrait image", "hero.portrait", { help: "Leave empty to use the designed monogram. A portrait works best at 3:4 (for example 900 × 1200px)." }) +
      "</div></div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Skills marquee</h2><p>The scrolling strip of tools under the hero.</p></div></div>' +
      listField("One skill per line", "marquee", { mode: "lines", rows: 6 }) +
      "</div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Footer</h2><p>The note and year at the bottom of every page.</p></div></div>' +
      '<div class="grid-2">' +
      textField("Footer note", "footer.note", { wide: true }) +
      textField("Copyright year", "footer.year") +
      "</div></div>"
    );
  }

  /* ---------- view: about ---------- */

  function viewAbout() {
    return (
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>About section</h2><p>The story behind the work.</p></div></div>' +
      '<div class="grid-2">' +
      textField("Section kicker", "about.kicker") +
      textField("Heading", "about.heading") +
      textareaField("Short intro (right of the heading)", "about.intro", { wide: true, rows: 2 }) +
      listField("Paragraphs — separate with a blank line", "about.paragraphs", { mode: "paragraphs", rows: 8, wide: true }) +
      "</div></div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Achievements</h2><p>Short, concrete highlights.</p></div></div>' +
      objectList("about.achievements", {
        template: "achievement",
        label: "Achievement",
        addLabel: "Add achievement",
        fields: [
          { key: "title", label: "Title" },
          { key: "text", label: "Description", type: "textarea", wide: true, rows: 2 }
        ]
      }) +
      "</div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Skills</h2><p>Four cards for the things you do.</p></div></div>' +
      objectList("about.skills", {
        template: "skill",
        label: "Skill",
        addLabel: "Add skill",
        fields: [
          { key: "title", label: "Title" },
          { key: "icon", label: "Icon", type: "select", options: iconOptions() },
          { key: "description", label: "Description", type: "textarea", wide: true, rows: 2 },
          { key: "tags", label: "Tags (comma separated)", type: "list", mode: "comma", wide: true, rows: 2 }
        ]
      }) +
      "</div>"
    );
  }

  /* ---------- view: projects ---------- */

  function viewProjects() {
    var projects = data.projects || [];
    if (!projects.length) {
      return (
        '<div class="panel">' +
        '<div class="empty-note">No projects yet. Add your first one to get started.</div>' +
        '<div style="margin-top:14px"><button class="btn btn--primary" type="button" data-action="add-project">' + iconSpan("plus") + "Add project</button></div>" +
        "</div>"
      );
    }
    if (activeProject >= projects.length) activeProject = projects.length - 1;
    if (activeProject < 0) activeProject = 0;
    var project = projects[activeProject];
    var category = UI.category(project.category);

    var list = projects.map(function (item, index) {
      return (
        '<button class="project-list-item' + (index === activeProject ? " is-active" : "") + '" type="button" data-action="select-project" data-index="' + index + '">' +
        '<span class="project-number">' + UI.pad(index + 1) + "</span>" +
        '<span class="project-list-copy">' +
        '<span class="project-list-title">' + esc(item.title || "Untitled") + "</span>" +
        '<span class="project-list-meta">' + esc(item.year || "—") + " · " + esc(UI.category(item.category).label) +
        (item.featured ? '<span class="project-featured-dot" title="Featured"></span>' : "") +
        "</span></span></button>"
      );
    }).join("");

    return (
      '<div class="project-manager">' +
      '<div class="project-list-panel">' +
      '<div class="project-list-head"><span class="mono-label">Projects (' + projects.length + ")</span>" +
      '<button class="icon-btn" type="button" data-action="add-project" title="Add project" aria-label="Add project">' + icon("plus") + "</button></div>" +
      '<div class="project-search"><input class="input" type="search" placeholder="Filter projects…" data-role="project-search"></div>' +
      '<div class="project-list" id="projectList">' + list + "</div>" +
      "</div>" +
      '<div class="project-detail">' + projectDetail(project, activeProject, category) + "</div>" +
      "</div>"
    );
  }

  function projectDetail(project, index, category) {
    var base = "projects." + index;
    var tabs = [
      ["basics", "Basics"],
      ["story", "Story"],
      ["journey", "Journey"],
      ["media", "Media & links"]
    ];

    function pane(name, content) {
      return '<div class="detail-pane" data-pane="' + name + '"' + (activeProjectTab === name ? "" : " hidden") + ">" + content + "</div>";
    }

    var basics =
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Project basics</h2><p>The card and case-study header.</p></div></div>' +
      '<div class="grid-2">' +
      textField("Title", base + ".title") +
      slugField("URL slug", base + ".id", base + ".title") +
      textField("Year", base + ".year", { placeholder: "2026 or 2025-2026" }) +
      selectField("Category", base + ".category", categoryOptions()) +
      textField("Role", base + ".role", { placeholder: "Design & development" }) +
      textField("Context", base + ".context", { placeholder: "Chumbaka · Sarawak rollout" }) +
      checkField("Feature this project", base + ".featured", { wide: true, help: "Featured projects span the full width of the work grid." }) +
      textareaField("Card summary", base + ".summary", { wide: true, rows: 3, help: "One or two sentences shown on the project card." }) +
      textareaField("Timeline note", base + ".timelineNote", { wide: true, rows: 2, help: "Short line used in the build-log timeline." }) +
      listField("Tags (comma separated)", base + ".tags", { mode: "comma", wide: true, rows: 2 }) +
      "</div></div>" +
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Impact metrics</h2><p>Optional numbers shown under the case-study hero.</p></div></div>' +
      objectList(base + ".metrics", {
        template: "metric",
        label: "Metric",
        addLabel: "Add metric",
        fields: [
          { key: "value", label: "Value", placeholder: "204" },
          { key: "label", label: "Label", placeholder: "Schools in rollout" }
        ]
      }) +
      "</div>";

    var story =
      storyBlock("Problem", 1,
        listField("Paragraphs — separate with a blank line", base + ".problem.paragraphs", { mode: "paragraphs", rows: 5, wide: true }) +
        '<div style="margin-top:14px">' + objectList(base + ".problem.bullets", {
          template: "bullet",
          label: "Pain point",
          addLabel: "Add pain point",
          fields: [
            { key: "title", label: "Title" },
            { key: "text", label: "Description", type: "textarea", wide: true, rows: 2 }
          ]
        }) + "</div>"
      ) +
      storyBlock("Approach", 2,
        listField("Paragraphs — separate with a blank line", base + ".process.paragraphs", { mode: "paragraphs", rows: 5, wide: true }) +
        '<div style="margin-top:14px">' + objectList(base + ".process.cards", {
          template: "card",
          label: "Approach card",
          addLabel: "Add approach card",
          fields: [
            { key: "title", label: "Title" },
            { key: "text", label: "Description", type: "textarea", wide: true, rows: 3 }
          ]
        }) + "</div>"
      ) +
      storyBlock("Impact", 3,
        listField("Paragraphs — separate with a blank line", base + ".impact.paragraphs", { mode: "paragraphs", rows: 4, wide: true }) +
        '<div style="margin-top:14px">' + objectList(base + ".impact.features", {
          template: "feature",
          label: "Impact feature",
          addLabel: "Add feature",
          fields: [
            { key: "title", label: "Title" },
            { key: "text", label: "Description", type: "textarea", wide: true, rows: 2 },
            { key: "bullets", label: "Bullets — one per line", type: "list", mode: "lines", wide: true, rows: 3 }
          ]
        }) + "</div>"
      );

    var journey =
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Project journey</h2><p>Steps shown in the case study. Leave empty to hide the section.</p></div></div>' +
      objectList(base + ".journey", {
        template: "journey",
        label: "Step",
        addLabel: "Add step",
        fields: [
          { key: "label", label: "Label", placeholder: "Step 1" },
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea", wide: true, rows: 3 },
          { key: "tags", label: "Tags (comma separated)", type: "list", mode: "comma", wide: true, rows: 2 }
        ]
      }) +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Future improvements</h2><p>What you would do next.</p></div></div>' +
      objectList(base + ".improvements", {
        template: "improvement",
        label: "Improvement",
        addLabel: "Add improvement",
        fields: [
          { key: "title", label: "Title" },
          { key: "text", label: "Description", type: "textarea", wide: true, rows: 2 }
        ]
      }) +
      "</div>";

    var media =
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Cover</h2><p>Use a designed icon, or add an image. Adding an image switches the cover type automatically.</p></div></div>' +
      '<div class="grid-2">' +
      selectField("Cover type", base + ".cover.type", [
        { value: "icon", label: "Designed icon" },
        { value: "image", label: "Image" }
      ]) +
      selectField("Icon", base + ".cover.icon", iconOptions()) +
      textField("Image alt text", base + ".cover.alt", { wide: true, help: "Describe the image for screen readers." }) +
      "</div>" +
      '<div style="margin-top:14px">' +
      imageField("Cover image", base + ".cover.url", { help: "Leave empty when using the designed icon." }) +
      "</div>" +
      '<div style="margin-top:14px"><span class="mono-label">CURRENT COVER</span><div class="admin-cover-preview">' + coverMarkup(project, index + 1) + "</div></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Gallery</h2><p>Extra screenshots shown near the end of the case study.</p></div></div>' +
      objectList(base + ".gallery", {
        template: "gallery",
        label: "Image",
        addLabel: "Add image",
        fields: [
          { key: "url", label: "Image", type: "image" },
          { key: "alt", label: "Alt text" },
          { key: "caption", label: "Caption", wide: true }
        ]
      }) +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>External links</h2><p>Optional live demo, repository or write-up.</p></div></div>' +
      objectList(base + ".links", {
        template: "link",
        label: "Link",
        addLabel: "Add link",
        fields: [
          { key: "label", label: "Label", placeholder: "Live demo" },
          { key: "url", label: "URL", type: "url", placeholder: "https://…" }
        ]
      }) +
      "</div>";

    return (
      '<div class="project-toolbar">' +
      '<div><h2 id="projectToolbarTitle">' + esc(project.title || "Untitled") + "</h2><p>" + esc(project.id || "no slug") + " · " + esc(project.year) + " · " + esc(category.label) + "</p></div>" +
      '<div class="project-toolbar-actions">' +
      '<button class="btn btn--small btn--ghost" type="button" data-action="move-project-up" data-index="' + index + '">' + iconSpan("chevronUp") + "Up</button>" +
      '<button class="btn btn--small btn--ghost" type="button" data-action="move-project-down" data-index="' + index + '">' + iconSpan("chevronDown") + "Down</button>" +
      '<button class="btn btn--small btn--ghost" type="button" data-action="duplicate-project" data-index="' + index + '">' + iconSpan("plus") + "Duplicate</button>" +
      '<button class="btn btn--small btn--danger" type="button" data-action="delete-project" data-index="' + index + '">' + iconSpan("trash") + "Delete</button>" +
      "</div></div>" +
      '<div class="detail-tabs">' +
      tabs.map(function (tab) {
        return '<button class="detail-tab' + (activeProjectTab === tab[0] ? " is-active" : "") + '" type="button" data-ptab="' + tab[0] + '">' + tab[1] + "</button>";
      }).join("") +
      "</div>" +
      pane("basics", basics) +
      pane("story", story) +
      pane("journey", journey) +
      pane("media", media)
    );
  }

  /* ---------- view: contact ---------- */

  function viewContact() {
    return (
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Contact section</h2><p>The closing call to action.</p></div></div>' +
      '<div class="grid-2">' +
      textField("Section kicker", "contact.kicker") +
      textField("Heading", "contact.heading", { wide: true }) +
      textareaField("Supporting text", "contact.text", { wide: true, rows: 3 }) +
      textField("Email", "contact.email", { type: "email" }) +
      "</div></div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Details</h2><p>Short facts shown beside the contact copy.</p></div></div>' +
      objectList("contact.details", {
        template: "detail",
        label: "Detail",
        addLabel: "Add detail",
        fields: [
          { key: "label", label: "Label", placeholder: "Location" },
          { key: "value", label: "Value", placeholder: "Sarawak, Malaysia" }
        ]
      }) +
      "</div>" +

      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Social links</h2><p>Add GitHub, LinkedIn, Instagram, YouTube or anything else.</p></div></div>' +
      objectList("contact.socials", {
        template: "social",
        label: "Social link",
        addLabel: "Add social link",
        fields: [
          { key: "label", label: "Label", placeholder: "GitHub" },
          { key: "icon", label: "Icon", type: "select", options: ["github", "linkedin", "instagram", "youtube", "email", "website"].map(function (name) { return { value: name, label: name }; }) },
          { key: "url", label: "URL", type: "url", wide: true, placeholder: "https://…" }
        ]
      }) +
      "</div>"
    );
  }

  /* ---------- view: health ---------- */

  function collectIssues() {
    var issues = [];
    if (!data) return issues;
    var meta = data.meta || {};
    var projects = data.projects || [];
    var seenIds = {};

    function add(severity, title, detail, fix) {
      issues.push({ severity: severity, title: title, detail: detail, fix: fix });
    }

    if (!String(meta.name || "").trim()) add("error", "Your name is missing", "Add your full name in Site & hero.", { view: "site", path: "meta.name" });
    if (!String(meta.role || "").trim()) add("error", "Role is missing", "Add a role or headline in Site & hero.", { view: "site", path: "meta.role" });
    if (!String(meta.email || "").trim()) {
      add("error", "Email is missing", "Add an email address in Site & hero.", { view: "site", path: "meta.email" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(meta.email)) {
      add("error", "Email looks invalid", "Use a normal address such as name@example.com.", { view: "site", path: "meta.email" });
    } else if (/andrewung\.dev|example\.(com|org)/i.test(meta.email)) {
      add("warning", "Email is still a placeholder", "Replace hello@andrewung.dev with your real email so visitors can reach you.", { view: "site", path: "meta.email" });
    }
    if (!meta.github) add("warning", "No GitHub link", "Add your GitHub profile URL.", { view: "site", path: "meta.github" });
    if (!data.hero || !data.hero.intro) add("error", "Hero intro is empty", "Write one or two sentences for the hero.", { view: "site", path: "hero.intro" });
    if (!data.hero || !data.hero.portrait) add("info", "No portrait yet", "The designed monogram is being used. Add a photo when you are ready.", { view: "site", path: "hero.portrait" });
    if (!meta.resumeUrl) add("info", "No resume link", "Optional: add a PDF link for a downloadable CV.", { view: "site", path: "meta.resumeUrl" });

    var socials = (data.contact && data.contact.socials) || [];
    if (!socials.length) add("warning", "No social links", "Add at least GitHub in Contact.", { view: "contact", path: "contact.socials" });

    if (!projects.length) add("error", "No projects", "Add at least one project.", { view: "projects", path: "projects" });

    projects.forEach(function (project, index) {
      var base = "projects." + index;
      if (!String(project.title || "").trim()) add("error", "Project " + (index + 1) + " has no title", "Add a title.", { view: "projects", project: index, path: base + ".title" });
      if (!String(project.id || "").trim()) {
        add("error", "Project " + (index + 1) + " has no slug", "Add a URL slug.", { view: "projects", project: index, path: base + ".id" });
      } else {
        if (!/^[a-z0-9-]+$/.test(project.id)) {
          add("error", "Slug needs fixing: " + project.id, "Use lowercase letters, numbers and hyphens only.", { view: "projects", project: index, path: base + ".id" });
        }
        if (seenIds[project.id]) add("error", "Duplicate slug: " + project.id, "Every project needs a unique slug.", { view: "projects", project: index, path: base + ".id" });
        seenIds[project.id] = true;
      }
      if (!project.year) add("error", "Project " + (index + 1) + " has no year", "Add a year.", { view: "projects", project: index, path: base + ".year" });
      if (!String(project.summary || "").trim()) add("error", "Project " + (index + 1) + " has no summary", "Write a short card summary.", { view: "projects", project: index, path: base + ".summary" });
      if (!project.tags || !project.tags.length) add("info", "Project " + (index + 1) + " has no tags", "Tags help visitors scan the work.", { view: "projects", project: index, path: base + ".tags" });
      if (!project.problem || !(project.problem.paragraphs || []).length) add("warning", "Project " + (index + 1) + " has no problem section", "Case studies read better with context.", { view: "projects", project: index, path: base + ".problem.paragraphs" });
      if (!project.process || !(project.process.paragraphs || []).length) add("warning", "Project " + (index + 1) + " has no approach section", "Explain how you built it.", { view: "projects", project: index, path: base + ".process.paragraphs" });
      if (!project.impact || !(project.impact.paragraphs || []).length) add("warning", "Project " + (index + 1) + " has no impact section", "Explain what changed.", { view: "projects", project: index, path: base + ".impact.paragraphs" });
      if (project.cover && project.cover.type === "image") {
        if (!project.cover.url) add("error", "Project " + (index + 1) + " cover is set to image but empty", "Upload an image or switch back to the designed icon.", { view: "projects", project: index, path: base + ".cover.url" });
        else if (!project.cover.alt) add("warning", "Project " + (index + 1) + " cover needs alt text", "Describe the image for screen readers.", { view: "projects", project: index, path: base + ".cover.alt" });
      }
      (project.links || []).forEach(function (link, linkIndex) {
        if (link.url && !/^https?:\/\//i.test(link.url)) {
          add("error", "Project " + (index + 1) + " link is not valid", "Links must start with http:// or https://.", { view: "projects", project: index, path: base + ".links." + linkIndex + ".url" });
        }
      });
    });

    (data.contact && data.contact.socials || []).forEach(function (social, index) {
      if (!social.url) add("warning", "Social link \"" + (social.label || index + 1) + "\" has no URL", "Add a URL or remove the row.", { view: "contact", path: "contact.socials." + index + ".url" });
      else if (!/^https?:\/\//i.test(social.url)) add("error", "Social link \"" + (social.label || index + 1) + "\" is invalid", "URLs must start with http:// or https://.", { view: "contact", path: "contact.socials." + index + ".url" });
    });

    return issues;
  }

  function viewHealth() {
    var issues = collectIssues();
    var errors = issues.filter(function (issue) { return issue.severity === "error"; }).length;
    var warnings = issues.filter(function (issue) { return issue.severity === "warning"; }).length;
    var info = issues.filter(function (issue) { return issue.severity === "info"; }).length;

    var list = issues.length
      ? issues.map(function (issue) {
          var fix = issue.fix || {};
          return (
            '<div class="health-item">' +
            '<div class="health-item-main"><span class="health-severity is-' + issue.severity + '"></span>' +
            "<div><h3>" + esc(issue.title) + "</h3><p>" + esc(issue.detail) + "</p></div></div>" +
            (fix.path
              ? '<button class="btn btn--small btn--ghost" type="button" data-action="fix-issue" data-view="' + esc(fix.view || "") + '" data-project="' + (fix.project === undefined ? "" : fix.project) + '" data-path="' + esc(fix.path) + '">Fix</button>'
              : "") +
            "</div>"
          );
        }).join("")
      : '<div class="empty-note">Everything looks good. Ready to publish.</div>';

    return (
      '<div class="health-summary">' +
      '<div class="health-stat"><strong>' + errors + "</strong><span>Errors blocking publish</span></div>" +
      '<div class="health-stat"><strong>' + warnings + "</strong><span>Warnings</span></div>" +
      '<div class="health-stat"><strong>' + info + "</strong><span>Optional improvements</span></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Content checks</h2><p>Fix errors before publishing. Warnings are suggestions, not blockers.</p></div></div>' +
      '<div class="health-list">' + list + "</div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><div><h2>Backups & data</h2><p>Download a copy before big edits. Import restores a previous JSON file.</p></div></div>' +
      '<div class="health-actions">' +
      '<button class="btn btn--small btn--ghost" type="button" data-action="download-backup">' + iconSpan("download") + "Download JSON</button>" +
      '<button class="btn btn--small btn--ghost" type="button" data-action="import-backup">' + iconSpan("upload") + "Import JSON</button>" +
      '<button class="btn btn--small btn--ghost" type="button" data-action="copy-json">' + iconSpan("copy") + "Copy JSON</button>" +
      '<button class="btn btn--small btn--danger" type="button" data-action="discard-draft">' + iconSpan("trash") + "Discard local draft</button>" +
      "</div>" +
      '<p class="field-help" style="margin-top:12px">Source: ' + esc(source === "github" ? "GitHub · " + CONFIG.repo + " · " + CONFIG.branch : "local file") +
      (sha ? " · " + esc(sha.slice(0, 7)) : "") + "</p>" +
      "</div>"
    );
  }

  /* ---------- field input handling ---------- */

  function splitList(value, mode) {
    if (mode === "comma") {
      return String(value).split(",").map(function (item) { return item.trim(); }).filter(Boolean);
    }
    if (mode === "paragraphs") {
      return String(value).split(/\n\s*\n/).map(function (item) { return item.trim(); }).filter(Boolean);
    }
    return String(value).split(/\r?\n/).map(function (item) { return item.trim(); }).filter(Boolean);
  }

  function coverTypePathFor(path) {
    var match = /^(projects\.\d+\.cover)\.(url|type|icon|alt)$/.exec(path);
    return match ? match[1] + ".type" : null;
  }

  function setCoverType(path, type) {
    var typePath = coverTypePathFor(path);
    if (!typePath) return;
    setPath(data, typePath, type);
    var select = document.querySelector('[data-path="' + typePath + '"]');
    if (select) select.value = type;
  }

  var coverPreviewTimer = null;

  function scheduleCoverPreview() {
    window.clearTimeout(coverPreviewTimer);
    coverPreviewTimer = window.setTimeout(function () {
      var preview = document.querySelector(".admin-cover-preview");
      var project = data && data.projects && data.projects[activeProject];
      if (preview && project) preview.innerHTML = coverMarkup(project, activeProject + 1);
    }, 400);
  }

  function handleEditorInput(event) {
    var target = event.target;
    if (target.matches('[data-role="project-search"]')) {
      filterProjectList(target.value);
      return;
    }
    var path = target.dataset.path;
    if (!path) return;

    var value;
    if (target.type === "checkbox") value = target.checked;
    else if (target.dataset.list) value = splitList(target.value, target.dataset.list);
    else if (target.type === "number") value = target.value === "" ? null : Number(target.value);
    else value = target.value;

    setPath(data, path, value);
    markDirty();

    if (/\.cover\.url$/.test(path)) {
      setCoverType(path, String(value).trim() ? "image" : "icon");
      scheduleCoverPreview();
    }

    if (/\.(title|year|category|featured|id)$/.test(path)) updateProjectListLabels();
    if (/\.(category|featured|cover\.type|cover\.icon)$/.test(path)) renderViewPreserve();
  }

  function filterProjectList(term) {
    var query = String(term || "").toLowerCase();
    $$("#projectList .project-list-item").forEach(function (item) {
      item.hidden = query && item.textContent.toLowerCase().indexOf(query) === -1;
    });
  }

  function updateProjectListLabels() {
    if (!data || !data.projects) return;
    $$("#projectList .project-list-item").forEach(function (item, index) {
      var project = data.projects[index];
      if (!project) return;
      var title = $(".project-list-title", item);
      var meta = $(".project-list-meta", item);
      if (title) title.textContent = project.title || "Untitled";
      if (meta) meta.innerHTML = esc(project.year || "—") + " · " + esc(UI.category(project.category).label) + (project.featured ? '<span class="project-featured-dot" title="Featured"></span>' : "");
    });
    var toolbarTitle = $("#projectToolbarTitle");
    var project = data.projects[activeProject];
    if (toolbarTitle && project) toolbarTitle.textContent = project.title || "Untitled";
  }

  /* ---------- actions ---------- */

  function handleEditorClick(event) {
    var tabButton = event.target.closest("[data-ptab]");
    if (tabButton) {
      activeProjectTab = tabButton.dataset.ptab;
      $$(".detail-tab").forEach(function (button) { button.classList.toggle("is-active", button === tabButton); });
      $$(".detail-pane").forEach(function (pane) { pane.hidden = pane.dataset.pane !== activeProjectTab; });
      return;
    }

    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = button.dataset.action;

    if (action === "add-project") {
      var project = clone(PROJECT_TEMPLATE);
      project.id = uniqueId("new-project");
      project.year = new Date().getFullYear();
      data.projects = data.projects || [];
      data.projects.push(project);
      activeProject = data.projects.length - 1;
      activeProjectTab = "basics";
      pushHistory();
      markDirty();
      renderEditor();
      window.scrollTo(0, 0);
      toast("Project added");
      return;
    }

    if (action === "select-project") {
      activeProject = Number(button.dataset.index) || 0;
      activeProjectTab = "basics";
      renderView();
      window.scrollTo(0, 0);
      return;
    }

    if (action === "duplicate-project") {
      var original = data.projects[activeProject];
      var copy = clone(original);
      copy.id = uniqueId((original.id || "project") + "-copy");
      copy.title = (original.title || "Untitled") + " (copy)";
      data.projects.splice(activeProject + 1, 0, copy);
      activeProject += 1;
      pushHistory();
      markDirty();
      renderEditor();
      toast("Project duplicated");
      return;
    }

    if (action === "delete-project") {
      var target = data.projects[activeProject];
      confirmModal(
        "Delete this project?",
        'This removes <strong>' + esc(target.title || "this project") + '</strong> from the draft. Nothing is deleted on GitHub until you publish.',
        "Delete project",
        function () {
          data.projects.splice(activeProject, 1);
          activeProject = Math.max(0, Math.min(activeProject, data.projects.length - 1));
          pushHistory();
          markDirty();
          renderEditor();
          closeModal();
          toast("Project deleted");
        },
        true
      );
      return;
    }

    if (action === "move-project-up" || action === "move-project-down") {
      var from = Number(button.dataset.index);
      var to = action === "move-project-up" ? from - 1 : from + 1;
      if (to < 0 || to >= data.projects.length) return;
      var moved = data.projects.splice(from, 1)[0];
      data.projects.splice(to, 0, moved);
      activeProject = to;
      pushHistory();
      markDirty();
      renderEditor();
      return;
    }

    if (action === "generate-slug") {
      var path = button.dataset.path;
      var sourceValue = getPath(data, button.dataset.source) || "";
      var index = Number(String(path).split(".")[1]);
      setPath(data, path, uniqueId(sourceValue || "project", index));
      var input = $('[data-path="' + path + '"]', editorBody);
      if (input) input.value = getPath(data, path);
      updateProjectListLabels();
      markDirty();
      toast("Slug generated");
      return;
    }

    if (action === "add-object") {
      var arrayPath = button.dataset.path;
      var list = getPath(data, arrayPath) || [];
      list.push(clone(TEMPLATES[button.dataset.template] || {}));
      setPath(data, arrayPath, list);
      pushHistory();
      markDirty();
      renderViewPreserve();
      return;
    }

    if (action === "remove-object") {
      var removePath = button.dataset.path;
      var removeIndex = Number(button.dataset.index);
      var removeList = getPath(data, removePath) || [];
      removeList.splice(removeIndex, 1);
      setPath(data, removePath, removeList);
      pushHistory();
      markDirty();
      renderViewPreserve();
      return;
    }

    if (action === "move-object-up" || action === "move-object-down") {
      var movePath = button.dataset.path;
      var moveIndex = Number(button.dataset.index);
      var moveTo = action === "move-object-up" ? moveIndex - 1 : moveIndex + 1;
      var moveList = getPath(data, movePath) || [];
      if (moveTo < 0 || moveTo >= moveList.length) return;
      var item = moveList.splice(moveIndex, 1)[0];
      moveList.splice(moveTo, 0, item);
      setPath(data, movePath, moveList);
      pushHistory();
      markDirty();
      renderViewPreserve();
      return;
    }

    if (action === "fix-issue") {
      var view = button.dataset.view || "site";
      var projectIndex = button.dataset.project;
      if (projectIndex !== "") activeProject = Number(projectIndex);
      switchView(view);
      var focusTarget = button.dataset.path;
      window.setTimeout(function () { focusPath(focusTarget); }, 120);
      return;
    }

    if (action === "download-backup") {
      downloadBackup();
      return;
    }

    if (action === "import-backup") {
      importFile.click();
      return;
    }

    if (action === "copy-json") {
      copyText(JSON.stringify(data, null, 4) + "\n", "JSON copied");
      return;
    }

    if (action === "discard-draft") {
      confirmModal(
        "Discard local draft?",
        "The autosaved draft in this browser will be removed. Your published content is not affected.",
        "Discard draft",
        function () {
          clearDraft();
          closeModal();
          toast("Local draft discarded");
        },
        true
      );
      return;
    }
  }

  function focusPath(path) {
    if (!path) return;
    var selector = '[data-path="' + String(path).replace(/"/g, '\\"') + '"]';
    var el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
      el.classList.add("is-invalid");
      window.setTimeout(function () { el.classList.remove("is-invalid"); }, 2200);
    }
  }

  /* ---------- file upload ---------- */

  function handleFileUpload(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var path = input.dataset.uploadPath;
    if (!path) return;

    if (!/^image\//.test(file.type)) {
      toast("Please choose an image file.", "error");
      input.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast("Images must be under 4 MB. Compress it and try again.", "error");
      input.value = "";
      return;
    }

    if (source === "local") {
      var reader = new FileReader();
      reader.onload = function () {
        setPath(data, path, String(reader.result));
        setCoverType(path, "image");
        markDirty();
        renderViewPreserve();
        toast("Image embedded in the local draft", "success");
      };
      reader.onerror = function () { toast("Could not read that image.", "error"); };
      reader.readAsDataURL(file);
      return;
    }

    if (!token) {
      toast("Connect a GitHub token to upload images.", "error");
      return;
    }

    toast("Uploading image to GitHub…");
    var extension = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    var base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
    var repoPath = CONFIG.uploadPath + "/" + base + "-" + Date.now() + "." + extension;

    fileToBase64(file)
      .then(function (content) {
        return ghFetch(fileUrl(repoPath), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Upload " + file.name + " via portfolio admin",
            content: content,
            branch: CONFIG.branch
          })
        });
      })
      .then(function () {
        setPath(data, path, repoPath);
        setCoverType(path, "image");
        markDirty();
        renderViewPreserve();
        toast("Image uploaded — " + repoPath, "success");
      })
      .catch(function (error) {
        toast("Upload failed: " + error.message, "error");
      });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || "");
        resolve(result.indexOf(",") >= 0 ? result.split(",")[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ---------- publish ---------- */

  function validate() {
    return collectIssues().filter(function (issue) { return issue.severity === "error"; });
  }

  function publish() {
    if (!data || publishing) return;
    var errors = validate();
    if (errors.length) {
      activeView = "health";
      renderEditor();
      showValidation(errors);
      toast("Fix " + errors.length + " error" + (errors.length === 1 ? "" : "s") + " before publishing.", "error");
      window.scrollTo(0, 0);
      return;
    }
    validationBox.hidden = true;

    if (source === "local") {
      openModal({
        title: "This is a local draft",
        body: "<p>You are editing without a GitHub token, so the site cannot be published from here. Your changes are autosaved in this browser.</p><p>Download the JSON backup and add it to the repository, or sign in with a token to publish directly.</p>",
        actions: [
          { label: "Cancel", variant: "ghost", onClick: closeModal },
          { label: "Download JSON", variant: "primary", onClick: function () { downloadBackup(); closeModal(); } }
        ]
      });
      return;
    }

    openModal({
      title: "Publish to GitHub?",
      body:
        "<p>This saves <strong>" + esc(CONFIG.contentPath) + "</strong> to <strong>" + esc(CONFIG.repo) + "</strong> on the <strong>" + esc(CONFIG.branch) + "</strong> branch.</p>" +
        "<p>Every publish creates a commit, so you can always restore an earlier version.</p>" +
        '<label class="field"><span>Commit message</span><input class="input" id="commitMessage" value="Update portfolio content — ' + esc(new Date().toLocaleDateString()) + '"></label>',
      actions: [
        { label: "Cancel", variant: "ghost", onClick: closeModal },
        {
          label: "Publish now",
          variant: "primary",
          onClick: function () {
            var message = $("#commitMessage").value.trim() || "Update portfolio content";
            closeModal();
            doPublish(message);
          }
        }
      ]
    });
  }

  function doPublish(message, forceSha) {
    if (publishing) return;
    setPublishing(true);
    var latestSha = forceSha;

    var step = latestSha
      ? Promise.resolve({ sha: latestSha })
      : ghFetch(contentUrl()).then(function (info) { return { sha: info.sha }; });

    step
      .then(function (info) {
        if (!forceSha && info.sha !== sha) {
          setPublishing(false);
          openModal({
            title: "The file changed on GitHub",
            body: "<p>Someone (or another tab) saved a newer version while you were editing.</p><p>Reload the latest content, or overwrite it with your draft.</p>",
            actions: [
              {
                label: "Reload latest",
                variant: "ghost",
                onClick: function () {
                  closeModal();
                  loadContent("github");
                  toast("Reloaded the latest content");
                }
              },
              {
                label: "Overwrite with mine",
                variant: "danger",
                onClick: function () {
                  closeModal();
                  doPublish(message, info.sha);
                }
              }
            ]
          });
          return null;
        }

        var json = JSON.stringify(data, null, 4) + "\n";
        return ghFetch(fileUrl(CONFIG.contentPath), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            content: utf8ToBase64(json),
            sha: info.sha,
            branch: CONFIG.branch
          })
        });
      })
      .then(function (result) {
        if (!result) return;
        if (result.content && result.content.sha) sha = result.content.sha;
        originalJson = JSON.stringify(data);
        dirty = false;
        updateDirtyBadge();
        clearDraft();
        var commitUrl = result.commit && result.commit.html_url;
        saveStatus.hidden = false;
        saveStatus.innerHTML =
          "Published. The site will refresh in about a minute." +
          (commitUrl ? ' <a href="' + esc(commitUrl) + '" target="_blank" rel="noopener">View this change on GitHub ↗</a>' : "");
        toast("Published to GitHub", "success");
        renderSidebar();
      })
      .catch(function (error) {
        handlePublishError(error);
      })
      .then(function () {
        setPublishing(false);
      });
  }

  function setPublishing(busy) {
    publishing = busy;
    var button = $("#publishBtn");
    button.disabled = busy;
    button.innerHTML = busy
      ? iconSpan("refresh") + '<span class="btn-label">Publishing…</span>'
      : iconSpan("cloud") + '<span class="btn-label">Publish</span>';
    paintIcons(button);
  }

  function handlePublishError(error) {
    if (error.status === 401) {
      signOut(true, "Your token expired. Sign in again to publish.");
      return;
    }
    if (error.status === 403) {
      showAlert(
        "GitHub refused the save (403): " + error.message +
        ". Check that the token has Contents: Read and write for " + CONFIG.repo + "."
      );
      return;
    }
    if (error.status === 404) {
      showAlert("Repository or file not found. Check js/admin-config.js and that the token can see this repository.");
      return;
    }
    if (error.status === 409) {
      showAlert("GitHub reported a conflict. Reload the latest content and try again.");
      return;
    }
    showAlert("Publish failed: " + error.message);
    toast("Publish failed", "error");
  }

  function showValidation(errors) {
    validationBox.hidden = false;
    validationBox.innerHTML =
      "<strong>" + errors.length + " item" + (errors.length === 1 ? "" : "s") + " need fixing before publishing:</strong>" +
      "<ul>" + errors.map(function (issue) { return "<li>" + esc(issue.title) + " — " + esc(issue.detail) + "</li>"; }).join("") + "</ul>";
  }

  /* ---------- backup / import ---------- */

  function downloadBackup() {
    if (!data) return;
    var json = JSON.stringify(data, null, 4) + "\n";
    var blob = new Blob([json], { type: "application/json" });
    var link = document.createElement("a");
    var date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = "portfolio-backup-" + date + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    toast("Backup downloaded", "success");
  }

  function handleImportFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(String(reader.result));
        if (!imported || typeof imported !== "object" || !imported.meta || !Array.isArray(imported.projects)) {
          throw new Error("This does not look like a portfolio backup.");
        }
        confirmModal(
          "Import this backup?",
          "This replaces the content currently in the editor. Your published site is not changed until you publish.",
          "Import backup",
          function () {
            data = imported;
            activeProject = 0;
            activeView = "site";
            dirty = JSON.stringify(data) !== originalJson;
            pushHistory();
            renderEditor();
            updateDirtyBadge();
            closeModal();
            toast("Backup imported", "success");
          }
        );
      } catch (error) {
        toast("Could not import: " + error.message, "error");
      }
      importFile.value = "";
    };
    reader.readAsText(file);
  }

  function copyText(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(message || "Copied", "success");
      }).catch(function () {
        fallbackCopy(text, message);
      });
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      toast(message || "Copied", "success");
    } catch (error) {
      toast("Copy failed", "error");
    }
    area.remove();
  }

  /* ---------- modal ---------- */

  function openModal(options) {
    closeModal();
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML =
      '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<h2 id="modalTitle">' + esc(options.title) + "</h2>" +
      '<div class="modal-body">' + (options.body || "") + "</div>" +
      '<div class="modal-actions"></div>' +
      "</div>";

    var actions = backdrop.querySelector(".modal-actions");
    (options.actions || []).forEach(function (action) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn " + (action.variant === "primary" ? "btn--primary" : action.variant === "danger" ? "btn--danger" : "btn--ghost");
      button.textContent = action.label;
      button.addEventListener("click", action.onClick);
      actions.appendChild(button);
    });

    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) closeModal();
    });

    modalRoot.appendChild(backdrop);
    var first = backdrop.querySelector("input, .modal-actions .btn");
    if (first) first.focus();
  }

  function closeModal() {
    modalRoot.innerHTML = "";
  }

  function confirmModal(title, body, confirmLabel, onConfirm, danger) {
    openModal({
      title: title,
      body: body,
      actions: [
        { label: "Cancel", variant: "ghost", onClick: closeModal },
        { label: confirmLabel, variant: danger ? "danger" : "primary", onClick: onConfirm }
      ]
    });
  }

  /* ---------- session ---------- */

  function signOut(silent, message) {
    removeToken();
    token = "";
    source = null;
    data = null;
    try { sessionStorage.removeItem(UNLOCK_KEY); } catch (err) { /* ignore */ }
    editorScreen.hidden = true;
    loginScreen.hidden = false;
    $("#passwordInput").value = "";
    if (silent) {
      showToken(message || "");
    } else {
      showPassword();
      toast("Signed out");
    }
  }

  /* ---------- bindings ---------- */

  function bindLogin() {
    $("#passwordBtn").addEventListener("click", unlock);
    $("#passwordInput").addEventListener("keydown", function (event) {
      if (event.key === "Enter") unlock();
    });
    $("#tokenBtn").addEventListener("click", connectToken);
    $("#tokenInput").addEventListener("keydown", function (event) {
      if (event.key === "Enter") connectToken();
    });
    $("#localModeBtn").addEventListener("click", startLocalMode);
    $("#backToPasswordBtn").addEventListener("click", showPassword);
  }

  function bindEditor() {
    $$(".side-link").forEach(function (link) {
      link.addEventListener("click", function () { switchView(link.dataset.view); });
    });

    $("#previewBtn").addEventListener("click", function () {
      togglePreview(!previewOpen);
    });
    $("#previewClose").addEventListener("click", function () { togglePreview(false); });
    $("#previewRefresh").addEventListener("click", function () {
      previewSrc = "";
      updatePreview(true);
      toast("Preview refreshed");
    });
    $("#backupBtn").addEventListener("click", downloadBackup);
    $("#publishBtn").addEventListener("click", publish);

    $("#changeTokenBtn").addEventListener("click", function () {
      confirmModal(
        "Change GitHub token?",
        "Your current draft stays saved in this browser. You will need to paste a new token to publish.",
        "Change token",
        function () {
          closeModal();
          signOut(true, "Paste a new GitHub token to continue.");
        }
      );
    });
    $("#signOutBtn").addEventListener("click", function () {
      confirmModal(
        "Sign out?",
        "Your draft stays saved in this browser. You can resume it next time.",
        "Sign out",
        function () {
          closeModal();
          signOut(false);
        }
      );
    });

    editorBody.addEventListener("input", handleEditorInput);
    editorBody.addEventListener("change", function (event) {
      if (event.target.matches('input[type="file"][data-upload-path]')) handleFileUpload(event.target);
    });
    editorBody.addEventListener("click", handleEditorClick);
    importFile.addEventListener("change", handleImportFile);
    previewFrame.addEventListener("load", function () {
      window.setTimeout(sendPreview, 300);
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-admin-theme-toggle]")) toggleTheme();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (modalRoot.children.length) closeModal();
      }
      var metaKey = event.ctrlKey || event.metaKey;
      if (metaKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        publish();
      }
      if (metaKey && !event.target.matches("input, textarea, select") && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (metaKey && !event.target.matches("input, textarea, select") && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function init() {
    paintIcons();
    syncThemeToggles();
    $("#loginSiteLink").href = CONFIG.siteUrl;
    $("#viewSiteLink").href = CONFIG.siteUrl;
    bindLogin();
    bindEditor();

    var unlocked = false;
    try { unlocked = sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch (err) { /* ignore */ }

    if (unlocked) {
      if (token) enterEditor("github");
      else showToken("");
    } else {
      showPassword();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
