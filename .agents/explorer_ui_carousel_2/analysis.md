# Analysis & Implementation Plan: Hero Carousel & Premium Minimalist UI

This report provides a detailed analysis of the current UI implementation of **CineMood** and presents an implementation strategy for **Milestone 1: Hero Carousel & Premium Minimalist UI**.

---

## 1. Analysis of Current Implementation

### 1.1 background Slides Definition
In `cinemood/index.html` (lines 17–22), background slides are defined directly as static elements:
```html
<div class="hero-bg">
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg')"></div>
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg')"></div>
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg')"></div>
  <div class="hero-overlay"></div>
</div>
```

In `cinemood/style.css` (lines 26–39), the animation and transition properties are defined using CSS keyframes:
```css
.hero-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
.bg-slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; animation: fadeSlide 24s infinite; }
.bg-slide:nth-child(1) { animation-delay: 0s; }
.bg-slide:nth-child(2) { animation-delay: 8s; }
.bg-slide:nth-child(3) { animation-delay: 16s; }

@keyframes fadeSlide {
  0% { opacity: 0; transform: scale(1.05); }
  5% { opacity: 0.5; }
  33% { opacity: 0.5; }
  38% { opacity: 0; transform: scale(1); }
  100% { opacity: 0; }
}
```

#### Key Issues with the CSS-Only Approach:
1. **No Image Preloading (Blank Screen Flash)**:
   When the page loads, only the first slide is fetched immediately. The browser requests the second and third slides later as their animation delay resolves. On slow network connections, this leads to a blank/black screen flashing when transitioning to an unloaded background slide.
2. **Rigidity and Fragility**:
   Adding or removing a slide requires recalculating:
   - The total animation duration (`N * interval`).
   - The animation delay for every single slide child element (`(i-1) * interval`).
   - The percentages in `@keyframes fadeSlide` to match the active, fade-in, and fade-out durations relative to the new total duration.
3. **Abrupt Zoom Reset**:
   When looping back from `scale(1)` at `38%` to `scale(1.05)` at `0%` of the next loop cycle, the zoom resets instantly. Even though the slide is invisible (`opacity: 0`), it creates a directional bias in the Zoom effect instead of a continuous smooth zoom out.

---

### 1.2 Carousel Transition Options

We compared two approaches for implementing a smooth transition with low overhead:

#### Option A: Optimized CSS-Only Keyframes
* **Method**: Preload images using HTML link tags in `<head>`, optimize `@keyframes` to crossfade, and define explicit styles.
* **Pros**: Zero JS execution overhead.
* **Cons**: Remains extremely hard to maintain or expand (e.g. if we want to display dynamic movie backdrops from the search recommendation results).

#### Option B: JS-Driven Controller with CSS Transitions (Recommended)
* **Method**: Use a small JS controller in `app.js` to manage an `.active` class every 7–8 seconds. The transitions (opacity crossfade, Ken Burns scale zoom) are handled natively in CSS.
* **Pros**:
  - **Preloading Support**: JS can preload images before activating the slide.
  - **Dynamic Backdrops**: Easier to swap slide URLs dynamically based on recommendations.
  - **Low System Overhead**: The interval timer can be paused dynamically when the page is hidden (using the Page Visibility API) or when the quiz screen is active (`display: none` on `#screen-hero`), preventing unnecessary CPU/GPU redraws.
  - **Smooth Reset**: JS can instantly reset the transform zoom state on the incoming slide right before starting the fade-in, producing a consistent zoom effect for every transition.

---

### 1.3 Mobile Responsiveness & Layout Shift Analysis

During the analysis of `style.css` and `index.html` across resolutions from 320px up to 1920px, the following critical issues were found:

1. **Mode Toggle Switch Overflow on Mobile (320px)**:
   * *Observation*: `.hero-content` has `padding: 2rem` (64px horizontal), leaving 256px of content area. The `.mode-toggle` containing "Локальный (Быстрый)" and "Онлайн (TMDB)" text buttons with `0.5rem 1.25rem` padding requires at least 312px of width. This causes the toggle switch to break the layout boundaries and overflow horizontally.
   * *Fix*: Reduce container padding on mobile screens to `1rem` and scale down the toggle buttons padding and font sizes.
2. **Marquee Layout Gap on Large Screen resolutions (1920px)**:
   * *Observation*: The `.film-strip` spans shift by `translateX(-50%)`. Since the 12 text elements are not duplicated, the marquee snaps abruptly and leaves a blank space on the right side of the screen on 1920px viewports.
   * *Fix*: Move text spans inside a nested track, duplicate the sequence to ensure a seamless infinite loop, and apply a 3D GPU-accelerated translation `translate3d(-50%, 0, 0)`.
3. **Vertical Clipping on Short Viewports (height < 500px)**:
   * *Observation*: The Hero section (`.hero`) is centered using flexbox and has `min-height: 100vh`. When viewport height is small, the content (which is ~400px tall) overflows. Due to `overflow: hidden`, the top and bottom get clipped. In addition, the absolute positioned `.film-strip` overlapping at `bottom: 0` blocks the start button.
   * *Fix*: Add a media query for small heights/screens to hide `.film-strip`, reduce vertical margins, and allow appropriate layout flow.
4. **Mobile Main Card Divider**:
   * *Observation*: On mobile (`max-width: 600px`), `.main-card` stacks vertically (`flex-direction: column`). However, `.card-poster-wrap img` maintains `border-right: 1px solid var(--border)` and has no divider at the bottom, creating a visual inconsistency.
   * *Fix*: Add media query styling to change the border from right to bottom.

---

## 2. Proposed Implementation Strategy

The proposed changes will transition the carousel to a JS-driven controller, fix mobile responsiveness, and eliminate layout shifts.

### 2.1 HTML Changes (`index.html`)

1. Add `<link rel="preload">` in `<head>` for backdrop images to guarantee instantaneous render.
2. Add `.active` class to the first slide in `<div class="hero-bg">` to enable instant rendering.
3. Restructure `.film-strip` with a nested `.film-strip-track` and duplicate the items to solve marquee gaps.

#### Proposed HTML Diff Mockup:
```html
<!-- In Head -->
<link rel="preload" as="image" href="https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg" />
<link rel="preload" as="image" href="https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" />
<link rel="preload" as="image" href="https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg" />

<!-- In Hero Section -->
<div class="hero-bg">
  <div class="bg-slide active" style="background-image: url('https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg')"></div>
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg')"></div>
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg')"></div>
  <div class="hero-overlay"></div>
</div>

<div class="film-strip">
  <div class="film-strip-track">
    <span>Паразиты</span><span>Манчестер у моря</span><span>Прочь</span><span>Жизнь Пи</span>
    <span>Она</span><span>Меланхолия</span><span>1917</span><span>Атака титанов</span>
    <span>Тихое место</span><span>Euphoria</span><span>Аркейн</span><span>Душа</span>
    <!-- Duplicated sequence for a seamless infinite marquee loop -->
    <span>Паразиты</span><span>Манчестер у моря</span><span>Прочь</span><span>Жизнь Пи</span>
    <span>Она</span><span>Меланхолия</span><span>1917</span><span>Атака титанов</span>
    <span>Тихое место</span><span>Euphoria</span><span>Аркейн</span><span>Душа</span>
  </div>
</div>
```

---

### 2.2 CSS Changes (`style.css`)

We replace keyframe-based delays with direct transitions on the `.active` class. We also include responsive design media queries.

#### Proposed CSS Changes:
```css
/* --- Background Slide Styles --- */
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.bg-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  z-index: 1;
  transform: scale(1.08);
  transition: opacity 2s ease-in-out, transform 8s ease-out;
}
.bg-slide.active {
  opacity: 0.45; /* Optimal opacity for overlay text legibility */
  transform: scale(1);
  z-index: 2;
}

/* --- Seamless Marquee --- */
.film-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  overflow: hidden;
  white-space: nowrap;
  background: rgba(255, 255, 255, .03);
  border-top: 1px solid var(--border);
  padding: .6rem 0;
}
.film-strip-track {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 30s linear infinite;
}
.film-strip span {
  display: inline-block;
  margin: 0 2rem;
  font-size: .75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .1em;
}
@keyframes marquee {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}

/* --- Mobile Responsiveness and Cleanups --- */
@media (max-width: 600px) {
  .hero-content {
    padding: 1rem;
  }
  .mode-toggle-wrap {
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .mode-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
  .main-card {
    flex-direction: column;
  }
  .card-poster-wrap {
    width: 100%;
    height: 300px;
  }
  .card-poster-wrap img {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .alts-grid {
    grid-template-columns: 1fr;
  }
  .card-top {
    flex-direction: column-reverse;
  }
  .mood-ring {
    width: 60px;
    height: 60px;
  }
  .options-grid.cols2 {
    grid-template-columns: 1fr;
  }
  .quiz-wrap {
    padding: 1rem;
  }
}

/* Short height display fixes (e.g. mobile landscape) */
@media (max-height: 500px) {
  .film-strip {
    display: none; /* Hide film strip to free up critical vertical area */
  }
  .hero-content {
    padding: 1rem;
  }
  .logo {
    margin-bottom: 0.75rem;
  }
  .hero-content h1 {
    margin-bottom: 0.5rem;
  }
  .subtitle {
    margin-bottom: 1rem;
  }
  .mode-toggle-wrap {
    margin-bottom: 1rem;
  }
}
```

---

### 2.3 JavaScript Changes (`app.js`)

We will add a carousel manager that handles intervals, active states, Ken Burns reset transitions, and low overhead pause controllers.

#### Proposed JavaScript Code snippet:
```javascript
// --- HERO BACKGROUND CAROUSEL MANAGER ---
let carouselInterval = null;
let currentSlideIndex = 0;
const slideDuration = 8000; // 8 seconds

function startCarousel() {
  if (carouselInterval) return;
  const slides = document.querySelectorAll('.bg-slide');
  if (slides.length <= 1) return;

  carouselInterval = setInterval(() => {
    const prevSlide = slides[currentSlideIndex];
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    const nextSlide = slides[currentSlideIndex];

    // Reset transform transition on the incoming slide instantly
    nextSlide.style.transition = 'none';
    nextSlide.style.transform = 'scale(1.08)';
    
    // Force a browser reflow to apply transition-less transform reset
    nextSlide.offsetHeight;

    // Restore transition rules and toggle active state classes
    nextSlide.style.transition = '';
    
    prevSlide.classList.remove('active');
    nextSlide.classList.add('active');
  }, slideDuration);
}

function stopCarousel() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

// Start carousel on page load
document.addEventListener('DOMContentLoaded', () => {
  startCarousel();
});

// Pause carousel when quiz begins
document.getElementById("btn-start").addEventListener("click", () => {
  stopCarousel();
  show("screen-quiz");
  hide("screen-hero");
  renderStep();
});

// Resume carousel when returning to main screen
function restart() {
  state = { step: 0, answers: {}, multiSelected: new Set(), mode: state.mode };
  hide("screen-results");
  show("screen-hero");
  startCarousel();
  
  // reset loading screen styles
  ["ls1","ls2","ls3","ls4"].forEach(id => {
    document.getElementById(id).className = "ls-item" + (id === "ls1" ? " active" : "");
  });
}

// Low system overhead controller (Visibility API)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopCarousel();
  } else {
    const heroScreen = document.getElementById('screen-hero');
    // Only restart if the home hero screen is currently active/visible
    if (heroScreen && !heroScreen.classList.contains('hidden')) {
      startCarousel();
    }
  }
});
```

---

## 3. Verification Method

Once implemented, the following checklist should be used to verify the solution:

1. **Zero Layout Shifts**:
   Open Chrome DevTools (Audits/Lighthouse) and run a performance profile. Ensure "Cumulative Layout Shift" (CLS) is `0.0` during slide transitions.
2. **Compact Mode Toggle**:
   Verify responsive layouts in DevTools using a 320px wide viewport (e.g. Moto G4 device frame). Verify that the mode selection buttons and their container do not exceed the boundaries of `.hero-content` and cause horizontal scrollbars.
3. **Infinite Seamless Marquee**:
   Inspect the film strip marquee animation. At `100%` completion (`translateX(-50%)`), the transition must be imperceptible and overlap seamlessly back to `0%` without layout shifts or blank gaps.
4. **Low Overhead Check**:
   Confirm that when switching to the quiz screen, or when minimizing/switching the browser tab, the JS carousel interval is successfully cleared (`stopCarousel` is invoked).
