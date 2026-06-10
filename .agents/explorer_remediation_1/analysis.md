# Milestone 1 Remediation Analysis

This report synthesizes the forensic audit failures, reviewer findings, and challenger findings for Milestone 1 of CineMood, presenting a comprehensive remediation plan.

---

## 1. Summary of Issues & Root Causes

### 1.1 Carousel Zoom Freeze (`app.js`)
* **Root Cause**: The carousel's Ken Burns transition manager sets an inline style `nextSlide.style.transform = "scale(1.08)"` to instantly prep the incoming slide zoom-out start. However, this inline style is never cleared. Because inline styles have higher specificity/precedence than stylesheet classes, the stylesheet's `.bg-slide.active { transform: scale(1.02); }` is overridden. The computed transform stays statically at `scale(1.08)` for all active slides, freezing the Ken Burns zoom transition.
* **Impact**: Visual degradation; slides fade in and out but do not animate/zoom.

### 1.2 Mobile Layout Cascade Override (`style.css`)
* **Root Cause**: The responsive media queries (e.g., `@media(max-width: 480px)`) are placed in the middle of the CSS file (lines 189–231). The base styles for `.mode-toggle-wrap`, `.mode-toggle`, and `.mode-btn` are defined *after* the media queries (lines 233–274). In CSS, source order determines precedence when selectors have identical specificity. The base styles therefore override the media query responsive properties (e.g. resetting `flex-direction: column` and dimensions).
* **Impact**: Broken mobile responsive layout down to 320px; search mode toggle buttons do not stack or scale.

### 1.3 Premature Screen Transition to Results (`app.js`)
* **Root Cause**: Hiding the loader (`hide("screen-loading")`) and showing the results screen (`show("screen-results")`) occur synchronously at the start of `showResults()` before the TMDB API request resolves.
* **Impact**: A temporary "flash" of empty results containing placeholders (`—` and `—%`) while the TMDB promise is pending on slower networks.

### 1.4 Raw API Response Injection XSS Risk (`app.js`)
* **Root Cause**: Strings from external TMDB API responses (`a.title`, `a.genre`, `a.why_template`, etc.) are directly interpolated into template literals and injected into the DOM using `innerHTML` (e.g., in alternative cards list).
* **Impact**: High security risk of DOM-based Cross-Site Scripting (XSS) if TMDB returns malicious data or is compromised.

### 1.5 Film Strip Marquee Snapping on Wide Screens (`index.html`)
* **Root Cause**: The track contains only 12 unique titles (repeated once for a total of 24 spans). One cycle width is ~1440px. On displays wider than 1440px, a translate of `-50%` exposes a blank gap at the right edge, causing a jarring visual snap when the keyframe animation resets.
* **Impact**: Broken animation continuity on high-resolution displays (>1440px).

### 1.6 Card Watch Provider Row Flex Overflow (`style.css`)
* **Root Cause**: `.card-where-row` (which contains watch providers and the details button) is set to `display: flex` but lacks `flex-wrap: wrap`. On small screens (320px–375px), long provider text and the details button exceed the container width.
* **Impact**: Horizontal overflow and clipping of the results card.

### 1.7 Vertical Centering Quiz Clipping on Short Viewports (`style.css`)
* **Root Cause**: `.quiz-wrap` centers content vertically using `display: flex; align-items: center;`. On screens with height <= 600px, long steps (such as `exclude_genres` which has 7 options) exceed the viewport, pushing the header progress/nav items off-screen.
* **Impact**: Unreachable navigation controls on short height screens.

### 1.8 SVG Gradient Missing Definition & Dynamic Redundancy (`index.html` & `app.js`)
* **Root Cause**: The SVG element inside `.mood-ring` refers to a gradient `#ringGrad` which is not defined in the static HTML file. The script dynamically overwrites the SVG's entire inner HTML to inject it, which is redundant and heavy.
* **Impact**: Non-standard CSS reference; unnecessary DOM manipulation.

### 1.9 Mood Ring Label Text Overlap on Mobile (`style.css`)
* **Root Cause**: On screens <= 768px, the ring shrinks to 60px while the label font-size remains at `0.6rem`, causing the text "совпадение" (55px width) to overflow the boundaries of the ring.
* **Impact**: Cluttered layout and text overlap.

---

## 2. Recommended Step-by-Step Fixes

### Step 1: Fix Carousel Zoom Freeze
In `cinemood/app.js` (inside `startCarousel()`), clear the inline transform style when restoring the transition so the stylesheet rules take precedence:
```javascript
    // Restore transition style
    nextSlide.style.transition = "";
    nextSlide.style.transform = ""; // Resets inline style, letting CSS scale(1.02) take effect
```

### Step 2: Relocate and Update Media Queries
1. Move the `@media` blocks (lines 189–231) to the very end of `cinemood/style.css` (after the `.mode-toggle` and `.card-where-row` base styles).
2. Add support for wrapping `.card-where-row` and styling `.btn-tmdb` inside the media query for mobile screens:
```css
/* ─── CARD WHERE ROW & TMDB BUTTON ─── */
.card-where-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
  flex-wrap: wrap; /* Add wrap to prevent mobile overflow */
}
```
Add to `@media(max-width: 480px)` block:
```css
  .card-where-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  .btn-tmdb {
    justify-content: center;
    width: 100%;
  }
```
3. Add a media query for short viewports to align quiz wrapping to the top:
```css
@media (max-height: 680px) {
  .quiz-wrap {
    align-items: flex-start;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}
```
4. Adjust `.ring-label` font size on mobile screens:
```css
@media(max-width: 768px) {
  .ring-label {
    font-size: 0.5rem;
  }
}
```

### Step 3: Prevent Loader Screen Flash and Add API Timeout Race
1. In `cinemood/app.js`, modify `showResults()` to await the recommendation promise *before* hiding the loading screen:
```javascript
async function showResults() {
  let main, alts, uniqueTags = [];
  try {
    const data = await recommendationsPromise;
    main = data.main;
    alts = data.alts;
    if (state.mode === 'tmdb') {
      uniqueTags = data.main.genre ? data.main.genre.split(', ') : [];
    } else {
      uniqueTags = data.uniqueTags || [];
    }
  } catch (err) {
    console.error("Failed to load recommendations, falling back to local:", err);
    const localData = getRecommendations();
    main = localData.main;
    alts = localData.alts;
    uniqueTags = localData.uniqueTags;
  }

  // transition screens ONLY after recommendationsPromise is resolved/rejected
  hide("screen-loading");
  show("screen-results");
```
2. In `showLoading()`, wrap `fetchRecommendations` with a 5-second `Promise.race` timeout to reject slow API requests:
```javascript
  if (state.mode === 'tmdb') {
    const DEFAULT_TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
    recommendationsPromise = Promise.race([
      fetchRecommendations(state.answers, DEFAULT_TMDB_KEY),
      new Promise((_, reject) => setTimeout(() => reject(new Error("TMDB fetch timeout")), 5000))
    ]);
  } else {
    recommendationsPromise = Promise.resolve(getRecommendations());
  }
```

### Step 4: Mitigate DOM XSS
1. Add an `escapeHTML` helper function in the helper section of `cinemood/app.js`:
```javascript
function escapeHTML(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```
2. Wrap references to `uniqueTags` and `alts` elements inside the innerHTML templates in `showResults()`:
```javascript
  if (uniqueTags.length > 0) {
    show("analysis-box");
    const escapedTags = uniqueTags.map(escapeHTML).join(", ");
    aText.innerHTML = `Мы зацепились за ваши ответы, которые указали на состояния: <strong>${escapedTags}</strong>. Алгоритм подобрал фильмы, которые лучше всего резонируют с этим настроением.`;
  }
```
```javascript
  grid.innerHTML = alts.map(a => `
    <div class="alt-card">
      ${a.poster_url ? `<div class="alt-poster-wrap"><img src="${escapeHTML(a.poster_url)}" alt="Постер"></div>` : '<div class="alt-poster-wrap missing-poster"><div class="alt-poster-placeholder">🎬<br><span>Постер отсутствует</span></div></div>'}
      <div class="alt-body">
        <h4>${escapeHTML(a.title)}</h4>
        <div class="alt-meta">${escapeHTML(a.year)} · ${escapeHTML(a.type)} · ${escapeHTML(a.genre)}</div>
        <div class="alt-match">${escapeHTML(a.mood_match)}% совпадение</div>
        <p class="alt-why">${escapeHTML(a.why_template.split(".")[0] + ".")}</p>
        <div class="alt-where">📍 ${escapeHTML(a.where)}</div>
      </div>
    </div>
  `).join("");
```
3. Use defense-in-depth on the quiz steps text area:
```javascript
      <textarea id="text-input" placeholder="Напиши здесь..." rows="4">${escapeHTML(state.answers[s.id] || "")}</textarea>
```

### Step 5: Declare Static Gradient Defs & Optimize Ring Animation
1. In `cinemood/index.html`, add `<defs>` inside the SVG element:
```html
            <div class="mood-ring">
              <svg viewBox="0 0 80 80">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#7c5cfc"/>
                    <stop offset="100%" stop-color="#fc5c7d"/>
                  </linearGradient>
                </defs>
                <circle cx="40" cy="40" r="34" class="ring-bg"/>
                <circle cx="40" cy="40" r="34" class="ring-fill" id="ring-fill"/>
              </svg>
              <span class="ring-pct" id="ring-pct">—%</span>
              <span class="ring-label">совпадение</span>
            </div>
```
2. Remove the SVG inner HTML injection block (lines 1042-1053) in `cinemood/app.js`, leaving only the stroke animation:
```javascript
  // Animate ring
  const circumference = 2 * Math.PI * 34;
  const fill = document.getElementById("ring-fill");
  fill.style.strokeDasharray = circumference;
  fill.style.strokeDashoffset = circumference;
  fill.setAttribute("stroke", "url(#ringGrad)");
  setTimeout(() => {
    const offset = circumference * (1 - main.mood_match / 100);
    fill.style.strokeDashoffset = offset;
  }, 300);
```

### Step 6: Expand Film Strip Marquee Spans
In `cinemood/index.html` (lines 42-51), expand the unique film titles to at least 24 unique titles (total 48 spans) to prevent marquee snapping on ultra-wide monitors:
```html
    <div class="film-strip">
      <div class="film-strip-track">
        <span>Паразиты</span><span>Манчестер у моря</span><span>Прочь</span><span>Жизнь Пи</span>
        <span>Она</span><span>Меланхолия</span><span>1917</span><span>Атака титанов</span>
        <span>Тихое место</span><span>Euphoria</span><span>Аркейн</span><span>Душа</span>
        <span>Начало</span><span>Интерстеллар</span><span>Матрица</span><span>Форрест Гамп</span>
        <span>Дюна</span><span>Бойцовский клуб</span><span>Леон</span><span>Зеленая миля</span>
        <span>Криминальное чтиво</span><span>Темный рыцарь</span><span>Унесенные призраками</span><span>Джокер</span>
        <span>Паразиты</span><span>Манчестер у моря</span><span>Прочь</span><span>Жизнь Пи</span>
        <span>Она</span><span>Меланхолия</span><span>1917</span><span>Атака титанов</span>
        <span>Тихое место</span><span>Euphoria</span><span>Аркейн</span><span>Душа</span>
        <span>Начало</span><span>Интерстеллар</span><span>Матрица</span><span>Форрест Гамп</span>
        <span>Дюна</span><span>Бойцовский клуб</span><span>Леон</span><span>Зеленая миля</span>
        <span>Криминальное чтиво</span><span>Темный рыцарь</span><span>Унесенные призраками</span><span>Джокер</span>
      </div>
    </div>
```
