// CODEX · SOFT — small interactions for the static site
(function () {
  var toggle = document.getElementById("menuToggle");
  var overlay = document.getElementById("navOverlay");
  var nav = document.getElementById("nav");
  var header = document.querySelector(".site-header");
  if (!toggle || !nav) return;

  var label = toggle.querySelector(".sr-only");
  var desktop = window.matchMedia("(min-width: 1024px)");

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (label) label.textContent = open ? "Close menu" : "Open menu";
    if (overlay) overlay.setAttribute("aria-hidden", open ? "false" : "true");
  }

  toggle.addEventListener("click", function () {
    setOpen(!document.body.classList.contains("nav-open"));
  });

  if (overlay) overlay.addEventListener("click", function () { setOpen(false); });

  nav.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    var id = href.charAt(0) === "#" ? href.slice(1) : "";
    var target = id ? document.getElementById(id) : null;
    var fixed = header && getComputedStyle(header).position === "fixed";
    if (fixed && target) {
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(function () {
        var offset = header.getBoundingClientRect().height + 16;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        if (history.pushState) history.pushState(null, "", "#" + id);
      });
      return;
    }
    setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  function onDesktop(event) {
    if (event.matches) setOpen(false);
  }
  if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
  else if (desktop.addListener) desktop.addListener(onDesktop);

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('header nav a[href^="#"]'));
  if (!links.length) return;

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }

  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  // The active item is the section that has reached the line just under the
  // fixed header. A band in the middle of the screen was selecting the next
  // section (About highlighted Education).
  function clearance() {
    var bar = document.querySelector(".site-header");
    if (!bar || getComputedStyle(bar).position !== "fixed") return 32;
    return bar.getBoundingClientRect().height + 24;
  }

  function updateActive() {
    var line = clearance();
    var current = sections[0];
    var best = -Infinity;
    var slack = 80;
    sections.forEach(function (section) {
      var top = section.getBoundingClientRect().top;
      // Equal tops are side-by-side cards. Keep the earlier one so About
      // does not get replaced by Education.
      if (top <= line + slack && top > best) {
        best = top;
        current = section;
      }
    });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = sections[sections.length - 1];
    if (current) setActive(current.id);
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
  if ("onscrollend" in window) window.addEventListener("scrollend", updateActive);
  updateActive();

  links.forEach(function (a) {
    a.addEventListener("click", function () { setActive(a.getAttribute("href").slice(1)); });
  });
})();
