# Disabled: loading splash (intro screen)

This folder holds the loading splash (intro screen) for the CODEX · SOFT site.
It is **not used**: no page links to anything in here. It is kept so it can be
switched back on later.

The splash was disabled on 2026-11-27. The last commit where it was active is
`9db414d`.

**The web app manifest and its icons are active again** (since 2026-11-27).
They now live at the site root: `site.webmanifest` and `images/manifest/`
(`icon-192/512/1024.png` on flat navy `#0f1f37`,
`icon-maskable-192/512/1024.png` on a navy gradient, `apple-touch-icon.png`). Their `<link>` tags are
already in the `<head>` of `index.html`, `privacy.html` and `terms.html`, so
only the splash needs reactivating.

> GitHub Pages still serves this folder if someone knows the URL, so
> `robots.txt` asks search engines not to crawl `/_disabled/`.

## Contents

- `images/manifest/splash.webp`, `splash.jpg`: the 720×1280 splash image.

## How the splash worked

- It showed only on touch devices without hover (phones and tablets), via
  `(hover: none) and (pointer: coarse)`. On desktop it never painted and
  the image was never downloaded.
- The image was centred on matching dark edge colours, never cropping the
  text or logo.
- It faded out on `window.load`: at least 600 ms on the first visit in a
  session, at most 2.5 s (JS timer). A CSS animation at 2.6 s hides it even
  if JS fails, and `<noscript>` hides it with JS off.
- `prefers-reduced-motion` was respected, and the element was removed
  from the DOM afterwards.
- With `display: standalone`, Android also shows its own launch screen
  (background colour + icon) before the page loads, if the site was added
  to the home screen as an app. `display: browser` avoids that, but then
  it opens as a normal tab.

## How to reactivate

1. Move `_disabled/splash-manifest/images/manifest/splash.webp` and
   `splash.jpg` to `images/manifest/` (next to the icons).
2. In `index.html`, paste snippet **A** in `<head>` just before
   `<style>html{background-color:#0f1f37}</style>`, **without** its first
   two lines. The manifest and apple-touch-icon links are already there.
3. In `index.html`, paste snippet **B** right after `<body>`.
4. `privacy.html` and `terms.html` need nothing (they never had the splash).
   Snippet **C** is already active.
5. Remove the `/_disabled/` line from `robots.txt` if nothing else is left
   in this folder.
6. Optional: for a seamless start, set `background_color` in
   `site.webmanifest` to `#000b23` (the splash image's edge colour); it is
   currently `#0f1f37`. On a phone, remove the installed app, clear the site
   data and install again, because the manifest is cached.

### A: `index.html` `<head>` (manifest, icon, preload, splash CSS)

```html
  <link rel="manifest" href="site.webmanifest">
  <link rel="apple-touch-icon" href="images/manifest/apple-touch-icon.png" sizes="180x180">
  <link rel="preload" as="image" href="images/manifest/splash.webp" type="image/webp" media="(hover: none) and (pointer: coarse)" fetchpriority="high">
  <style id="splash-css">
    html{background-color:#0f1f37}
    .splash{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;overflow:hidden;background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACACAIAAABFm5SjAAAAeUlEQVR42n2QwRXDMAxC+WzQUbr/bqaH2FLiJD3wJGMskKXP19KwEiuzasz+ANLk01WxouqTGMmAVfp1r+JGRnO7JidtvZvzkFl9YT+/cXJ45heMDZ5e9CyOGuFcMmFov5z3rH13n/zNcMsPzuUP2DSd733/pXnU/QC22DQ2xqnzlAAAAABJRU5ErkJggg==") left top/50.5% 100% no-repeat,url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACACAIAAABFm5SjAAAAh0lEQVR42n2RyxEDMQhDn5QC0kb6L3CVA9iLNzM5MAjxtczr/TGSQQasheXC7SUXZvI2O3fXwNk746qrHfcuWb0f0bfIEsV1TeHTBM7BpXxSfGb8D8ek+rN9un/Oap78xnPezPU8dt3jtrbqu5w2suIYrv1H63/cei69pnaArzV/aZfW6n7nF7I1XUpK7EXfAAAAAElFTkSuQmCC") right top/50.5% 100% no-repeat,#000b23;transition:opacity .55s ease,visibility .55s ease;animation:splash-out .55s ease 2.6s forwards}
    .splash.is-hidden{opacity:0;visibility:hidden;pointer-events:none}
    .splash picture{display:contents}
    .splash__img{display:block;flex:none;max-width:none;width:auto;aspect-ratio:720/1280;height:min(100vh,calc(100vw * 1280 / 640));-webkit-mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent),linear-gradient(to bottom,transparent,#000 5%,#000 95%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent),linear-gradient(to bottom,transparent,#000 5%,#000 95%,transparent);mask-composite:intersect;transform:translateX(-2%);animation:splash-in .6s ease both}
    @supports (height:100dvh){.splash__img{height:min(100dvh,calc(100vw * 1280 / 640))}}
    @media (hover: none) and (pointer: coarse){.splash{display:flex}}
    @keyframes splash-in{from{opacity:0;transform:translateX(-2%) scale(.985)}to{opacity:1;transform:translateX(-2%)}}
    @keyframes splash-out{to{opacity:0;visibility:hidden;pointer-events:none}}
    @media (prefers-reduced-motion:reduce){.splash{transition:none}.splash__img{animation:none}}
  </style>
  <noscript><style>.splash{display:none}</style></noscript>
```

### B: `index.html` right after `<body>` (splash markup + script)

```html
  <div class="splash" id="splash" aria-hidden="true">
    <picture>
      <source media="(hover: none) and (pointer: coarse)" srcset="images/manifest/splash.webp" type="image/webp">
      <source media="(hover: none) and (pointer: coarse)" srcset="images/manifest/splash.jpg" type="image/jpeg">
      <img class="splash__img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width="720" height="1280" fetchpriority="high" decoding="async">
    </picture>
  </div>
  <script>
    (function () {
      var s = document.getElementById('splash');
      if (!s) return;
      if (!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)) { s.parentNode.removeChild(s); return; }
      var t0 = Date.now(), done = false, seen = false;
      try { seen = sessionStorage.getItem('splashSeen') === '1'; sessionStorage.setItem('splashSeen', '1'); } catch (e) {}
      var minShow = seen ? 0 : 600;
      function hide() {
        if (done) return;
        done = true;
        setTimeout(function () {
          s.classList.add('is-hidden');
          setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
        }, Math.max(0, minShow - (Date.now() - t0)));
      }
      if (document.readyState === 'complete') hide();
      else window.addEventListener('load', hide);
      setTimeout(hide, 2500);
    })();
  </script>
```

### C: `privacy.html` / `terms.html` `<head>` (already active, for reference)

```html
  <link rel="manifest" href="site.webmanifest">
  <link rel="apple-touch-icon" href="images/manifest/apple-touch-icon.png" sizes="180x180">
```
