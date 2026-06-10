# Exploration Report: "Show More" Pagination & UI Investigation

This report investigates and presents the implementation details for adding a "Show More" button to dynamically load more recommendation options in both Local and TMDB modes.

---

## 1. Observation
I directly observed the structure of the layout, styling, and recommendation engine by inspecting the codebase:

*   **DOM Structure (`cinemood/index.html`):**
    *   The alternative cards grid is inside the `#screen-results` section (lines 150-151):
        ```html
        <!-- ALTERNATIVES -->
        <div class="alts-label">Другие подходящие варианты:</div>
        <div class="alts-grid" id="alts-grid"></div>
        ```
    *   The result control buttons follow the grid (lines 153-155):
        ```html
        <button class="btn-refine" id="btn-refine">🎯 Уточнить подбор</button>
        <button class="btn-restart" id="btn-restart">↩ Пройти заново</button>
        <button class="btn-home-results" id="btn-home-results">🏠 На главную</button>
        ```

*   **Styling (`cinemood/style.css`):**
    *   The layout width constraints and grid media query behavior are:
        *   Lines 167-168: `.alts-grid` defaults to `grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;`.
        *   Lines 292: `@media(max-width: 768px) { .alts-grid { grid-template-columns: 1fr; } }`
    *   Alternative card entry animation is already defined in CSS under keyframes `fadeUp` (lines 54-55):
        ```css
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        ```
    *   Buttons like `.btn-restart` use rounded premium styling (lines 183-184):
        ```css
        .btn-restart { display: block; margin: 0 auto; background: transparent; border: 1.5px solid var(--border); color: var(--muted); padding: .75rem 2rem; border-radius: 50px; cursor: pointer; font-family: var(--font); font-size: .9rem; transition: all .2s; }
        ```

*   **Local Filtering Mode (`cinemood/app.js`):**
    *   The `getRecommendations` engine calculates matching tags and scores all 40 movies in `FILMS_DB`.
    *   It currently sorts descending and slices exactly the top 3 recommendations (lines 982-989):
        ```javascript
        const top = scored.slice(0, 3);
        const toMoodMatch = (score) => Math.max(60, Math.min(98, Math.round(score)));

        const main = { ...top[0], mood_match: toMoodMatch(top[0].score) };
        const alts = top.slice(1, 3).map((f, i) => ({
          ...f,
          mood_match: toMoodMatch(f.score - 8 - i * 4)
        }));
        ```

*   **TMDB API Mode (`cinemood/api.js`):**
    *   In TMDB Mode, `fetchRecommendations` issues HTTP searches. It queries TMDB discover endpoints (returns 20 items per page by default) but discards 12 of them by slicing to 8 items in the fetch loop (line 159):
        ```javascript
        const items = (data.results || []).slice(0, 8);
        ```
    *   It then deduplicates, scores them, and slices the top 3 (lines 175-187):
        ```javascript
        const scored = unique.map(r => ({ ...r, score: moodScore(r, answers) }));
        scored.sort((a,b) => b.score - a.score);
        const top3 = scored.slice(0, 3);
        // ...
        const output = {
          main: { ...top3[0], mood_match: clamp(top3[0]?.score || 70) },
          alts: top3.slice(1).map((r, i) => ({
            ...r, mood_match: clamp((top3[0]?.score || 70) - 8 - i * 5)
          }))
        };
        ```

---

## 2. Logic Chain

1.  **Placement of "Show More" Button**: Placing the "Show More" button directly between the alternatives grid (`#alts-grid`) and the control buttons (like `.btn-refine`) is the natural user experience. It ensures the button is associated with expanding the list.
2.  **Visual and Responsive Design**: To match the minimalist theme, the button should use a semi-translucent glass background (`rgba(255, 255, 255, 0.03)`), matching borders, hover glows, and rounded shape (`border-radius: 50px`).
    *   On smaller viewports, it should stretch to full width (`width: 100%`) using media queries below `480px` to maintain premium usability down to `320px`.
    *   Applying the pre-existing `fadeUp` animation keyframes to `.alt-card` ensures that newly loaded cards slide in smoothly, improving feedback.
3.  **State Management**: Instead of discarding matched recommendations during the sorting stage, the app should save the remaining scored recommendations inside the global `state` object (e.g. `state.allAlts`) and maintain a counter `state.displayedCount` which keeps track of the currently rendered count (initially 2).
4.  **Local Mode Slicing**:
    *   Films with `score < 0` (which indicate they failed hard filters like content format, year range, or age rating) should be excluded first.
    *   Remaining films should be sorted descending. Index 0 is the main card, indices 1+ are the candidates for alternatives.
5.  **TMDB Mode Fetching Comparison**:
    *   *Option A (Initial fetch + client-side slice)*:
        *   Removing the `.slice(0, 8)` constraint during TMDB fetch allows the app to score all 20 results that TMDB returns in its default page payload. This generates up to ~30-40 valid candidates across endpoints without issuing any additional network requests.
        *   Since TMDB already sends 20 items in the API response, loading the full list does *not* add any network overhead. It is purely client-side and instant when the user clicks "Show More".
    *   *Option B (Dynamic pagination with new API requests)*:
        *   Querying the API `page` parameter dynamically on each click requires complex state coordination (handling loading state, error catch, merging and deduplicating results across multiple active discover queries) and introduces latency (1-2 seconds) for each page load.
    *   *Recommendation*: **Option A** is far more efficient, reliable, and provides a much faster and premium user experience (instant transitions).
6.  **Hiding vs Disabling**:
    *   Hiding the button is preferred over disabling it. A disabled button remains on the screen, adding visual noise and violating the minimalist "less is more" design. Hiding it allows the layout to naturally terminate and draws the user's attention back to the action controls ("Уточнить подбор", "Пройти заново").

---

## 3. Caveats
*   **API Limits**: In Option A, pagination is capped by the number of results returned on TMDB's page 1 (up to 20 per endpoint, which yields a max of ~30 unique items after deduplication). This is more than enough for a standard recommendation session (representing 7+ pages of click-to-load).
*   **Extreme Filter Exclusion**: If filters are set extremely tight (e.g. only Ukrainian films from 1950 in a particular mood), the number of matches might be small. The state handling must gracefully hide the button if the candidate pool is less than or equal to 2.

---

## 4. Conclusion & Code Proposals

The implementation should consist of changes in three files: `index.html`, `style.css`, and `app.js` (with optional adjustment to `api.js` for TMDB Option A).

### Proposed DOM Insertion (`cinemood/index.html`)
Around line 151, insert the `#btn-show-more` button:
```html
      <!-- ALTERNATIVES -->
      <div class="alts-label">Другие подходящие варианты:</div>
      <div class="alts-grid" id="alts-grid"></div>

      <!-- SHOW MORE BUTTON -->
      <button class="btn-show-more hidden" id="btn-show-more">Показать ещё</button>

      <button class="btn-refine" id="btn-refine">🎯 Уточнить подбор</button>
```

### Proposed Styles (`cinemood/style.css`)
Append the styling rules at the bottom of the stylesheet:
```css
/* ─── SHOW MORE BUTTON ─── */
.btn-show-more {
  display: block;
  margin: 1.5rem auto 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1.5px solid var(--border);
  color: var(--text);
  padding: 0.85rem 2.5rem;
  border-radius: 50px;
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.btn-show-more:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent);
  box-shadow: 0 0 15px rgba(124, 92, 252, 0.2);
  transform: translateY(-1px);
}

.btn-show-more:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border);
}

/* Smooth entry animation for newly added cards */
.alt-card {
  animation: fadeUp 0.4s ease forwards;
}

@media(max-width: 480px) {
  .btn-show-more {
    width: 100%;
    padding: 0.85rem 1.5rem;
    margin: 1.5rem 0 2rem;
  }
}
```

### Proposed State & Logic Changes (`cinemood/app.js`)

1.  **State Initialization** (lines 605-610):
    ```javascript
    let state = {
      step: 0,
      answers: {},
      multiSelected: new Set(),
      mode: 'local',
      allAlts: [],          // <-- Track full alternatives array
      displayedCount: 2     // <-- Track current visible count
    };
    ```

2.  **Local Recommendation Fetching** (`getRecommendations`, lines 972-994):
    ```javascript
    function getRecommendations() {
      let allTags = [];
      const scored = FILMS_DB.map(f => {
        let mTags = [];
        const score = scoreFilm(f, mTags);
        if (mTags.length) allTags.push(...mTags);
        return { ...f, score, mTags };
      });

      // Filter out items that failed hard criteria (score < 0)
      const validScored = scored
        .filter(f => f.score >= 0)
        .sort((a, b) => b.score - a.score);

      const toMoodMatch = (score) => Math.max(60, Math.min(98, Math.round(score)));

      if (validScored.length === 0) {
        // Fallback to top scored items to prevent empty screen
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 3);
        return {
          main: { ...top[0], mood_match: toMoodMatch(top[0].score) },
          alts: top.slice(1, 3).map((f, i) => ({
            ...f,
            mood_match: toMoodMatch(f.score - 8 - i * 4)
          })),
          allAlts: [],
          uniqueTags: [...new Set(top[0]?.mTags || [])]
        };
      }

      const main = { ...validScored[0], mood_match: toMoodMatch(validScored[0].score) };
      
      // All remaining matches are stored as alternatives
      const altsCandidates = validScored.slice(1);
      
      const alts = altsCandidates.slice(0, 2).map((f, i) => ({
        ...f,
        mood_match: toMoodMatch(f.score - 8 - i * 4)
      }));

      const allAlts = altsCandidates.map((f, i) => ({
        ...f,
        mood_match: toMoodMatch(f.score - 8 - i * 4)
      }));

      const uniqueTags = [...new Set(validScored[0].mTags || [])];
      
      return { main, alts, allAlts, uniqueTags };
    }
    ```

3.  **Render Helpers & Results Display** (`showResults`, lines 998-1083):
    Create a standalone renderer for alternatives:
    ```javascript
    function renderAlternatives(alts) {
      const grid = document.getElementById("alts-grid");
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
    }
    ```
    Update `showResults` to set up pagination parameters:
    ```javascript
    async function showResults() {
      let main, alts, allAlts = [], uniqueTags = [];
      try {
        const data = await recommendationsPromise;
        main = data.main;
        alts = data.alts;
        allAlts = data.allAlts || [];
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
        allAlts = localData.allAlts || [];
        uniqueTags = localData.uniqueTags;
      }

      // Store in state
      state.allAlts = allAlts;
      state.displayedCount = 2;

      // Transition screens
      hide("screen-loading");
      show("screen-results");

      // [ ... main card rendering codes remain unchanged ... ]

      // Render initial 2 alternatives
      renderAlternatives(alts);

      // Handle Show More visibility
      const showMoreBtn = document.getElementById("btn-show-more");
      if (state.allAlts.length > state.displayedCount) {
        showMoreBtn.classList.remove("hidden");
      } else {
        showMoreBtn.classList.add("hidden");
      }
    }
    ```

4.  **Event Listeners & Reset Logic**:
    *   Register event listener on start (around line 639):
        ```javascript
        document.getElementById("btn-show-more").addEventListener("click", () => {
          state.displayedCount += 4; // Increments display by 4 alternatives
          const currentAlts = state.allAlts.slice(0, state.displayedCount);
          renderAlternatives(currentAlts);

          // Hide button if we reached the end of matches
          if (state.displayedCount >= state.allAlts.length) {
            document.getElementById("btn-show-more").classList.add("hidden");
          }
        });
        ```
    *   Update `restart` function to reset the pagination state:
        ```javascript
        function restart() {
          state = { 
            step: 0, 
            answers: {}, 
            multiSelected: new Set(), 
            mode: state.mode,
            allAlts: [],
            displayedCount: 2
          };
          hide("screen-results");
          document.getElementById("btn-show-more").classList.add("hidden");
          show("screen-hero");
          // ... [rest of the reset logic]
        }
        ```

### Proposed TMDB Query Modification (`cinemood/api.js`)
If utilizing **Option A** (which is recommended for premium smoothness), update the slice line in `api.js` (line 159) to retain the full raw response page of 20 results instead of slicing to 8, and structure the returns to match the output:
```javascript
      // Inside fetchRecommendations:
      const items = (data.results || []).slice(0, 20); // <-- Fetch full page
```
And structure output accordingly:
```javascript
  const main = { ...scored[0], mood_match: clamp(scored[0]?.score || 70) };
  const altsCandidates = scored.slice(1);
  const alts = altsCandidates.slice(0, 2).map((r, i) => ({
    ...r, mood_match: clamp((main.mood_match) - 8 - i * 5)
  }));
  const allAlts = altsCandidates.map((r, i) => ({
    ...r, mood_match: clamp((main.mood_match) - 8 - i * 5)
  }));

  const output = {
    main,
    alts,
    allAlts
  };
```

---

## 5. Verification Method

To independently verify the recommendations in the implemented codebase:

1.  **Functional Checks**:
    *   Start quiz, complete it in both Local and TMDB mode.
    *   Confirm the results screen renders exactly 2 alternative recommendations initially.
    *   Check if the "Показать ещё" button is visible when matching results > 2.
    *   Click "Показать ещё" and verify that up to 4 more cards slide into view dynamically with a slide-up animation.
    *   Click "Показать ещё" until no more results are available, verifying that the button hides smoothly when the list is fully exhausted.
    *   Verify that clicking "Пройти заново" / "На главную" resets pagination state, hides the "Показать ещё" button, and restarts the flow cleanly.
2.  **Responsive Layout Check**:
    *   Open dev tools, size view width to `320px`.
    *   Verify that the "Показать ещё" button takes 100% of the available row content width with correct inner margins and clean readability.
3.  **Automated Carousel Tests**:
    *   Run `python3 cinemood/run_tests.py` to ensure that carousel timing and visibility events remain unaffected.
