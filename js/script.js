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
    if (event.target.closest("a")) setOpen(false);
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
  if (!links.length || !("IntersectionObserver" in window)) return;

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }

  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach(function (s) { observer.observe(s); });

  // Near the top of the page the hero ("Home") is always the active item.
  function checkTop() { if (window.scrollY < 120) setActive("home"); }
  window.addEventListener("scroll", checkTop, { passive: true });
  setTimeout(checkTop, 50);

  links.forEach(function (a) {
    a.addEventListener("click", function () { setActive(a.getAttribute("href").slice(1)); });
  });
})();
