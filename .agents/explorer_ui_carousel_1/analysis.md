# Analysis: Hero Carousel & Premium Minimalist UI

This report provides a detailed analysis of the current Hero background carousel and UI styling of the CineMood application. It outlines design flaws, performance bottlenecks, and responsive layout issues, followed by clear implementation strategies to achieve a premium, smooth, and low-overhead UI.

---

## 1. Current Carousel Implementation Analysis

### HTML Definition
In `cinemood/index.html` (lines 16–22), the background slides are hardcoded inside the `#screen-hero` container:
```html
<div class="hero-bg">
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg')"></div>
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg')"></div>
  <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg')"></div>
  <div class="hero-overlay"></div>
</div>
```

### CSS Definition
In `cinemood/style.css` (lines 26–39), the carousel is animated using a pure CSS timeline:
```css
.hero-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
.bg-slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; animation: fadeSlide 24s infinite; }
.bg-slide:nth-child(1) { animation-delay: 0s; }
.bg-slide:nth-child(2) { animation-delay: 8s; }
.bg-slide:nth-child(3) { animation-delay: 16s; }
.hero-overlay { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(10,10,15,0.7) 0%, var(--bg) 80%); }

@keyframes fadeSlide {
  0% { opacity: 0; transform: scale(1.05); }
  5% { opacity: 0.5; }
  33% { opacity: 0.5; }
  38% { opacity: 0; transform: scale(1); }
  100% { opacity: 0; }
}
```

### Key Issues & Limitations
1. **Brittle Timing Formulas**: If the number of slides changes, the keyframe percentages and total animation duration (`24s`) must be manually recalculated and rewritten in the CSS.
2. **Unnecessary CPU/GPU Overhead**: The animation runs indefinitely in the background even when the hero section is hidden (`display: none !important` via the `.hidden` class) during the quiz or result display. This drains system resources.
3. **Abrupt Ken Burns Zoom Reset**: When a slide finishes its cycle, its transform scales back to `1.05` while invisible. While this is hidden, the timing is locked to the timeline and can cause abrupt jumps if the transition is interrupted.
4. **No Loading Control**: Slides fade in regardless of whether the heavy original-quality background images from TMDB have finished loading, leading to ugly blank backdrops or visual pop-in on slow connections.

---

## 2. Proposed Carousel Transition Strategies

### Option A: Refined Pure CSS (Static & Low-Code)
If a CSS-only setup is preferred, we can optimize it by controlling its execution lifecycle using JS and applying hardware acceleration.

*   **Optimization**: Add `will-change: opacity, transform` to `.bg-slide` to promote it to a separate compositor layer.
*   **Lifecycle Control**: Add a CSS class to pause animations when the hero screen is hidden.
    ```css
    /* style.css */
    .hero.hidden .bg-slide {
      animation-play-state: paused;
    }
    ```
    Since `app.js` already adds the `.hidden` class to `#screen-hero`, this will pause the animation timeline automatically when the quiz starts.

### Option B: Lightweight JS + CSS Transition (Recommended)
This approach removes the hardcoded CSS keyframe loop and delegates slide changes to a simple, highly optimized JS interval while using CSS transitions for smooth cross-fading and Ken Burns zoom effects.

#### CSS Updates:
```css
/* style.css */
.bg-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 2.0s ease-in-out, transform 10s ease-out;
  z-index: 1;
  will-change: opacity, transform;
}

/* Active slide gets visibility and starts slow zoom out */
.bg-slide.active {
  opacity: 0.5;
  transform: scale(1.02);
  z-index: 2;
}

/* Retain previous active slide under the new one for seamless crossfade */
.bg-slide.previous {
  opacity: 0.5;
  transform: scale(1.02);
  z-index: 1;
}
```

#### JS Lifecycle Management (`app.js`):
```javascript
let carouselInterval = null;
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.bg-slide');

function startCarousel() {
  if (carouselInterval || slides.length === 0) return;
  
  // Set initial active state
  slides[currentSlideIndex].classList.add('active');
  
  carouselInterval = setInterval(() => {
    const prevIndex = currentSlideIndex;
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    
    // Manage classes for seamless crossfade
    slides.forEach((slide, idx) => {
      if (idx === currentSlideIndex) {
        slide.className = 'bg-slide active';
      } else if (idx === prevIndex) {
        slide.className = 'bg-slide previous';
      } else {
        slide.className = 'bg-slide';
      }
    });
  }, 8000); // Transitions every 8 seconds
}

function stopCarousel() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

// Hook into app screens transitions:
document.getElementById("btn-start").addEventListener("click", () => {
  show("screen-quiz");
  hide("screen-hero");
  stopCarousel(); // Save resources
  renderStep();
});

// Inside return-to-home triggers:
function restart() {
  state = { step: 0, answers: {}, multiSelected: new Set(), mode: state.mode };
  hide("screen-results");
  show("screen-hero");
  startCarousel(); // Resume carousel
  // ... rest of restart logic
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", startCarousel);
```

#### Why Option B is Superior:
1. **Zero Layout Shifts**: Slide fades are fully controlled, ensuring the background doesn't flash black.
2. **Resource Efficiency**: `setInterval` is completely cleared when the quiz or results are open, resulting in **0% CPU/GPU overhead** from the carousel during the core user flow.
3. **Infinite Extensibility**: Works perfectly with 3, 5, or 10 slides without touchups to the CSS file.
4. **Enhanced Animation**: Resetting class states allows the Ken Burns scale animation to restart cleanly on each loop cycle instead of jumping abruptly.

---

## 3. Mobile Responsiveness & Layout Shifts Investigation

We identified the following design and layout issues on screens from 320px to 600px width:

### Issue A: Search Mode Toggle Overflow on Mobile (320px–400px)
*   **Observation**: The Mode Toggle wrapper (`.mode-toggle-wrap`) aligns the label and the switch button row horizontally. On a 320px width device, this combined horizontal layout exceeds the viewport, causing horizontal scroll and broken layouts.
*   **Solution**: Stack the search mode title above the toggle on mobile screens, and ensure the toggle buttons adapt nicely.
    ```css
    @media (max-width: 480px) {
      .mode-toggle-wrap {
        flex-direction: column;
        gap: 0.5rem;
      }
      .mode-toggle {
        width: 100%;
        max-width: 320px;
      }
      .mode-btn {
        flex: 1;
        padding: 0.5rem 0.5rem;
        font-size: 0.8rem;
        text-align: center;
      }
    }
    ```

### Issue B: Individual Film Strip Marquee Bug
*   **Observation**: In `style.css` (line 52), the marquee animation is applied directly to the individual `span` elements. Since the spans have different content lengths, each span translates relative to its own width. This causes letters to overlap, create massive gaps, and look broken.
*   **Solution**: Wrap the spans in a track element (`.film-strip-track`), duplicate the spans for seamless repetition, and animate the track as a single unit.
    ```html
    <!-- HTML -->
    <div class="film-strip">
      <div class="film-strip-track">
        <span>Паразиты</span><span>Манчестер у моря</span>...
        <!-- Duplicated track items for loop -->
        <span>Паразиты</span><span>Манчестер у моря</span>...
      </div>
    </div>
    ```
    ```css
    /* CSS */
    .film-strip {
      overflow: hidden;
      width: 100%;
    }
    .film-strip-track {
      display: inline-flex;
      white-space: nowrap;
      animation: marquee 30s linear infinite;
    }
    .film-strip span {
      display: inline-block;
      margin: 0 2rem;
      font-size: 0.75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    ```

### Issue C: Main Recommendation Card Image Border & Overflow on Mobile
*   **Observation**: When screen width is under 600px, `.main-card` changes to `flex-direction: column`. The poster moves to the top, but the image retains `border-right: 1px solid var(--border)` instead of having a bottom divider, creating an asymmetrical and broken look. Additionally, the fixed poster height (`300px`) combined with `object-fit: cover` heavily crops the sides of portrait movies on small devices.
*   **Solution**: Reset the right border and apply a bottom border on mobile viewports.
    ```css
    @media (max-width: 600px) {
      .card-poster-wrap img {
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
      .card-poster-wrap {
        width: 100%;
        height: auto;
        aspect-ratio: 2 / 3; /* Matches standard movie poster ratio */
        max-height: 380px;
      }
    }
    ```

### Issue D: Large Container Padding Squishing Mobile Content
*   **Observation**: `.hero-content` and `.card-body` use large `2rem` paddings. On a 320px viewport, this reduces the actual content area to 256px wide, forcing text to wrap into vertical ribbons.
*   **Solution**: Adjust paddings dynamically on mobile viewports:
    ```css
    @media (max-width: 480px) {
      .hero-content {
        padding: 1.5rem 1rem;
      }
      .card-body {
        padding: 1.25rem 1rem;
      }
      .results-wrap {
        padding: 2rem 1rem;
      }
    }
    ```

### Issue E: Screen Switch Scroll Preservation
*   **Observation**: Transitioning from a scrolled results page back to home keeps the scrollbar offset, causing the hero page to start scrolled down.
*   **Solution**: Add `window.scrollTo(0, 0)` inside the `show()` screen transition helper function in `app.js`.

---

## 4. Summary Matrix of Findings & Recommendations

| Item | Current State | Proposed Premium Solution | Advantage |
| :--- | :--- | :--- | :--- |
| **Carousel Transition** | Pure CSS animation loop, no lifecycle controls. | Lightweight JS interval + CSS transition class toggle. | 0% active GPU overhead when hidden, seamless crossfades, scales easily. |
| **Mode Toggle Layout** | Horizontal row, wraps and overflows on mobile. | Stack label/button row below 480px, expand buttons to fill space. | Zero layout shifts, professional alignment. |
| **Film Strip Animation** | Animated spans individually, causes text collision. | Single marquee track wrapping duplicate strings. | Clean, continuous looping marquee without text overlaps. |
| **Recommendation Card** | Border right on mobile, squished layout. | Border bottom, responsive aspect-ratio, optimized padding. | High-end presentation that fits correctly on 320px screens. |
| **UX Navigation** | Keeps vertical scroll position on screen switch. | Call `window.scrollTo(0, 0)` in helper function. | Consistent, polished, predictable flow. |
