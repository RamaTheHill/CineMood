# Handoff Report — explorer_ui_carousel_1

This handoff report summarizes the investigation and proposed design and implementation strategy for **Milestone 1: Hero Carousel & Premium Minimalist UI**.

---

## 1. Observation

### File & Code Discoveries:
*   **Hero Background Layout (`index.html` lines 17–20)**:
    ```html
    <div class="hero-bg">
      <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg')"></div>
      <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg')"></div>
      <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg')"></div>
    ```
*   **CSS Animations & Slides Styling (`style.css` lines 26–39)**:
    ```css
    .hero-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
    .bg-slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; animation: fadeSlide 24s infinite; }
    .bg-slide:nth-child(1) { animation-delay: 0s; }
    .bg-slide:nth-child(2) { animation-delay: 8s; }
    .bg-slide:nth-child(3) { animation-delay: 16s; }

    @keyframes fadeSlide {
      0% { opacity: 0; transform: scale(1.05); }
      5% { opacity: 0.5; }
      33% { opacity: 0.5; }
      38% { opacity: 0; transform: scale(1); }
      100% { opacity: 0; }
    }
    ```
*   **Marquee Span Animation (`style.css` line 52)**:
    ```css
    .film-strip span { display: inline-block; margin: 0 2rem; font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; animation: marquee 30s linear infinite; }
    ```
*   **Screen Transition Logic (`app.js` lines 1083–1084)**:
    ```javascript
    function show(id) { document.getElementById(id).classList.remove("hidden"); }
    function hide(id) { document.getElementById(id).classList.add("hidden"); }
    ```

---

## 2. Logic Chain

1.  **Brittle Slide Transitions**: The current CSS animation utilizes a `24s` infinite loop divided by the number of slides (3). If a new slide is added, the keyframe percentages and delay increments must be manually recalculated and rewritten in the CSS file. Therefore, a JavaScript class-toggle approach is more flexible.
2.  **Resource Overhead**: Because `.hidden` (which uses `display: none`) hides the element from view, the timeline of the infinite CSS animation keeps ticking. Implementing a JS-controlled carousel that uses `setInterval` allows us to clear the interval during the quiz/results screen, achieving **0% background CPU/GPU usage** when the hero screen is not visible.
3.  **Horizontal Scroll Bug**: The `.mode-toggle-wrap` container is flex-aligned horizontally. Below 480px, the long labels and toggle button names exceed 320px width, causing horizontal scrollbar breaks. Stacking them vertically on mobile resolves the viewport constraint.
4.  **Marquee Visual Bug**: Because the marquee animation is applied directly to each `.film-strip span`, they slide individually relative to their own distinct character widths. This produces overlapping names and massive spacing gaps instead of a continuous, unified marquee loop. Animating a single wrapper track container (`.film-strip-track`) fixes this bug.
5.  **Broken Border Layout**: On screen widths `< 600px`, `.main-card` wraps vertically (`flex-direction: column`). The image poster `.card-poster-wrap` has `border-right` enabled but lacks a `border-bottom` separating it from `.card-body`, creating an asymmetrical design. Shifting the border to the bottom on mobile rectifies this layout discrepancy.

---

## 3. Caveats

*   **Dynamic Poster Data**: We assumed that the three background poster files loaded from TMDB's CDN will remain accessible. If they fail to load, the browser will render a dark background color.
*   **Browser Optimization**: We assumed modern browser CSS composite acceleration. Adding `will-change: opacity, transform` is highly recommended to ensure the transitions run on the GPU.

---

## 4. Conclusion

Milestone 1 can be successfully implemented with:
1.  A class-based CSS slide transition combined with a lifecycle-aware JavaScript controller in `app.js` that registers a `setInterval` when the hero section is visible, and calls `clearInterval` when navigating away.
2.  A revised responsive layout in `style.css` that targets widths under 480px and 600px to fix the mode toggle wrapper layout, adjust large margin/padding gutters, reposition poster borders, and restructure the film strip marquee.
3.  Scroll-to-top automation inside the screen-switch handler to maintain layout integrity.

Concrete code modifications and step-by-step proposals are documented in `analysis.md` in the current agent folder.

---

## 5. Verification Method

To verify the proposed implementation plan:
1.  **Start a local server** in the `cinemood/` directory:
    ```bash
    python3 -m http.server 8000
    ```
2.  **Verify UI Responsiveness**:
    *   Open Developer Tools, set the device width to `320px` (iPhone SE).
    *   Inspect `#screen-hero` and ensure there is no horizontal scrollbar. The search mode toggle should stack vertically.
    *   Ensure the marquee film strip scrolls as a single unified track without text overlapping or jumping.
3.  **Verify Performance & Overhead**:
    *   Open Console and profile performance during the quiz. Ensure the carousel timer stops completely when `#screen-hero` is hidden.
