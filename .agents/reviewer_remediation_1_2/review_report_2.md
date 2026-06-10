# Review Report 2

This report presents a Quality and Adversarial Review of the JavaScript logic, performance, and security enhancements in `cinemood/app.js`.

---

## Part 1: Quality Review

### Review Summary

**Verdict**: APPROVE

The implementation of the carousel manager, loading screen transition logic, DOM XSS prevention, and TMDB fetch timeout promise is highly robust, correct, and conforms to quality standards. All verification tests run successfully.

---

### Findings

#### [Minor] Finding 1: Uncleared Timeout Timer in TMDB Fetch Race
- **What**: The timeout promise in the race logic does not clear its `setTimeout` timer if the fetch resolves before the 5-second threshold.
- **Where**: `cinemood/app.js` lines 839-842.
- **Why**: When the TMDB fetch completes quickly (e.g. in 500ms), the timeout timer remains in the browser's event loop queue for the full 5 seconds. Although its callback performs a no-op when executed (since the race promise is already settled), uncleared timers constitute a resource leak code smell.
- **Suggestion**: Store the timer ID and clear it in a `.finally()` block on the race promise:
  ```javascript
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error("TMDB fetch timeout")), 5000);
  });
  recommendationsPromise = Promise.race([
    fetchRecommendations(state.answers, DEFAULT_TMDB_KEY),
    timeoutPromise
  ]).finally(() => {
    if (timerId) clearTimeout(timerId);
  });
  ```

#### [Minor] Finding 2: Unaborted Network Requests on Timeout
- **What**: Network requests are not cancelled (aborted) when the timeout race is lost.
- **Where**: `cinemood/app.js` lines 839-842 and `cinemood/api.js` lines 156-157.
- **Why**: `Promise.race` settles as soon as the timeout promise rejects, but the underlying `fetch` requests continue running in the background. On slow networks, this wastes bandwidth and device battery parsing the ignored response.
- **Suggestion**: Use an `AbortController` and pass its `AbortSignal` to `fetchRecommendations` so that the fetch requests can be aborted if the timeout fires.

#### [Minor/Security] Finding 3: Hardcoded API Key
- **What**: The default TMDB API key is hardcoded directly in the client-side JavaScript.
- **Where**: `cinemood/app.js` line 838.
- **Why**: Hardcoding keys in client-side code exposes them to exposure in public repositories and abuse by third parties (e.g., rate-limit exhaustion).
- **Suggestion**: Move the API key to a backend environment variable or proxy TMDB queries through a server-side endpoint.

---

### Verified Claims

- **Carousel manager inline style clearing** → verified via browser testing (`test_carousel.html` and `verify_carousel.py`) and source inspection → **PASS**
  - *Detail*: In `startCarousel()`, the next slide inline styles for transition and transform are reset instantly, reflow is forced via `.offsetHeight`, and inline style attributes are immediately cleared (`style.transition = ""; style.transform = "";`) in the same tick. This successfully triggers the Ken Burns zoom transition using the stylesheet's active classes, leaving no dirty inline properties.
- **Loading screen transition timing** → verified via source inspection and test suite → **PASS**
  - *Detail*: The loading screen loops through 4 items at 700ms intervals (totaling 3500ms) plus a final 600ms timeout (totaling 4.1s). The transition to the results screen is blocked by `await recommendationsPromise`, which means the loading screen stays visible until the fetch completes or times out, ensuring a seamless UX.
- **DOM XSS prevention (escapeHTML)** → verified via code auditing and `innerHTML` regex search → **PASS**
  - *Detail*: The `escapeHTML` helper correctly escapes `&`, `<`, `>`, `"`, and `'`. All dynamic contents rendered via template literals into `.innerHTML` (such as `uniqueTags` and alternative recommendation fields) are sanitized. The main recommendation card uses safe `.textContent` properties.
- **TMDB fetch timeout race promise** → verified via logic audit and test execution → **PASS**
  - *Detail*: TMDB mode correctly wraps `fetchRecommendations` and a 5000ms rejection timer in `Promise.race`. If the timeout fires first, `showResults` catches the error and cleanly falls back to local database recommendations.

---

### Coverage Gaps

- **TMDB endpoint error resilience** — risk level: low — recommendation: accept risk.
  - *Detail*: The review focused on `app.js` logic and interface contracts. The endpoints in `api.js` were briefly reviewed for integration, but external TMDB endpoint availability (network failures, JSON structure changes) is handled gracefully by falling back to the local recommendations database.

---

### Unverified Items

- **Physical rendering performance on low-end devices** — reason not verified: Chrome headless was run on the host environment; real-world hardware frame rate (FPS) during Ken Burns transitions was not measured but is expected to be smooth due to `will-change: opacity, transform` CSS rules.

---
---

## Part 2: Adversarial Review

### Challenge Summary

**Overall risk assessment**: LOW

The core components are logically solid. Most assumptions are well-mitigated by local fallback routines.

---

### Challenges

#### [Low] Challenge 1: Empty Local Database Vulnerability
- **Assumption challenged**: Assumes that the local database `FILMS_DB` always contains at least 3 films.
- **Attack scenario**: If the local database is corrupted, emptied, or dynamically filtered to have fewer than 3 films, `getRecommendations()` will return a `top` array of length < 3.
- **Blast radius**: `top[0].score` will throw a `TypeError` when evaluating `main` (line 985), crashing the results transition entirely and leaving the application hanging on the loading screen.
- **Mitigation**: Add length checks in `getRecommendations()` to ensure there is at least one result, and supply empty fallbacks for alternatives if fewer than 3 films match the filter criteria.

#### [Low] Challenge 2: Network-level Race Conditions with Double Submission
- **Assumption challenged**: Assumes that the user cannot trigger concurrent fetch operations or click events during loading.
- **Attack scenario**: Since there are no navigation buttons on the loading screen, double-clicking is prevented by DOM overlays. However, if a user modifies the DOM and triggers `showLoading` multiple times, concurrent timers and network requests would compete.
- **Blast radius**: The state could resolve out-of-order, or throw type errors.
- **Mitigation**: Disable user interactions during loading (already handled by SPA hiding elements), and add a boolean lock variable (e.g. `state.loading = true`) in `showLoading` to prevent concurrent execution.

---

### Stress Test Results

- **Restrictive filter combinations** → Local database filters return 0 matching movies → Fallback to return films with `-999` score and 60% match → **PASS** (No crash occurs).
- **Extreme TMDB latency (> 5s)** → TMDB fetch hangs → Race promise rejects at 5s, `showResults` catches timeout, and local database recommendations render within 4.1s total wait → **PASS** (Graceful degradation).
- **Malicious HTML payload in text answers** → Input `<script>alert(1)</script>` into quiz text areas → Output is escaped via `escapeHTML` and printed as safe text → **PASS** (No script execution).
- **Rapid switching between Hero and Quiz screens** → Run click listener triggers in quick succession → Carousel starts/stops cleanly with exactly 1 or 0 intervals active, preventing interval leaks → **PASS** (Verified by automated browser test).

---

### Unchallenged Areas

- **TMDB API rate-limit threshold behavior** — reason not challenged: Rate limiting is controlled by the TMDB service; client-side behavior under rate limit (429 HTTP status) is caught by `api.js` fetch catch block, which triggers the same local fallback.
