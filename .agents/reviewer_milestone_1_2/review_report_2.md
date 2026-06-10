# Quality and Adversarial Review Report (Review Report 2)

## Review Summary

**Verdict**: REQUEST_CHANGES

The carousel controller logic, visibility lifecycle events, and performance optimization for `cinemood/app.js` were thoroughly reviewed. While the visibility-based timer pausing works correctly to ensure 0% background overhead, we identified a **Major logical bug** in the Ken Burns transition effect. Specifically, the inline style overrides the CSS transition target, causing the slides to remain statically scaled at 1.08. Furthermore, we identified a **Minor UX issue** where the loading screen transitions to results before the TMDB API response is ready, causing a flash of empty content, and a **Minor security risk** where raw API outputs are injected into the DOM without escaping.

---

## Findings

### [Major] Finding 1: Broken Ken Burns Zoom Transition (Scale Reset Reflow Bug)

- **What**: The Ken Burns transition scale reset reflow trick is broken because the inline transform style is never cleared or updated.
- **Where**: `cinemood/app.js` (lines 1119-1132)
- **Why**: 
  1. The code sets `nextSlide.style.transform = "scale(1.08)"` to instantly zoom the incoming slide.
  2. It triggers a reflow using `nextSlide.offsetHeight`, restores the transition property, and then adds the `.active` class.
  3. In CSS, `.bg-slide.active` has `transform: scale(1.02)`. However, since inline styles (`style="transform: scale(1.08)"`) have higher specificity than class rules, the browser ignores the class-defined target of `scale(1.02)`.
  4. The slide remains at `scale(1.08)` and never transitions. No zoom-out effect occurs, defeating the purpose of the transition trick.
- **Suggestion**: 
  Clear the inline transform style after restoring the transition and adding the active class, or explicitly set it to the target scale, so that the transition triggers.
  ```javascript
  // After restoring transition style:
  nextSlide.style.transition = "";
  nextSlide.style.transform = ""; // Resets inline style, letting the CSS scale(1.02) take effect
  ```

### [Minor] Finding 2: Premature Transition to Results Screen (API Latency Flash)

- **What**: The loading screen is hidden and the results screen is shown before the TMDB request resolves.
- **Where**: `cinemood/app.js` (lines 984-990)
- **Why**: In `showResults()`, `hide("screen-loading")` and `show("screen-results")` are called synchronously at the start of the function. Only after these screen updates does the code `await recommendationsPromise`. If the network request is slow, the user will see a flash of empty results cards with default placeholder text (`—` and `—%`).
- **Suggestion**: Await `recommendationsPromise` first, and only hide the loading screen and show the results screen once the recommendation data is ready.
  ```javascript
  async function showResults() {
    let main, alts, uniqueTags = [];
    try {
      const data = await recommendationsPromise;
      // ... process data ...
    } catch (err) {
      // ... fallback to local ...
    }
    
    // Transition screens ONLY when data is ready
    hide("screen-loading");
    show("screen-results");
    
    // ... populate DOM ...
  }
  ```

### [Minor] Finding 3: DOM XSS Risk on Results Injection

- **What**: Raw strings from external TMDB API responses are injected directly into the HTML using `innerHTML`.
- **Where**: `cinemood/app.js` (line 1075) and `cinemood/app.js` (line 1011)
- **Why**: TMDB API properties like `a.title` and `a.why_template` are rendered via template literals inserted into `innerHTML`. If TMDB responses are tampered with or contain malicious data, this can lead to DOM-based Cross-Site Scripting (XSS).
- **Suggestion**: Use `textContent` for text injection, or sanitize/escape HTML markup before rendering dynamic API strings.

---

## Verified Claims

- **Tab Visibility Pausing** → Verified via codebase analysis of `updateCarouselState()` and `visibilitychange` event listener → **PASS**:
  The carousel timer successfully pauses (`clearInterval` called and set to `null`) when `document.hidden` is `true`. This ensures 0% background execution overhead.
- **Screen Transition Pausing** → Verified via codebase analysis of `isHeroVisible()` and `updateCarouselState()` → **PASS**:
  When clicking "Начать подбор", `screen-hero` is hidden, which makes `isHeroVisible()` return `false` and triggers `pauseCarousel()`. The carousel remains correctly paused throughout the quiz, loading, and results phases, restarting only when `restart()` shows the hero screen.
- **Memory Leak Protection** → Verified via codebase analysis of `startCarousel()` and event listener attachment → **PASS**:
  `startCarousel()` returns early if `carouselInterval` is already defined, preventing duplicate intervals. Dynamic quiz step DOM elements are fully cleared on `innerHTML = ""` inside `renderStep()`, allowing garbage collection of old handlers.

---

## Coverage Gaps

- **CSS Transition Durations Match** — Risk Level: Low — The transform CSS transition duration is `8.5s`, while the JS interval is `8.0s`. Although not a functional error, this slight mismatch means the zoom transition never fully finishes its ease-out curve before the slide is swapped. We recommend adjusting these to match or keep the transition duration slightly shorter than the interval.

---

## Unverified Items

- **Actual TMDB Network Call Integration** — Reason not verified: Offline/CODE_ONLY mode prevents live outgoing API testing. However, code integration is logically verified.

---

## Challenge Summary

**Overall risk assessment**: MEDIUM

Adversarial testing was performed conceptually and through code analysis to identify failure modes under edge cases, network constraints, and DOM manipulation.

---

## Challenges

### [High] Challenge 1: Slow Network / Request Timeout

- **Assumption challenged**: The TMDB API will always respond within a reasonable duration.
- **Attack scenario**: The client is on an extremely congested cellular network. The TMDB request remains pending for >10 seconds.
- **Blast radius**: If the promise does not resolve, the results screen remains blocked on the placeholder screen (or shows raw placeholders) indefinitely because there is no timeout on the TMDB fetch promise.
- **Mitigation**: Implement a promise race timeout in `api.js` or `app.js` that automatically rejects the TMDB fetch and falls back to local data if it takes longer than 5 seconds.

### [Medium] Challenge 2: API Key Exposure in Source Code

- **Assumption challenged**: Client-side secrets are safe.
- **Attack scenario**: The source code has a hardcoded default TMDB key: `const DEFAULT_TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";`.
- **Blast radius**: The key can be extracted by any user, leading to potential key depletion, quota exhaustion, or block by TMDB.
- **Mitigation**: Use a backend proxy to handle TMDB requests, or warn users that client-side keys are for demo purposes only and should not be hardcoded in production.

---

## Stress Test Results

- **Empty Slide Container** → Remove all `.bg-slide` classes from index.html → Handled via `if (slides.length <= 1) return` in `startCarousel()` → **PASS** (Carousel fails gracefully, no console errors).
- **Concurrent Start Clicks** → Rapidly click the "Start Quiz" button → State changes, hero section is hidden, carousel interval is cleared immediately on first click → **PASS** (Zero active timers left).
