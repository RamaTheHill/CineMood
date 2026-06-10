# Review & Challenge Report — Milestone 1

## Review Summary

**Verdict**: REQUEST_CHANGES

This review assesses the visual correctness, responsive layout, CSS transitions, and code completeness of CineMood's Milestone 1 implementation. While the film strip marquee and the page visibility API integrations are implemented correctly, we identified two critical/major issues: a CSS cascade ordering bug that breaks mobile responsiveness of the search mode toggle buttons below 480px, and a JavaScript inline style override that completely freezes the Ken Burns zoom transition on background slides.

---

## Findings

### [Critical] Finding 1: CSS Cascade Ordering Bug for Mobile Mode Toggle

- **What**: The styles for mobile screens (under 480px) defined for `.mode-toggle-wrap`, `.mode-toggle`, and `.mode-btn` are overridden by the base desktop styles defined further down in the stylesheet.
- **Where**: `cinemood/style.css` (media query at lines 199–222, base classes at lines 233–274).
- **Why**: In CSS, source order determines precedence when selectors have identical specificity. Since the base styles at lines 233–274 are defined *after* the media query (which starts at line 199), the properties specified in the base class (such as `gap: 0.75rem`, `align-items: center`, `margin-bottom: 2rem`, `border-radius: 30px`, and `padding: 0.5rem 1.25rem`) override the media query's mobile-responsive scaling properties (such as `gap: 0.5rem`, `align-items: stretch`, `margin-bottom: 1.5rem`, `border-radius: 16px`, and `padding: 0.6rem 1rem`).
- **Impact**: On mobile devices down to 320px, the search mode toggle buttons do not scale down or lay out correctly. They remain at desktop dimensions, leading to a crowded layout and potential horizontal overflow on small screens, violating the mobile responsiveness requirement.
- **Suggestion**: Relocate all media queries (e.g., `@media(max-width: 480px)` and `@media(max-width: 768px)`) to the very end of `cinemood/style.css`, ensuring they correctly override the base styles.

---

### [Major] Finding 2: Frozen Ken Burns Zoom Transition in Carousel Controller

- **What**: The Ken Burns scale zoom effect on background slides is frozen/broken. The active background slide remains static at `scale(1.08)` instead of transitioning to `scale(1.02)`.
- **Where**: `cinemood/app.js` (lines 1111–1134, in `startCarousel()`).
- **Why**: In `app.js`, the code resets the next slide's scale to `1.08` by setting the inline style `nextSlide.style.transform = "scale(1.08)"` with transition disabled. It then restores the transition style but does NOT clear or update `nextSlide.style.transform`. Because inline style rules have higher specificity than stylesheet classes, the inline `transform: scale(1.08)` overrides the stylesheet rule `.bg-slide.active { transform: scale(1.02); }`. Since the computed transform stays at `scale(1.08)` before and after adding the `active` class, no transform transition ever runs.
- **Impact**: The premium aesthetic is compromised. The background slides only fade in and out but remain static without any smooth zoom animation.
- **Suggestion**: In `startCarousel()`, when restoring the transition, clear the inline transform style by setting `nextSlide.style.transform = "";` (which allows the stylesheet's `transform: scale(1.02)` to take effect and animate smoothly).

---

### [Minor] Finding 3: Missing Gradient Definition in Initial HTML

- **What**: The SVG element inside `.mood-ring` in `index.html` uses a gradient `url(#ringGrad)` that is not defined in the static HTML file.
- **Where**: `cinemood/index.html` (lines 117–124) and `cinemood/style.css` (line 162).
- **Why**: In `index.html`, the SVG is declared without `<defs>`. In `style.css`, `.ring-fill` uses `stroke: url(#ringGrad);`. In `app.js`, when results are shown, the SVG's inner HTML is overwritten to inject the gradient definition.
- **Impact**: While the results screen is initially hidden, referring to a non-existent gradient in CSS is a bad practice. If the elements were ever rendered before `app.js` executed `showResults()`, the stroke would be invisible.
- **Suggestion**: Declare the `<defs><linearGradient id="ringGrad" ...>` inside the static SVG in `index.html`. In `app.js`, just update the `stroke-dashoffset` instead of overwriting the entire SVG inner HTML.

---

## Verified Claims

- **Continuous Looping Marquee** → verified via source code analysis of `index.html` (lines 42–51) and `style.css` (lines 41–44). The spans are duplicated exactly, and the animation translates the track from `0` to `-50%`, ensuring a seamless loop. → **PASS**
- **0% Idle CPU/GPU Carousel Overhead** → verified via review of `app.js` (lines 1143–1156). When the page visibility changes or the hero section is hidden, `pauseCarousel()` is correctly triggered, clearing the interval and preventing active animations. → **PASS**
- **Mobile Aspect Ratios & Borders** → verified via analysis of `style.css` (lines 189–197). At `768px`, the card transitions to column layout, the border-right is correctly removed and replaced with a border-bottom, and aspect-ratio is locked to `2/3`. → **PASS**

---

## Coverage Gaps

- **Real-device rendering** — risk level: low — recommendation: run visual tests using browser tools to verify that the fix for CSS ordering resolves all horizontal scrolling at 320px.

---

## Unverified Items

- **Actual TMDB Image preloads** — reason not verified: require live network to confirm preloading behaviour.

---

# Adversarial Review (Critic)

## Challenge Summary

**Overall risk assessment**: MEDIUM

The primary risks stem from CSS cascade precedence rules and inline JS overrides that block intended animations. However, the system lifecycle management (Page Visibility API) is highly robust and avoids typical OOM or CPU run-away bugs.

---

## Challenges

### [High] Challenge 1: Inline Style Specificity Blocks CSS Transitions

- **Assumption challenged**: Setting a scale transform inline with transitions disabled and then restoring transitions will naturally animate the slide to its class-defined scale.
- **Attack scenario**: Inline `transform: scale(1.08)` persists. Class `.active` defines `transform: scale(1.02)`.
- **Blast radius**: The Ken Burns transition is completely disabled. The background images fade in and out but do not zoom.
- **Mitigation**: Clear the inline transform style (`nextSlide.style.transform = ""`) when enabling transitions.

### [Medium] Challenge 2: Media Query Precedence Bypass

- **Assumption challenged**: Defining media queries in the middle of a file will override base styles for screen widths under 480px.
- **Attack scenario**: Base styles defined at the end of the file override identical specificity declarations inside the media query.
- **Blast radius**: The search mode toggle buttons do not wrap/scale on mobile devices, leading to layout shifts and horizontal scrollbars.
- **Mitigation**: Move all media queries to the end of the CSS file.

---

## Stress Test Results

- **Quiz Screen Hidden + Page Hidden** → expected: carousel paused → actual: carousel paused → **PASS**
- **Quiz Screen Visible + Page Visible** → expected: carousel paused → actual: carousel paused → **PASS**
- **Hero Screen Visible + Page Visible** → expected: carousel running → actual: carousel running → **PASS**
- **Viewport width at 320px** → expected: mode toggle button column stack → actual: mode toggle button horizontal inline (cascade bug) → **FAIL**
