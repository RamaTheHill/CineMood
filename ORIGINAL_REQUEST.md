# Original User Request

## Initial Request — 2026-06-10T15:53:56Z

An improved version of the CineMood movie recommendation web application. The goal is to enhance the application with advanced features and a polished minimalist design, optimized for fast loading and low system overhead, while maintaining full mobile responsiveness.

Working directory: /Users/ramathehill/CineMood
Integrity mode: development

## Requirements

### R1. Minimalist Premium UI & Animations
- A simple, clean, and minimalist design that loads fast and has low system overhead.
- A beautiful, smooth background carousel of movie posters on the main menu (Hero section) to create a premium first impression.
- Full mobile responsiveness ensuring a great user experience on smartphones (down to 320px width).

### R2. Advanced Features (Bookmarks, Trailers, Sharing, Platforms)
- **Bookmarks**: A "Watch List" feature allowing users to bookmark movies/shows. Bookmarks must be stored locally in the browser (localStorage) so they persist across sessions.
- **Trailers**: Integration of trailers directly on the movie detail card (fetching and showing trailer links or embedding a lightweight player, e.g., YouTube embed or TMDB video source).
- **Share Selection**: A sharing feature that generates a unique shareable URL containing the user's answers or final recommendations, allowing others to view the same results.
- **Platform Links (IMDb & Letterboxd)**: Movie details (both local database and live TMDB recommendations) must include direct buttons/links to their respective pages on IMDb and Letterboxd. If direct IDs are not available, fallback to search query links on these platforms.

### R3. Comprehensive Movie Selection (Niche & Classic Films, More Results)
- **Classic & Niche Support**: For the TMDB integration mode, relax strict filtering criteria (such as high minimum vote counts or release date limits) to allow the discovery of very old classic films (dating back to the late 1800s/early 1900s) and niche or independent cinema.
- **More Recommendations**: Increase the number of recommendations shown on the results page from 3 to 6 (e.g., 1 main recommendation and 5 alternatives), and implement a "Show More" / "Load More" button to dynamically fetch and display additional options if the user wants to see more.

### R4. Tech Stack
- Keep the project lightweight and fast by using pure HTML, Vanilla JavaScript, and custom CSS without complex frameworks.

## Verification Plan

### Automated/Programmatic Verification
- None (pure client-side vanilla web application).

### Agent-as-Judge Audit
- An independent audit agent will run a local web server, perform the following checks via a headless browser or manual validation, and output a conformance report:
  1. Verify the Hero page background carousel cycles through images.
  2. Verify that clicking "Bookmark" saves the movie to localStorage, and it correctly renders in the saved bookmark list.
  3. Verify that clicking "Trailer" displays an embedded player or links to the trailer.
  4. Verify that the "Share" link copies a URL that, when loaded in a new session, directly opens the recommended results.
  5. Verify that detail cards display buttons for IMDb and Letterboxd, linking to search queries or direct pages of the recommended title.
  6. Verify that the results screen displays at least 6 recommendations (or shows a "Show More" button that loads more recommendations).
  7. Verify that the TMDB search parameters can retrieve classic films (e.g., films from the year 1900 or earlier) and niche titles.
  8. Verify that there are no console errors during run-time.

## Acceptance Criteria

### Functional Completeness
- [ ] Bookmarks: Users can save recommended movies/shows, view their bookmarks in a dedicated list/modal, and remove bookmarks. State persists on page refresh.
- [ ] Trailers: Recommended movie cards include an interactive trailer button that opens a lightweight video player/embed.
- [ ] Sharing: Clicking "Share" copies a URL to the clipboard. Opening this URL in a fresh browser tab immediately renders the recommended movies without requiring the user to retake the quiz.
- [ ] IMDb & Letterboxd Links: Every recommendation card displays functional buttons/links to view the movie on IMDb and Letterboxd.
- [ ] Expand Recommendations: The results screen shows 6 movie options by default, and includes a "Show More" button to load further recommendations.
- [ ] Niche & Historic Movies Support: In TMDB mode, the query parameters include support for movies released since 1890, and minimum vote counts are relaxed to ensure niche films are not filtered out.
- [ ] Dual Mode support: All new features (bookmarks, trailers, sharing, platform buttons, pagination) work seamlessly in both Local and TMDB search modes.

### Visual Design & Responsiveness
- [ ] Hero Carousel: A smooth, automatic movie poster carousel runs in the background of the Hero section.
- [ ] Minimalist Premium Look: Clean, elegant layouts using premium gradients/shadows matching the dark aesthetic.
- [ ] Mobile Friendly: Zero layout shifts or broken element flows on screen resolutions from 320px up to 1920px.
