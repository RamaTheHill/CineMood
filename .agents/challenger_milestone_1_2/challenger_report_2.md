# Challenger Report 2 — Carousel Timer & Visibility Verification

## Challenge Summary

**Overall risk assessment**: LOW

All verification tests passed successfully. The carousel timer logic is correctly implemented, operates at the correct 8-second interval, cleanly pauses/resumes on visibility changes and screen switches, and does not leak or spawn duplicate intervals during rapid transitions.

---

## Stress Test Results

We developed and executed an automated browser-based verification test suite inside a headless Google Chrome environment. The suite mocks/intercepts the global timer methods (`setInterval`, `clearInterval`) and document visibility getters to track precisely what intervals are created, active, or cleared, and to verify DOM updates.

- **Initial State Verification** → Carousel starts with exactly 1 active interval on load with a delay of 8000ms → **PASS**
- **Transition to Quiz Screen** → Clicking `#btn-start` hides the Hero screen and immediately clears/pauses the interval → **PASS**
- **Screen Switching Stress Test** → Simulating 5 rapid cycles of Home ➔ Quiz ➔ Home transitions and verifying that exactly 1 interval is active when on Home, and 0 when on Quiz (no duplicate/leaked intervals) → **PASS**
- **Visibilitychange Pause Logic** → Mocking `document.hidden = true` and dispatching `visibilitychange` immediately clears the interval; restoring `document.hidden = false` resumes the interval → **PASS**
- **Active Slide Transition** → Manually ticking the interval callback updates the DOM slide element, correctly transferring the `.active` class to the next sibling in sequence → **PASS**

---

## Challenges

### [Low] Challenge 1: Hard-Coded DOM Dependency on Page Load

- **Assumption challenged**: The list of slide elements (`.bg-slide`) is static and queried only once during script initial load.
- **Attack scenario**: If slides are added or removed dynamically (e.g., dynamically rendered via API or user preference in the future), the carousel controller will continue using the stale `slides` NodeList cached at load time.
- **Blast radius**: The Ken Burns effect or slide switching could target non-existent DOM nodes or skip new slides entirely.
- **Mitigation**: Query `.bg-slide` elements dynamically inside `startCarousel()` or update the cached list when the DOM changes.

---

## Unchallenged Areas

- **CSS Keyframe Animation Performance** — CSS Ken Burns scaling transitions were inspected visually but not profile-tested under low-memory mobile device simulation.

---

## Test Execution Logs (Captured from headless Chrome test run)

```
setInterval called: ID=1, delay=8000
Starting tests...
[PASS] Carousel should start with exactly 1 active interval initially
[PASS] Carousel transition interval should be exactly 8000ms (8 seconds)
Clicking #btn-start...
clearInterval called: ID=1
[PASS] Timer should be paused immediately after transitioning to quiz screen
Stress-testing screen switching (quiz -> home -> quiz -> home)...
Switch cycle 1: returning to home
setInterval called: ID=2, delay=8000
[PASS] Cycle 1: Should have exactly 1 active interval on home screen
Switch cycle 1: going to quiz
clearInterval called: ID=2
[PASS] Cycle 1: Should have 0 active intervals on quiz screen
Switch cycle 2: returning to home
setInterval called: ID=3, delay=8000
[PASS] Cycle 2: Should have exactly 1 active interval on home screen
Switch cycle 2: going to quiz
clearInterval called: ID=3
[PASS] Cycle 2: Should have 0 active intervals on quiz screen
Switch cycle 3: returning to home
setInterval called: ID=4, delay=8000
[PASS] Cycle 3: Should have exactly 1 active interval on home screen
Switch cycle 3: going to quiz
clearInterval called: ID=4
[PASS] Cycle 3: Should have 0 active intervals on quiz screen
Switch cycle 4: returning to home
setInterval called: ID=5, delay=8000
[PASS] Cycle 4: Should have exactly 1 active interval on home screen
Switch cycle 4: going to quiz
clearInterval called: ID=5
[PASS] Cycle 4: Should have 0 active intervals on quiz screen
Switch cycle 5: returning to home
setInterval called: ID=6, delay=8000
[PASS] Cycle 5: Should have exactly 1 active interval on home screen
Switch cycle 5: going to quiz
clearInterval called: ID=6
[PASS] Cycle 5: Should have 0 active intervals on quiz screen
setInterval called: ID=7, delay=8000
[PASS] Should have exactly 1 active interval on home screen after stress test
Testing visibilitychange pause logic...
[PASS] Should be active before hiding document
document.hidden mocked to: true
clearInterval called: ID=7
[PASS] Carousel should pause when document is hidden
document.hidden mocked to: false
setInterval called: ID=8, delay=8000
[PASS] Carousel should resume when document is shown again
Testing carousel slide advancement...
Initial active slide index: 0
Triggering carousel interval callback manually...
New active slide index: 1
[PASS] Active slide should advance by 1 after tick
All tests completed.
SUCCESS: ALL TESTS PASSED
```
