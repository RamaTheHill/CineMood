# BRIEFING — 2026-06-10T21:15:31+05:00

## Mission
Investigate how to relax strict TMDB filters in `cinemood/api.js` to support classic films (since 1890) and niche/independent cinema.

## 🔒 My Identity
- Archetype: explorer
- Roles: Niche & Classic Support Explorer
- Working directory: /Users/ramathehill/CineMood/.agents/explorer_recommendations_3
- Original parent: 3185b49d-f737-4664-82d1-c37630324296
- Milestone: Relax strict filters for classic and niche movies

## 🔒 Key Constraints
- Read-only investigation — do NOT implement project code changes
- Code-only network mode — no external requests or web search allowed

## Current Parent
- Conversation ID: 3185b49d-f737-4664-82d1-c37630324296
- Updated: 2026-06-10T21:35:00+05:00

## Investigation State
- **Explored paths**:
  - `cinemood/api.js`: Analyzed TMDB query construction (`buildUrl`, `buildParams`), hardcoded filters (`vote_count.gte`, `vote_average.gte`), and `answers.year_range` fallback.
  - `cinemood/app.js`: Checked how `year_range` is configured in `STEPS` (slider properties), how local recommendations are scored (`scoreFilm`), and where the TMDB fetch is initiated (`showLoading`, `recommendationsPromise`).
  - `cinemood/index.html` & `cinemood/test_carousel.html`: Verified that the quiz screens and inputs are dynamically generated from JavaScript config.
- **Key findings**:
  - TMDB queries currently use hardcoded `vote_count.gte: 300` and `vote_average.gte: 6.5`. This strips out virtually all historic (pre-1980) and niche/local (non-English/CIS) films.
  - The UI slider is capped at a minimum year of 1930. Changing it to 1890 in `app.js` is fully supported by the dynamic range renderer.
  - The local database (`FILMS_DB`) does not have films older than 1965. Selecting very old years in local mode causes all films to fail the hard release-year filter, returning arbitrary results.
  - Soviet/CIS films on TMDB are heavily penalized by the high vote threshold since they have low vote densities relative to Hollywood films.
- **Unexplored areas**:
  - Live API testing (impossible due to CODE_ONLY network mode and read-only instructions, but code logic verification is complete).

## Key Decisions Made
- Dynamically scale the `vote_count.gte` and `vote_average.gte` thresholds based on the selected year range start.
- Switch the TMDB sort method from `vote_average.desc` to `popularity.desc` when the vote threshold drops below 50, preventing high-rating, low-vote spam.
- Pass the user's regional/language selection (`answers.language`) to TMDB queries using the `with_original_language` parameter, paired with dynamic vote relaxations.
- Add historic masterpieces to the local database and implement a "soft-year filter fallback" in local mode to avoid empty/random results if no local entries match the chosen year.

## Artifact Index
- `/Users/ramathehill/CineMood/.agents/explorer_recommendations_3/handoff.md` — Detailed exploration report.
- `/Users/ramathehill/CineMood/.agents/explorer_recommendations_3/cinemood_filters.patch` — Proposed patch file with all recommended code modifications.
