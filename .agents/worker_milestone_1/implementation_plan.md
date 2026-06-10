# Implementation Plan - Milestone 1: Hero Carousel & Premium Minimalist UI

## 1. Hero Background Carousel (Dynamic JS & CSS Transition)
### HTML (`index.html`)
- Preload the background images in the `<head>` using `<link rel="preload" as="image" href="...">`.
- Add the `active` class to the first `.bg-slide` element inside `.hero-bg`.

### CSS (`style.css`)
- Remove rigid keyframe-based `@keyframes fadeSlide` and `.bg-slide:nth-child` delay rules.
- Set `.bg-slide` styles to:
  - `opacity: 0;`
  - `transition: opacity 2.0s ease-in-out, transform 8.5s ease-out;`
  - `will-change: opacity, transform;`
- Set `.bg-slide.active` styles to:
  - `opacity: 0.45;`
  - `transform: scale(1.02);`
- Add a fallback gradient to `.hero-bg`:
  - `radial-gradient(circle at center, #1b1338 0%, var(--bg) 100%)`

### JavaScript (`app.js`)
- Implement a carousel controller using `setInterval` to cycle the `active` class among `.bg-slide` elements every 8 seconds.
- Instantly scale the next slide to `1.08` with `transition: none`, trigger a reflow via `offsetHeight`, restore default transition, and add the `active` class to animate to `scale(1.02)`.
- Use Page Visibility API (`visibilitychange` event listener) and helper functions to pause the interval when browser tab is hidden or hero screen is not active/visible, and resume when the tab is active and hero screen is visible.
- Hook into state/screen transitions (`#btn-start` and `restart()`) to trigger pause/resume.

## 2. Film Strip Marquee (Seamless Continuous Loop)
### HTML (`index.html`)
- Wrap the film name span elements inside a new container with class `.film-strip-track`.
- Duplicate the film spans inside `.film-strip-track` to double the content.

### CSS (`style.css`)
- Set `.film-strip-track` to `display: inline-block; white-space: nowrap; animation: marquee 30s linear infinite;`.
- Remove animation from individual `span` elements.
- Apply `transform: translate3d(-50%, 0, 0)` at `100%` in `@keyframes marquee`.

## 3. Mobile Responsiveness & Layout Improvements
### CSS (`style.css`)
- Set `.hero` min-height using dynamic viewport height: `min-height: 100vh; min-height: 100dvh;`.
- Stack the search mode toggle `.mode-toggle-wrap` vertically under `@media (max-width: 480px)`.
- Change `.main-card`'s media query breakpoint from `600px` to `768px`.
- On mobile (under `768px`), change `.card-poster-wrap img`'s border to `border-bottom: 1px solid var(--border)` and remove `border-right`. Set `.card-poster-wrap` to `width: 100%; height: auto; aspect-ratio: 2 / 3;`.
- Optimize container paddings and margins on mobile devices to prevent layout squishing (decrease from `2rem` to `1.25rem`/`1rem` on narrow screens).
- Add a short height landscape media query `@media (max-height: 500px)` to hide `.film-strip` and reduce logo/margins to fit content without clipping.

### JavaScript (`app.js`)
- Add `window.scrollTo(0, 0)` to the `show()` screen transition helper.

## 4. Verification Plan
- Run a local server: `python3 -m http.server` and verify in the browser.
- Perform responsive checks (320px up to 1920px).
- Verify zero CPU overhead when hidden or minimized.
