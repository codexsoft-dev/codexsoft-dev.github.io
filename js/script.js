// CODEX · SOFT — small interactions for the static site
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
