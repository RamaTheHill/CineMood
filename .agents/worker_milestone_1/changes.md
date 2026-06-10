# Detailed Changes - Milestone 1: Hero Carousel & Premium Minimalist UI

## 1. index.html
- Preloaded all background images in the `<head>` to avoid flickering or slow loads:
  ```html
  <link rel="preload" as="image" href="https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg" />
  <link rel="preload" as="image" href="https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" />
  <link rel="preload" as="image" href="https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg" />
  ```
- Added the `active` class to the first `.bg-slide` in `.hero-bg`.
- Modified `.film-strip` section: wrapped film name spans in a nested `.film-strip-track` and duplicated the list of spans to double the text content for seamless marquee rendering.

## 2. style.css
- Updated `.hero` to use dynamic viewport height for mobile compatibility:
  ```css
  min-height: 100vh;
  min-height: 100dvh;
  ```
- Set up class-based transitions on `.bg-slide` and `.bg-slide.active` to replace keyframe animations:
  - `.bg-slide`: `opacity: 0; transition: opacity 2.0s ease-in-out, transform 8.5s ease-out; will-change: opacity, transform;`
  - `.bg-slide.active`: `opacity: 0.45; transform: scale(1.02);`
- Added fallback radial gradient to `.hero-bg`.
- Updated marquee behavior to animate `.film-strip-track` using `transform: translate3d(-50%, 0, 0)` at 100% for a smooth continuous scroll.
- Increased `.main-card` media query breakpoint from `600px` to `768px`.
- Adjusted `.card-poster-wrap img` on mobile to have `border-bottom: 1px solid var(--border)` instead of `border-right`, and set portrait aspect-ratio (`2/3`).
- Added layout optimization for mobile devices under `@media(max-width: 480px)` (vertical stacking mode switch to prevent horizontal overflow, reduced paddings/margins to prevent squishing).
- Added landscape short-height media query `@media (max-height: 500px)` to hide `.film-strip` and reduce header logo/margins.

## 3. app.js
- Implemented a JS carousel controller cycling slides every 8 seconds via `setInterval`.
- Applied instant scaling reset (`scale(1.08)`) with temporary `transition: none` to the next slide before triggering a browser reflow and restoring transitions, preventing Ken Burns animation jumps.
- Handled visibility changes (`visibilitychange`) and screen transitions to automatically pause the interval when browser tab is hidden or hero screen is not visible, and resume it when tab is active and hero screen is visible.
- Added viewport reset `window.scrollTo(0, 0)` inside screen transition `show()` helper.
