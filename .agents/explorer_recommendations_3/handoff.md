# Niche & Classic Support Explorer Handoff Report

## 1. Observation

Direct observations from the `CineMood` codebase files:

### A. TMDB Filter Defaults & Hardcoding in `cinemood/api.js`
In `cinemood/api.js`, the TMDB endpoint URL builder `buildUrl` hardcodes strict vote count and average rating thresholds:
```javascript
228: function buildUrl(ep, params, apiKey) {
229:   const p = new URLSearchParams({
230:     api_key: apiKey,
231:     language: 'ru-RU',
232:     sort_by: 'vote_average.desc',
233:     'vote_count.gte': 300,
234:     'vote_average.gte': 6.5,
235:     page: 1,
236:     ...ep.extra,
237:   });
```
Furthermore, the default fallback year range is set to `2007` to `2026` if `answers.year_range` is not supplied:
```javascript
113:   const yr = answers.year_range || { from: 2007, to: 2026 };
```
And `buildParams` does not forward `answers.language` into the generated parameters object for the API request:
```javascript
129:   return {
130:     genres: finalGenres.slice(0, 3), // TMDB: comma = AND, pipe = OR
131:     excludedGenres: excludedIds,
132:     keywords: keywords.slice(0, 3),
133:     yearFrom: yr.from,
134:     yearTo:   yr.to,
135:     contentType: answers.contentType || 'any',
136:     ageRating: answers.age_rating || 'any',
137:   };
```

### B. Year Range Slider Boundaries in `cinemood/app.js`
The UI step configuration for `year_range` in `cinemood/app.js` limits the minimum year selection to `1930`:
```javascript
524:   {
525:     id: "year_range",
526:     type: "range",
527:     emoji: "📅",
528:     question: "Период выхода — какие годы?",
529:     hint: "Перетащи ползунки чтобы выбрать диапазон",
530:     min: 1930, max: 2026, defaultFrom: 2007, defaultTo: 2026
531:   },
```

### C. Local Database Filtering in `cinemood/app.js`
The local scoring function hard-rejects films outside of the selected year range:
```javascript
869:   // ── Year range filter (hard) ──
870:   const yr = a.year_range;
871:   if (yr) {
872:     if (film.year < yr.from || film.year > yr.to) return -999;
873:   }
```
Currently, the oldest films in `FILMS_DB` are from `1965` (e.g. *Операция «Ы»* on line 306). No movies in the local database date earlier than 1965.

---

## 2. Logic Chain

1. **TMDB Vote Filters (Obs. A)**: High-popularity Hollywood releases easily satisfy the `vote_count.gte: 300` and `vote_average.gte: 6.5` criteria. However, older classic films (especially from 1890–1950) or regional/niche releases (e.g., Soviet/CIS cinema) have significantly fewer ratings on TMDB. Hardcoding these values filters them out entirely from TMDB results.
2. **Sorting Impact (Obs. A)**: Simply lowering the vote threshold while sorting by `vote_average.desc` causes rating spam (e.g., obscure home videos/movies with 1 or 2 high votes appearing at the top). We must dynamically change `sort_by` to `popularity.desc` when the vote count threshold is relaxed (below 50 votes).
3. **Language Context Gap (Obs. A)**: The user selects a language preference (such as `language: 'cis'`) in the quiz, but this preference is ignored by the TMDB discover URL. Translating `answers.language` into TMDB's `with_original_language` allows regional queries, but these regional queries *require* relaxed vote thresholds to return any results since foreign language films have low global vote densities.
4. **UI Limits (Obs. B)**: Capping the range slider `min` at 1930 prevents selecting years from 1890. Changing this to 1890 is fully supported by the dynamic range renderer code (lines 787–791).
5. **Local Mode Year Disconnect (Obs. C)**: If a user selects a range like 1890–1950, local database mode filters out all films with a hard `-999` score penalty. The engine then falls back to presenting random, unrelated recommendations with score 0. We can fix this by (a) adding iconic pre-1960 classics to the local DB and (b) implementing a "soft year limit fallback" to dynamically relax the year filter if no local films match.

---

## 3. Caveats

- **API Limits on Regional Logic**: We assume TMDB's `with_original_language` parameter with comma-separated ISO language codes (e.g., `ru|uk|be|kk`) is well-supported by TMDB's `/discover` endpoint.
- **Rating Spam Defense**: Sorting by `popularity.desc` for low vote counts mitigates spam but may sometimes favor more visible classics over very obscure indie gems. This is a trade-off to ensure content quality.
- **Offline Mode Constraints**: The local database cannot contain millions of films. The soft fallback ensures a recommendation is always served, but it will inevitably serve newer films if the database has no early matches.

---

## 4. Conclusion

Strict TMDB filters must be dynamically relaxed to support historic and niche cinema:
1. **Dynamic TMDB Thresholds**: Calculate `vote_count.gte` and `vote_average.gte` dynamically based on the starting release year of the query, scaling down to 5 votes for pre-1930 films.
2. **Spam Defense**: Switch sorting dynamically to `popularity.desc` when vote thresholds are under 50.
3. **Region Querying**: Map `answers.language` to TMDB's `with_original_language` parameter.
4. **UI Expansion**: Set `min: 1890` in the `year_range` step configuration.
5. **Local Fail-safe**: Inject pre-1960 classics into the local database, and relax the hard release-year filter to a soft `-40` penalty if zero local films match the year criteria.

A complete implementation patch has been written to:
`/Users/ramathehill/CineMood/.agents/explorer_recommendations_3/cinemood_filters.patch`

---

## 5. Verification Method

1. **Verify UI Boundaries**: Inspect `cinemood/app.js` and run the app. Open the period slider; the minimum year should display as 1890 and allow selection.
2. **Verify TMDB URL Params**: Set a breakpoint or insert a log statement inside `buildUrl` in `cinemood/api.js`. Select years like 1900–1940 and "CIS/Soviet" language. Inspect the URL and parameters; verify that:
   - `vote_count.gte` is set to 5.
   - `vote_average.gte` is set to 5.0.
   - `sort_by` is set to `popularity.desc` (instead of `vote_average.desc`).
   - `with_original_language` is set to `ru|uk|be|kk`.
3. **Verify Local Fallback**: Run in local mode and select years 1890–1920. The app should return the newly added classic films (e.g., *Battleship Potemkin*, *Man with a Movie Camera*) as top recommendations rather than returning unrelated films with zero scores.
4. **Automated Verification**: Execute the project tests:
   ```bash
   python3 cinemood/run_tests.py
   ```
   Confirm all carousel transition tests continue to pass.
