## Challenge Summary

**Overall risk assessment**: LOW

All layout and marquee constraints verify successfully. The application demonstrates solid responsiveness from 320px up to 1920px, with appropriate layout adaptation (flex wrapping, vertical stacking, and flex-alignment adjustment) across different viewport heights and widths.

---

## Challenges

### [Low] Challenge 1: Dual Range Year Slider Usability near Boundaries

- **Assumption challenged**: The assumption that standard layered HTML range inputs with pointer-events toggles are fully intuitive and trouble-free when both thumbs overlap.
- **Attack scenario**: A user moves both range sliders to the maximum year (2026). When trying to drag the "start" slider (from) back to a lower year (e.g., 2010), the "end" slider (to) sits on top in the DOM and intercepts pointer events, making it difficult for the user to select and move the "start" slider.
- **Blast radius**: Low impact on layout/clipping. Does not cause visual layout break, but affects UX/usability on screens of any size.
- **Mitigation**: Adjust the `z-index` of the active slider or the one closest to the pointer dynamically, or increase thumb sizes on hover.

### [Low] Challenge 2: Extremely Long Watch Provider Names

- **Assumption challenged**: The assumption that watch provider list strings will always contain space delimiters and fit within the stacked flex column layout under 375px viewports.
- **Attack scenario**: A watch provider returns a single continuous string without spaces, such as `VeryLongStreamingServiceNameWithoutAnySpaces` or similar.
- **Blast radius**: The string might extend beyond the bounds of `.where-val` since there is no `word-break: break-word` or `overflow-wrap: anywhere` defined on `.where-val` in `style.css`.
- **Mitigation**: Add `word-break: break-word` or `overflow-wrap: anywhere` to `.where-val` to guarantee wrapping even for continuous non-spaced strings.

---

## Stress Test Results

### 1. Marquee Continuous Loop Test (up to 1920px)
- **Scenario**: Render the movie marquee on screen widths up to 1920px. Ensure translation by `-50%` does not expose blank gaps at the end of the track.
- **Expected behavior**: Track cycle width must be greater than or equal to 1920px.
- **Actual behavior**: One track cycle width is estimated at 3111px (Text width ~1575px, margin width ~1536px). Since 3111px > 1920px, the track always extends beyond the right edge of a 1920px viewport, preventing snapping or gap visibility.
- **Result**: PASS

### 2. Watch Provider Row Mobile Overflow Test (under 375px)
- **Scenario**: Simulate viewport width of 320px–375px with typical movie data (e.g., "YouTube (бесплатно), Кинопоиск" and TMDB link button).
- **Expected behavior**: Flex wrapping or vertical stacking ensures elements do not overflow the card container boundary.
- **Actual behavior**: Under 480px, media queries enforce `.card-where-row` to use `flex-direction: column` and `align-items: stretch` with the button taking `width: 100%`. The provider info and button stack vertically, and text wraps inside `.where-val` if necessary. No horizontal overflow occurs.
- **Result**: PASS

### 3. Quiz Clipping on Short Viewports (height <= 680px)
- **Scenario**: Simulate a short viewport height (e.g., 500px) during the quiz screen.
- **Expected behavior**: Quiz container remains fully scrollable; controls (home button, progress bar, navigation buttons) do not clip at the top of the viewport.
- **Actual behavior**: Under 680px height, the media query changes `.quiz-wrap` from `align-items: center` to `align-items: flex-start`. The quiz elements anchor to the top of the viewport (y=0) and overflow vertically at the bottom. The user can access all elements by scrolling downwards.
- **Result**: PASS

---

## Unchallenged Areas

- **API and Network Layer** — Out of scope. We focused purely on CSS layout and JavaScript UI render behaviors across viewports.
