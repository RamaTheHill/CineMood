# Challenger Report 2 — Carousel Timer & Visibility Verification

## Challenge Summary

**Overall risk assessment**: LOW

All verification tests pass successfully. The carousel timer logic is correctly implemented, operating at the correct 8-second interval, cleanly pausing/resuming on visibility changes and screen switches, and avoiding duplicate intervals. The smooth zoom and fade transition (Ken Burns effect) operates without freezes or jumps due to the temporary inline styling followed by reflow triggering and immediate style cleanup.

---

## Stress Test Results

The browser test suite `test_carousel.html` mocks the global timer methods (`setInterval`, `clearInterval`) and document visibility getters to track precisely what intervals are created, active, or cleared, and to verify DOM updates. The verification was conducted against the implementation in `cinemood/app.js` and `cinemood/style.css`:

- **Initial State Verification** → Carousel starts with exactly 1 active interval on load with a delay of 8000ms → **PASS**
- **Transition to Quiz Screen** → Clicking `#btn-start` hides the Hero screen and immediately clears/pauses the interval → **PASS**
- **Screen Switching Stress Test** → Simulating 5 rapid cycles of Home ➔ Quiz ➔ Home transitions and verifying that exactly 1 interval is active when on Home, and 0 when on Quiz (no duplicate/leaked intervals) → **PASS**
- **Visibilitychange Pause Logic** → Mocking `document.hidden = true` and dispatching `visibilitychange` immediately clears the interval; restoring `document.hidden = false` resumes the interval → **PASS**
- **Active Slide Transition** → Manually ticking the interval callback updates the DOM slide element, correctly transferring the `.active` class to the next sibling in sequence → **PASS**

---

## Challenges

### [Low] Challenge 1: Hard-Coded DOM Dependency on Page Load

- **Assumption challenged**: The list of slide elements (`.bg-slide`) is static and queried only once during script initial load.
- **Attack scenario**: If slides are added or removed dynamically (e.g. dynamically rendered via API or user preference in the future), the carousel controller will continue using the stale `slides` NodeList cached at load time.
- **Blast radius**: The Ken Burns effect or slide switching could target non-existent DOM nodes or skip new slides entirely, possibly leading to runtime exceptions.
- **Mitigation**: Query `.bg-slide` elements dynamically inside `startCarousel()` or update the cached list when the DOM changes.

### [Low] Challenge 2: Timing Coincidence with CSS Transitions

- **Assumption challenged**: The carousel JS interval of 8.0s is in lockstep with the CSS transitions (opacity 2.0s, transform 8.5s).
- **Attack scenario**: If a developer alters the transition duration in CSS (e.g., changing the transform duration to >8.5s or reducing the interval to <8.0s) without updating the JS configuration, the transitions will overlap, causing slides to transition before the previous scale animation completes.
- **Blast radius**: Visual jitter, jumps, or animations completing mid-fade, breaking the premium user experience.
- **Mitigation**: Define the transition timings in a shared config or use JS `transitionend` events to drive the slide cycle rather than a hardcoded `setInterval`.

### [Low] Challenge 3: Lack of Defensive Sentry for Missing Elements

- **Assumption challenged**: The DOM structure always contains the `.bg-slide` nodes and `#screen-hero` container.
- **Attack scenario**: If the markup is altered during theme updates or layout restructuring, or if one of the slides is removed, the carousel indexer could point to an undefined slide during transition.
- **Blast radius**: JavaScript runtime crash (`TypeError: Cannot read properties of undefined (reading 'style')`), preventing the rest of the application script from executing.
- **Mitigation**: Add defensive null-checks in `startCarousel()`:
  ```javascript
  if (!currentSlide || !nextSlide) return;
  ```

---

## Unchallenged Areas

- **GPU Performance Throttling** — While the transition logic is correct, the actual rendering performance of the 8.5s ease-out transform was not profile-tested under CPU/GPU throttling on lower-end mobile devices.
