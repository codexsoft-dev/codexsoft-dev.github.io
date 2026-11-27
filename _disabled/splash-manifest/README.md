# Disabled: loading splash + web app manifest

This folder holds the loading splash (intro screen) and the web app manifest
for the CODEX · SOFT site. They are **not used**: no page links to anything in
here. Everything is kept so it can be switched back on later.

Disabled on 2026-11-27. The last commit where they were active is `9db414d`.

> GitHub Pages still serves this folder if someone knows the URL, so
> `robots.txt` asks search engines not to crawl `/_disabled/`.

## Contents

- `site.webmanifest`: web app manifest (`display: standalone`,
  `background_color #000b23`, `theme_color #0f1f37`, icons below).
- `images/manifest/icon-192.png`, `icon-512.png`: app icons, transparent background.
- `images/manifest/icon-maskable-512.png`: maskable icon on dark navy.
- `images/manifest/apple-touch-icon.png`: 180×180 iOS home-screen icon.
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

1. Move the files back:
   - `_disabled/splash-manifest/site.webmanifest` to `site.webmanifest`
     (site root)
   - `_disabled/splash-manifest/images/manifest/` to `images/manifest/`
2. In `index.html`, replace
   `<style>html{background-color:#0f1f37}</style>` in `<head>` (just before
   the Google Fonts `preconnect` link) with snippet **A**.
3. In `index.html`, paste snippet **B** right after `<body>`.
4. In `privacy.html` and `terms.html`, paste snippet **C** just before
   `<style>html{background-color:#0f1f37}</style>` in `<head>`.
5. Remove the `/_disabled/` line from `robots.txt` if nothing else is left
   in this folder.
6. On a phone, remove the old home-screen shortcut, clear the site data and
   add it again, because the manifest is cached.

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

### C: `privacy.html` / `terms.html` `<head>`

```html
  <link rel="manifest" href="site.webmanifest">
  <link rel="apple-touch-icon" href="images/manifest/apple-touch-icon.png" sizes="180x180">
```
