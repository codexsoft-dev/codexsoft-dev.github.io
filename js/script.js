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
      // Equal tops are side-by-side cards. Keep About, even though Education
      // now comes first in the menu.
      if (top <= line + slack && top > best + 0.5) {
        best = top;
        current = section;
      } else if (top <= line + slack && Math.abs(top - best) <= 0.5 && section.id === "about") {
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

(function () {
  var more = document.getElementById("aboutMore");
  var less = document.getElementById("aboutLess");
  var rest = document.getElementById("aboutRest");
  var courses = document.getElementById("showAllCourses");
  var courseItems = document.querySelectorAll("#education .edu-extra");
  if (!more || !less || !rest) return;

  // A mouse click would focus the control. Hiding that control then moves
  // focus onto "show less...", and the browser scrolls it into view.
  more.addEventListener("mousedown", function (event) { event.preventDefault(); });
  less.addEventListener("mousedown", function (event) { event.preventDefault(); });
  if (courses) courses.addEventListener("mousedown", function (event) { event.preventDefault(); });

  function expandAbout() {
    rest.hidden = false;
    more.hidden = true;
  }

  function expandCourses() {
    if (!courses) return;
    courseItems.forEach(function (item) { item.hidden = false; });
    courses.hidden = true;
    courses.setAttribute("aria-expanded", "true");
  }

  more.addEventListener("click", function (event) {
    event.preventDefault();
    expandAbout();
  });

  less.addEventListener("click", function (event) {
    event.preventDefault();
    rest.hidden = true;
    more.hidden = false;
  });

  if (courses) {
    courses.addEventListener("click", function (event) {
      event.preventDefault();
      expandCourses();
    });
  }
})();

(function () {
  var trigger = document.getElementById("exploreSkills");
  var extras = document.querySelectorAll("#skills .skill-extra");
  var moreCopy = document.getElementById("skillsMore");
  if (!trigger || !extras.length) return;

  trigger.addEventListener("mousedown", function (event) { event.preventDefault(); });
  trigger.addEventListener("click", function (event) {
    event.preventDefault();
    if (moreCopy) moreCopy.hidden = false;
    extras.forEach(function (item) { item.hidden = false; });
    trigger.setAttribute("aria-expanded", "true");
  });
})();

(function () {
  var modal = document.getElementById("contactModal");
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  if (!modal || !form) return;

  function lockPage(open) {
    document.body.style.overflow = open ? "hidden" : "";
  }

  function openModal() {
    modal.hidden = false;
    lockPage(true);
    var field = modal.querySelector("input");
    if (field) field.focus();
  }

  function closeModal() {
    modal.hidden = true;
    lockPage(false);
    if (status) status.textContent = "";
  }

  document.querySelectorAll("[data-open-contact]").forEach(function (el) {
    el.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      var toggle = document.getElementById("menuToggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        var label = toggle.querySelector(".sr-only");
        if (label) label.textContent = "Open menu";
      }
      var overlay = document.getElementById("navOverlay");
      if (overlay) overlay.setAttribute("aria-hidden", "true");
      openModal();
    });
  });

  document.querySelectorAll("[data-close-contact]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim();
    var message = String(data.get("message") || "").trim();

    if (!name || !email || !message) {
      status.textContent = "Please fill in name, email and message.";
      return;
    }

    status.textContent = "Thanks — we will get back to you shortly.";
    form.reset();
  });
})();

