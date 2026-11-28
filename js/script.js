/*
 * CODEX · SOFT — Marko Z. Petković
 * All interactivity for index.html, privacy.html and terms.html:
 *   1. Mobile menu
 *   2. Active menu item while scrolling (home page)
 *   3. Contact dialog and form
 *   4. "Show All Skills" / "Show Fewer Skills"
 *   5. Courses list: custom scrollbar, "Show All Courses", About "show more..."
 *   6. Footer year, opening a #section link from another page
 *   7. Education: "Follow for Go tips & tricks!" lined up with the links
 *   8. profile.go card: wrap stack items to fill the width of the IDE card
 */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  /* Uses the attribute (not el.hidden) so it works for SVG icons too. */
  var show = function (el, on) {
    if (!el) return;
    if (on) el.removeAttribute("hidden");
    else el.setAttribute("hidden", "");
  };
  /* Toggle buttons keep focus where it was (no focus ring after a click). */
  var keepFocus = function (el) { if (el) el.addEventListener("mousedown", function (e) { e.preventDefault(); }); };

  var header = $("[data-site-header]");

  /* ------------------------------------------------------------------ */
  /* 1. Mobile menu                                                      */
  /* ------------------------------------------------------------------ */
  var menuButton = $("[data-menu-toggle]");
  var mobileNav = $("#mobile-nav");
  var menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    if (!menuButton) return;
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    show($("[data-icon-open]", menuButton), !open);
    show($("[data-icon-close]", menuButton), open);
    $("[data-menu-label]", menuButton).textContent = open ? "Close menu" : "Open menu";
    show(mobileNav, open);
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () { setMenu(!menuOpen); });
    // The logo and every link in the mobile menu close it.
    $$("#mobile-nav a").concat($$("header > div > a")).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2. Active menu item: the section that has reached the line just     */
  /*    under the sticky header (home page only).                        */
  /* ------------------------------------------------------------------ */
  var NAV_IDS = ["home", "skills", "experience", "education", "about"];
  var DEFAULT_MARGIN = 88; // scroll margin (5.5rem) every section uses under the header
  var navLinks = $$("[data-nav-link]").filter(function (a) { return a.getAttribute("href").charAt(0) === "#"; });

  function updateActive() {
    var line = (header ? header.getBoundingClientRect().height : 72) + 80;
    var current = NAV_IDS[0];
    NAV_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      // A target with a larger scroll margin (Education) counts from where its link lands it.
      var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || DEFAULT_MARGIN;
      if (el.getBoundingClientRect().top - margin + DEFAULT_MARGIN <= line) current = id;
    });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = NAV_IDS[NAV_IDS.length - 1];
    navLinks.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + current;
      a.classList.toggle("text-foreground", on);
      a.classList.toggle("text-muted-foreground", !on);
    });
  }

  if (navLinks.length && document.getElementById("home")) {
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
  }

  /* ------------------------------------------------------------------ */
  /* 3. Contact dialog                                                   */
  /* ------------------------------------------------------------------ */
  var overlay = $("[data-dialog-overlay]");
  var dialog = $("[data-dialog]");
  var page = document.body.firstElementChild;
  var form = $("[data-contact-form]");
  var statusEl = $("[data-contact-status]");
  var dialogOpen = false;
  var returnFocus = null;
  var closeTimer = null;

  function tabbables() {
    return $$("input, textarea, button, select, a[href], [tabindex]:not([tabindex='-1'])", dialog)
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function lockScroll(on) {
    var body = document.body;
    if (on) {
      var gap = window.innerWidth - document.documentElement.clientWidth;
      body.setAttribute("data-scroll-locked", "1");
      if (gap > 0) body.style.setProperty("margin-right", gap + "px", "important");
      body.style.pointerEvents = "none";
    } else {
      body.removeAttribute("data-scroll-locked");
      body.style.removeProperty("margin-right");
      body.style.removeProperty("pointer-events");
      if (!body.getAttribute("style")) body.removeAttribute("style");
    }
  }

  function openDialog() {
    if (!dialog || dialogOpen) return;
    clearTimeout(closeTimer);
    dialogOpen = true;
    returnFocus = document.activeElement;
    [overlay, dialog].forEach(function (el) {
      show(el, true);
      el.setAttribute("data-state", "open");
      el.style.pointerEvents = "auto";
    });
    if (page) page.setAttribute("aria-hidden", "true");
    lockScroll(true);
    var first = tabbables()[0];
    (first || dialog).focus({ preventScroll: true });
  }

  function closeDialog() {
    if (!dialogOpen) return;
    dialogOpen = false;
    [overlay, dialog].forEach(function (el) { el.setAttribute("data-state", "closed"); });
    var finish = function () {
      if (dialogOpen) return;
      [overlay, dialog].forEach(function (el) { show(el, false); el.removeAttribute("style"); });
      // The form starts empty every time the dialog opens again.
      form.reset();
      statusEl.textContent = "";
    };
    dialog.addEventListener("animationend", function done(e) {
      if (e.target !== dialog) return;
      dialog.removeEventListener("animationend", done);
      finish();
    });
    closeTimer = setTimeout(finish, 400);
    if (page) page.removeAttribute("aria-hidden");
    lockScroll(false);
    if (returnFocus && document.contains(returnFocus) && returnFocus.offsetParent !== null) {
      returnFocus.focus({ preventScroll: true });
    }
  }

  $$("[data-contact-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setMenu(false);
      openDialog();
    });
  });

  if (dialog) {
    $("[data-dialog-close]", dialog).addEventListener("click", closeDialog);
    overlay.addEventListener("pointerdown", closeDialog);
    document.addEventListener("keydown", function (e) {
      if (!dialogOpen) return;
      if (e.key === "Escape") { e.preventDefault(); closeDialog(); return; }
      if (e.key === "Tab") {
        // Keep keyboard focus inside the dialog.
        var items = tabbables();
        if (!items.length) { e.preventDefault(); return; }
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();
      if (!name || !email || !message) {
        statusEl.textContent = "Please fill in name, email and message.";
        return;
      }
      statusEl.textContent = "Thanks — I'll get back to you shortly.";
      form.reset();
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. Skills: "Show All Skills" / "Show Fewer Skills"                  */
  /* ------------------------------------------------------------------ */
  var skillsGrid = $("[data-skills-grid]");
  if (skillsGrid) {
    var expandBtn = $("[data-skills-expand]");
    var collapseBtn = $("[data-skills-collapse]");
    var setSkills = function (expanded) {
      show($("[data-skills-more]"), expanded);
      $$("[data-skill-extra]").forEach(function (li) { show(li, expanded); });
      show($("[data-skills-expand-row]"), !expanded);
      show($("[data-skills-collapse-row]"), expanded);
    };
    keepFocus(expandBtn);
    keepFocus(collapseBtn);
    expandBtn.addEventListener("click", function () { setSkills(true); });
    collapseBtn.addEventListener("click", function () {
      setSkills(false);
      // After folding back, bring the shorter grid into view if it scrolled away.
      requestAnimationFrame(function () {
        if (skillsGrid.getBoundingClientRect().bottom < 120) skillsGrid.scrollIntoView({ block: "center" });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. Courses + About                                                  */
  /* ------------------------------------------------------------------ */
  var list = $("[data-courses-list]");
  if (list) {
    var fadeBand = $("[data-courses-fade]");
    var thumb = $("[data-courses-thumb]");
    var coursesBtn = $("[data-courses-toggle]");
    var aboutMore = $("[data-about-more]");
    var aboutLess = $("[data-about-less]");
    var aboutRest = $("[data-about-rest]");

    // Custom scrollbar and bottom fade of the course list.
    var measure = function () {
      var sh = list.scrollHeight, ch = list.clientHeight, st = list.scrollTop;
      var size = sh > 0 ? Math.min(1, ch / sh) : 1;
      var range = sh - ch;
      var top = range > 0 ? (st / range) * (1 - size) : 0;
      thumb.style.top = top * 100 + "%";
      thumb.style.height = size * 100 + "%";
      var more = range - st > 4;
      fadeBand.classList.toggle("opacity-100", more);
      fadeBand.classList.toggle("opacity-0", !more);
    };
    list.addEventListener("scroll", measure);
    /* Courses beyond the first are hidden until "Show All Courses". On desktop (two columns) the
       course window fills the height of the section, which matches profile.go and About me, so
       by default as many courses are revealed as it takes to fill that window. */
    var extras = $$("[data-course-extra]");
    var deskMq = window.matchMedia ? window.matchMedia("(min-width: 64rem)") : null;
    var fitting = false;
    var applyCourses = function () {
      if (fitting) return;
      fitting = true;
      var all = typeof state !== "undefined" && state.showAllCourses;
      extras.forEach(function (li) { show(li, all); });
      if (!all && deskMq && deskMq.matches) {
        for (var i = 0; i < extras.length && list.scrollHeight <= list.clientHeight + 1; i++) show(extras[i], true);
      }
      fitting = false;
    };
    var relayout = function () { applyCourses(); measure(); };
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(relayout);
      ro.observe(list);
      Array.prototype.forEach.call(list.children, function (c) { ro.observe(c); });
    }
    if (deskMq && deskMq.addEventListener) deskMq.addEventListener("change", relayout);
    window.addEventListener("resize", relayout);
    window.addEventListener("load", relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

    // Dragging the thumb scrolls the list.
    thumb.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      var startY = event.clientY, startScroll = list.scrollTop;
      var ratio = list.scrollHeight / list.clientHeight;
      var move = function (e) { list.scrollTop = startScroll + (e.clientY - startY) * ratio; };
      var up = function () {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });

    /* "show more..." / "show less..." only expand or fold the About text; the courses list is independent. */
    var state = { aboutExpanded: false, showAllCourses: false, coursesOpenedByAbout: false };

    var courseScrollFrame = 0;
    var cancelCourseScroll = function () {
      if (courseScrollFrame) {
        cancelAnimationFrame(courseScrollFrame);
        courseScrollFrame = 0;
      }
    };
    var easeInOutCubic = function (t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    var courseScrollTarget = function (second) {
      return list.scrollTop + second.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientTop;
    };
    var scrollCoursesToSecond = function () {
      var second = list.children[1];
      if (!second) return;
      var from = list.scrollTop;
      var to = courseScrollTarget(second);
      if (Math.abs(to - from) < 1) return;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { list.scrollTop = courseScrollTarget(second); return; }
      cancelCourseScroll();
      var duration = 1000;
      var start = performance.now();
      var step = function (now) {
        var t = Math.min(1, (now - start) / duration);
        var dest = courseScrollTarget(second);
        list.scrollTop = from + (dest - from) * easeInOutCubic(t);
        if (t < 1) courseScrollFrame = requestAnimationFrame(step);
        else {
          list.scrollTop = courseScrollTarget(second);
          courseScrollFrame = 0;
        }
      };
      courseScrollFrame = requestAnimationFrame(step);
    };
    list.addEventListener("wheel", cancelCourseScroll, { passive: true });
    list.addEventListener("touchstart", cancelCourseScroll, { passive: true });
    list.addEventListener("pointerdown", cancelCourseScroll);

    var render = function (prev) {
      if (prev.showAllCourses !== state.showAllCourses) {
        applyCourses();
        coursesBtn.setAttribute("aria-expanded", state.showAllCourses ? "true" : "false");
        var coursesLabel = $("[data-courses-label]", coursesBtn);
        var coursesText = state.showAllCourses ? "Show Fewer Courses" : "Show All Courses";
        if (coursesLabel) coursesLabel.textContent = coursesText; else coursesBtn.textContent = coursesText;
        show($("[data-courses-icon-more]", coursesBtn), !state.showAllCourses);
        show($("[data-courses-icon-less]", coursesBtn), state.showAllCourses);
        // When the list folds back to one course, jump to its top (instant).
        if (!state.showAllCourses) {
          cancelCourseScroll();
          list.scrollTop = 0;
        }
        measure();
        // On phones and tablets (below 1024px), "Show All Courses" scrolls the
        // course window — not the page — so the second course is at the top.
        if (state.showAllCourses && !(deskMq && deskMq.matches)) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { scrollCoursesToSecond(); });
          });
        }
      }
      if (prev.aboutExpanded !== state.aboutExpanded) {
        show(aboutMore, !state.aboutExpanded);
        show(aboutRest, state.aboutExpanded);
      }
    };

    var dispatch = function (action) {
      var prev = state;
      var s = { aboutExpanded: prev.aboutExpanded, showAllCourses: prev.showAllCourses, coursesOpenedByAbout: prev.coursesOpenedByAbout };
      switch (action) {
        case "showAllCourses": s.showAllCourses = true; s.coursesOpenedByAbout = false; break;
        case "hideAllCourses": s.showAllCourses = false; s.coursesOpenedByAbout = false; break;
        case "aboutMore": s.aboutExpanded = true; break;
        case "aboutLess": s.aboutExpanded = false; break;
      }
      state = s;
      render(prev);
    };

    keepFocus(coursesBtn);
    coursesBtn.addEventListener("click", function () {
      var wasOpen = state.showAllCourses;
      dispatch(wasOpen ? "hideAllCourses" : "showAllCourses");
      if (!wasOpen) return;
      // When folding back, keep the button in view on phones, where the list above it shrinks.
      requestAnimationFrame(function () {
        if (coursesBtn.getBoundingClientRect().top < 80) coursesBtn.scrollIntoView({ block: "center" });
      });
    });

    relayout();

    keepFocus(aboutMore);
    keepFocus(aboutLess);
    aboutMore.addEventListener("click", function () {
      dispatch("aboutMore");
    });
    aboutLess.addEventListener("click", function () { dispatch("aboutLess"); });
  }

  /* ------------------------------------------------------------------ */
  /* 6. Footer year; a link such as index.html#about from another page   */
  /* ------------------------------------------------------------------ */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  if (window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target) requestAnimationFrame(function () { setTimeout(function () { target.scrollIntoView(); }, 50); });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Education: when the social links wrap (X and Instagram on one    */
  /*    row, LinkedIn below), the "Follow for Go tips & tricks!" note     */
  /*    ends, with its arrow, under the right end of the FIRST row. On    */
  /*    one row, or with the links stacked, the CSS places it.            */
  /* ------------------------------------------------------------------ */
  var eduSocials = $(".edu-socials");
  var eduFollow = $(".edu-follow");
  if (eduSocials && eduFollow) {
    var alignFollow = function () {
      eduFollow.style.marginRight = "";
      eduFollow.style.justifyContent = "";
      // Phones: one link per row, the note stays centred (CSS).
      if (getComputedStyle(eduSocials).flexDirection === "column") return;
      var links = $$("a", eduSocials);
      if (!links.length) return;
      var firstTop = links[0].getBoundingClientRect().top;
      var rowEnd = 0;
      links.forEach(function (a) {
        var r = a.getBoundingClientRect();
        if (Math.abs(r.top - firstTop) < 2) rowEnd = Math.max(rowEnd, r.right);
      });
      var extra = eduSocials.getBoundingClientRect().right - rowEnd;
      if (extra < 0.5) return; // all on one row
      // The small negative offset puts the arrow's tip, not the edge of its box, under the row end.
      eduFollow.style.justifyContent = "flex-end";
      eduFollow.style.marginRight = "calc(-0.5rem + " + extra.toFixed(1) + "px)";
    };
    alignFollow();
    if (window.ResizeObserver) new ResizeObserver(alignFollow).observe(eduSocials);
    else window.addEventListener("resize", alignFollow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignFollow);
  }



  /* ------------------------------------------------------------------ */
  /* 8. profile.go: pack "primary" / "secondary" items onto as many     */
  /*    columns as fit the card width (font size stays the same). The   */
  /*    static HTML keeps two items per line if JS does not run.        */
  /* ------------------------------------------------------------------ */
  var profilePre = $(".profile-ide pre");
  if (profilePre) {
    var STACK_INDENT = "        ";
    var stackBlocks = $$("[data-stack]", profilePre).map(function (el) {
      var items = $$("span", el).map(function (s) {
        return s.textContent.replace(/^"|"$/g, "");
      });
      return { el: el, items: items };
    });
    var fittingStack = false;
    var lastPackKey = "";
    var measureText = function (text, family, weight, style, spacing, size) {
      var probe = document.createElement("span");
      probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;";
      probe.style.fontFamily = family;
      probe.style.fontWeight = weight;
      probe.style.fontStyle = style;
      probe.style.letterSpacing = spacing;
      probe.style.fontSize = size;
      probe.textContent = text;
      document.body.appendChild(probe);
      var w = probe.getBoundingClientRect().width;
      document.body.removeChild(probe);
      return w;
    };
    var itemMarkup = function (value) {
      return '<span class="text-code-string">"' + value + '"</span>,';
    };
    var wrapStacks = function () {
      if (fittingStack || !stackBlocks.length) return;
      fittingStack = true;
      var cs = getComputedStyle(profilePre);
      var padL = parseFloat(cs.paddingLeft) || 0;
      var padR = parseFloat(cs.paddingRight) || 0;
      var inner = profilePre.clientWidth - padL - padR;
      var margin = Math.min(padL || 16, 16);
      var available = Math.max(0, inner - margin);
      var fontKey = measureText("Mg", cs.fontFamily, cs.fontWeight, cs.fontStyle, cs.letterSpacing, cs.fontSize).toFixed(2);
      var key = [profilePre.clientWidth, available.toFixed(2), cs.fontSize, fontKey].join(":");
      if (key === lastPackKey) { fittingStack = false; return; }
      var indentW = measureText(STACK_INDENT, cs.fontFamily, cs.fontWeight, cs.fontStyle, cs.letterSpacing, cs.fontSize);
      var spaceW = measureText(" ", cs.fontFamily, cs.fontWeight, cs.fontStyle, cs.letterSpacing, cs.fontSize);
      stackBlocks.forEach(function (block) {
        var itemWidths = block.items.map(function (value) {
          return measureText('"' + value + '",', cs.fontFamily, cs.fontWeight, cs.fontStyle, cs.letterSpacing, cs.fontSize);
        });
        var lines = [];
        var current = [];
        var currentW = 0;
        block.items.forEach(function (value, i) {
          var w = itemWidths[i];
          var extra = current.length === 0 ? indentW : spaceW;
          if (current.length && currentW + extra + w > available + 0.5) {
            lines.push(current);
            current = [];
            currentW = 0;
            extra = indentW;
          }
          current.push(value);
          currentW += extra + w;
        });
        if (current.length) lines.push(current);
        var html = lines.map(function (line) {
          return STACK_INDENT + line.map(itemMarkup).join(" ");
        }).join("\n") + "\n";
        block.el.innerHTML = html;
      });
      lastPackKey = key;
      fittingStack = false;
    };
    wrapStacks();
    if (window.ResizeObserver) new ResizeObserver(wrapStacks).observe(profilePre);
    window.addEventListener("resize", wrapStacks);
    window.addEventListener("load", wrapStacks);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(wrapStacks);
  }
})();
