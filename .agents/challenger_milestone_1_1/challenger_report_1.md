# Adversarial Review Challenge Report — CineMood UI & Animations

## Challenge Summary
**Overall risk assessment**: HIGH

Visual and interactive quality audits on CineMood's Milestone 1 release (Hero carousel, marquee, and mobile responsive layout) revealed critical flaws in CSS/JS specificity, animation continuity on high-resolution displays, and mobile layout clipping.

---

## Challenges

### [Critical] Challenge 1: Ken Burns Carousel Specificity Override
- **Assumption challenged**: The JS carousel manager correctly resets and triggers Ken Burns scale transitions on all slides.
- **Attack scenario**: Inline style overrides block CSS transitions. In `app.js` (lines 1119-1120), the script sets `nextSlide.style.transform = "scale(1.08)"` to prepare the zoom-out start. However, this inline style is never cleared. Under standard CSS specificity, the inline `scale(1.08)` style has absolute precedence over `.bg-slide.active { transform: scale(1.02); }`. 
- **Blast radius**: The Ken Burns transition from `1.08` to `1.02` is completely disabled for all slides after the first one. Subsequent slides fade in/out while remaining statically scaled at `1.08`.
- **Mitigation**: Clear the inline transform style or set it inline to the target scale during active transition:
  ```javascript
  // In app.js, clear the inline transform once active class is applied so CSS can take over
  nextSlide.classList.add("active");
  setTimeout(() => { nextSlide.style.transform = ""; }, 50); // or handle inline
  ```

### [High] Challenge 2: Film Strip Marquee Snapping on Wide Screens (>1440px)
- **Assumption challenged**: Wrapping movie names in a track and translating it by `-50%` creates a seamless looping marquee on all screen widths.
- **Attack scenario**: One cycle of the movie spans has an estimated width of `1440px` (text length + `2rem` margins). On displays wider than `1440px` (e.g., `1600px`, `1920px`), translating the track by `-50%` (which is `-1440px`) shifts the track's right end to `1440px` relative to the left viewport edge. This leaves a blank gap of `480px` on a `1920px` screen. When the animation resets to `0%`, it snaps back instantly, causing a jarring visual jump.
- **Blast radius**: Jarring visual jump/snap at the end of every 30-second marquee cycle on common desktop resolutions.
- **Mitigation**: Add more span titles to the track (at least 20 unique titles instead of 12) so that a single cycle length exceeds `1920px`, or dynamically compute and adjust the duplicate track width based on viewport size.

### [Medium] Challenge 3: Card Where-Row Flex Overflow on Mobile Screens (320px-375px)
- **Assumption challenged**: The main results card displays correctly and does not overflow on mobile screens down to 320px.
- **Attack scenario**: `.card-where-row` (lines 277-283 of `style.css`) contains the watch providers and details button. It is styled with `display: flex; justify-content: space-between; gap: 1rem;` but has no wrap behavior. On a `320px` screen, the available inner card body width is only `248px`. When live TMDB recommendation is returned, the provider text (e.g. "Кинопоиск, Apple TV+") and details button ("Подробнее →") request a minimum width of `298px` even after shrinking. 
- **Blast radius**: Elements overflow the card container, clipping borders and overlapping text, breaking mobile responsiveness.
- **Mitigation**: Add a media query to stack `.card-where-row` vertically on mobile screen sizes:
  ```css
  @media(max-width: 480px) {
    .card-where-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    .btn-tmdb {
      justify-content: center;
      width: 100%;
    }
  }
  ```

### [Medium] Challenge 4: Vertical Centering Layout Clipping on Short Viewports
- **Assumption challenged**: Centering the quiz screen via flexbox is robust.
- **Attack scenario**: `.quiz-wrap` uses `display: flex; align-items: center; justify-content: center; min-height: 100vh;`. For long steps (e.g. `exclude_genres` which has 7 stacked options, height ~600px) when viewed on short viewports (height <= 500px, such as landscape mobile screens or when keyboard is active), the quiz container overflows the viewport boundaries at both the top and bottom.
- **Blast radius**: The top portion (header navigation and progress indicator) is pushed above the screen bounds and becomes completely unreachable and unscrollable.
- **Mitigation**: Allow the content to align to `flex-start` when screen height is too small, or use margin-based auto centering.

### [Low] Challenge 5: Mood Ring Text Overlap on Mobile
- **Assumption challenged**: The match percentage ring fits on all mobile widths.
- **Attack scenario**: On screens <= 768px, `.mood-ring` width/height is reduced to `60px`. The inner circle diameter becomes `51px`. The label span `совпадение` (10 letters, 9.6px font size) takes approx `55px` of horizontal space.
- **Blast radius**: Text extends outside the circle borders, causing visual clutter.
- **Mitigation**: Adjust `.ring-label` text layout or reduce font size on smaller widths.

---

## Stress Test Results

- **Viewport width 1920px** → Hero background slide changes every 8s → **FAIL**: Ken Burns zoom fails after slide 1 (static at 1.08).
- **Viewport width 1920px** → Film strip marquee runs → **FAIL**: Jarring visual loop reset jump (gap size ~480px).
- **Viewport width 1200px** → Film strip marquee runs → **PASS**: Seamless loop reset (width exceeds viewport).
- **Viewport width 320px** → Main results card renders with TMDB details button and long providers → **FAIL**: Content overflows the card body boundary.
- **Viewport height 450px** → Quiz screen loaded with multiple options → **FAIL**: Quiz header and progress bar are pushed above scroll boundary and clipped.

---

## Unchallenged Areas
- **TMDB API Connection**: Live TMDB connections were verified via code structure only due to network container isolation.
