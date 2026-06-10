# Project: CineMood Enhancement

## Architecture
- CineMood is a lightweight, pure client-side web application.
- **Frontend Layer**: `index.html` (DOM layout) and `style.css` (UI styling, animations, responsive layout).
- **Application Logic**: `app.js` (manages quiz state, user answers, event listeners, UI rendering, local recommendation logic, and local storage).
- **API Integration**: `api.js` (handles querying TMDB API, normalizing results, mapping quiz answers to TMDB search parameters).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Hero Carousel & Premium Minimalist UI | Add background poster carousel to Hero; clean up and refine CSS styling for Dark mode; ensure full mobile responsiveness. | None | DONE |
| 2 | Expanded Recommendations & Classic/Niche Support | Show 6 recommendations (1 main, 5 alts); add "Load More" pagination; relax TMDB query filters to allow films since 1890 and niche movies (low vote counts). | None | IN_PROGRESS |
| 3 | Advanced Features (Bookmarks, Trailers, Sharing, Platform Links) | Save to/load from localStorage watch list; embed or link trailers; generate shareable query URLs; links/fallbacks for IMDb & Letterboxd. | Milestone 1, 2 | PLANNED |
| 4 | Integration, Bug-fix & Compliance | Verify dual-mode support, ensure zero console errors, audit all acceptance criteria, verify with Forensic Auditor. | Milestone 3 | PLANNED |

## Interface Contracts
### `api.js` ↔ `app.js`
- `fetchRecommendations(answers, apiKey)`:
  - Input: `answers` (object containing quiz answers), `apiKey` (string)
  - Output: Promise resolving to `{ main: MovieObject, alts: Array<MovieObject> }`
  - Modification: The returned structure must support at least 6 recommendations, and paginate/fetch more if requested.
- `MovieObject` structure:
  - `tmdb_id`: number (for TMDB films)
  - `title`: string
  - `year`: string/number
  - `type`: 'фильм' | 'сериал'
  - `genre`: string (comma separated)
  - `rating`: string
  - `why_template`: string
  - `where`: string
  - `poster_url`: string
  - `overview`: string
  - `tmdb_url`: string
  - `score`: number
  - `mood_match`: number (60-98)
  - `imdb_id` / `imdb_url`: string (optional, for direct links)
  - `letterboxd_url`: string (optional, for direct links)
