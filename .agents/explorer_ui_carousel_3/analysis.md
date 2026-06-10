# Milestone 1 Investigation & UI Strategy Report

This report presents findings from an investigation of the CineMood codebase, focusing on the Hero section background carousel and premium minimalist UI responsiveness. It proposes a design and implementation strategy to ensure zero layout shifts, smooth transitions, and proper rendering across resolutions from 320px up to 1920px.

---

## 1. Analysis of Current Background Slides

### Current HTML Implementation (`cinemood/index.html:15-22`)
```html
<section class="hero" id="screen-hero">
  <div class="hero-bg">
    <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg')"></div>
    <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg')"></div>
    <div class="bg-slide" style="background-image: url('https://image.tmdb.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg')"></div>
    <div class="hero-overlay"></div>
  </div>
```

### Current CSS Implementation (`cinemood/style.css:26-39`)
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

### Identified Drawbacks:
1. **Slide Count Coupling (Rigidity)**: The total animation duration (`24s`), delays (`8s`, `16s`), and the `@keyframes` percentage timings (5% fade-in, 33% stay, 38% fade-out) are hardcoded for exactly 3 slides. Adding or removing a slide requires manual recalculation of both the CSS delay parameters and the keyframe steps.
2. **Flash of Unloaded Content**: If an image takes too long to load, the CSS animation cycle will continue regardless, resulting in a black background or sudden visual pop-ins when it loads.
3. **No Offline Support**: In offline or constrained network situations (common for CODE_ONLY modes or local tests), the absolute paths to `image.tmdb.org` fail silently, leaving the Hero section completely black.

---

## 2. Proposed Carousel Transition Strategy

To implement a premium, flexible, low-overhead carousel that handles any number of slides seamlessly and avoids rigid CSS timings, we suggest a **Hybrid JS/CSS Transition Strategy**:

### A. CSS Modification (Remove rigid animations, use CSS transitions)
Replace the `@keyframes fadeSlide` and child selectors with transition classes:
```css
/* Fallback premium background for offline support or slow loading */
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: radial-gradient(circle at center, #1b1338 0%, var(--bg) 100%);
}

.bg-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 1.8s ease-in-out, transform 8.5s ease-out;
  z-index: 1;
}

/* Active class triggers smooth opacity fade-in and scale zoom-out */
.bg-slide.active {
  opacity: 0.45;
  transform: scale(1.02);
  z-index: 2;
}

/* Ensure overlay stays on top of active slides */
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: radial-gradient(circle at center, rgba(10,10,15,0.55) 0%, var(--bg) 85%);
  pointer-events: none;
}
```

### B. Lightweight JS Carousel Controller (`cinemood/app.js`)
We will add an automatic carousel loop in `app.js` that swaps classes:
```javascript
function initHeroCarousel() {
  const slides = document.querySelectorAll('.bg-slide');
  if (slides.length === 0) return;

  let currentIdx = 0;
  
  // Set first slide active
  slides[currentIdx].classList.add('active');

  setInterval(() => {
    slides[currentIdx].classList.remove('active');
    currentIdx = (currentIdx + 1) % slides.length;
    slides[currentIdx].classList.add('active');
  }, 8000); // Transitions every 8 seconds
}
```
*Note: This can be called at the bottom of the initialization routine in `app.js`.*

---

## 3. Mobile Responsiveness Strategy (Zero Layout Shifts)

Investigation of `style.css` revealed several layout shift and broken flow bugs across resolutions (from 320px up to 1920px). Here is the analysis and proposed strategy to fix them:

### Issue A: Viewport Height Shifting on Mobile (`style.css:24`)
- **Observation**: `.hero` section has `min-height: 100vh`. Mobile browsers (Chrome, Safari) resize the viewport when the address bar is toggled, causing sudden layout reflows and jumps.
- **Resolution**: Apply Dynamic Viewport Height (`100dvh`) with standard fallback:
  ```css
  .hero {
    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    ...
  }
  ```

### Issue B: Mode Toggle Switch Overflow on Narrow Screens (< 420px)
- **Observation**: `.mode-toggle-wrap` is set to `display: flex` horizontally. With buttons "Локальный (Быстрый)" and "Онлайн (TMDB)" requiring ~320px of total width, they overflow and break out of the 320px screen boundaries when placed side-by-side with the label "Режим поиска:".
- **Resolution**: Use vertical stacking on narrow devices using media queries:
  ```css
  @media(max-width: 440px) {
    .mode-toggle-wrap {
      flex-direction: column;
      gap: 0.6rem;
    }
    .mode-toggle {
      width: 100%;
      justify-content: center;
    }
    .mode-btn {
      flex: 1;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
  }
  ```

### Issue C: Film-Strip Marquee Bunches and Collides (`style.css:51-53`)
- **Observation**:
  ```css
  .film-strip span {
    display: inline-block;
    margin: 0 2rem;
    ...
    animation: marquee 30s linear infinite;
  }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  ```
  Since each `span` has a unique character length (e.g. "Паразиты" vs "Манчестер у моря"), translating each one by `-50%` of its own width moves them at different speed intervals, causing text to overlap, bunch up, and collide.
- **Resolution**: Wrap the marquee elements inside a scrolling inner container and animate the container instead. We double the span contents inside the HTML to create a seamless infinite track:
  - **HTML Modification**:
    ```html
    <div class="film-strip">
      <div class="film-strip-inner">
        <span>Паразиты</span><span>Манчестер у моря</span><span>Прочь</span><span>Жизнь Пи</span>
        <span>Она</span><span>Меланхолия</span><span>1917</span><span>Атака титанов</span>
        <span>Тихое место</span><span>Euphoria</span><span>Аркейн</span><span>Душа</span>
        <!-- Duplicated track for seamless loop -->
        <span>Паразиты</span><span>Манчестер у моря</span><span>Прочь</span><span>Жизнь Пи</span>
        <span>Она</span><span>Меланхолия</span><span>1917</span><span>Атака титанов</span>
        <span>Тихое место</span><span>Euphoria</span><span>Аркейн</span><span>Душа</span>
      </div>
    </div>
    ```
  - **CSS Modification**:
    ```css
    .film-strip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1;
      overflow: hidden;
      background: rgba(255,255,255,.03);
      border-top: 1px solid var(--border);
      padding: .6rem 0;
      display: flex;
    }
    .film-strip-inner {
      display: inline-flex;
      white-space: nowrap;
      animation: marqueeContinuous 35s linear infinite;
    }
    .film-strip-inner span {
      margin: 0 2rem;
      font-size: .75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .1em;
    }
    @keyframes marqueeContinuous {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }
    ```

### Issue D: Squeezed Main Card on Medium Screens (600px to 768px)
- **Observation**: Bending horizontal flexbox at `max-width: 600px` means that on screens around `650px` wide, the card body has to fit both a titles section and an 80px mood-ring side-by-side inside only 318px of net width. Long titles wrap excessively and look cluttered.
- **Resolution**: Adjust the breakpoint from `600px` to `768px` in `style.css` so that the transition from a horizontal card to a vertical layout happens earlier, giving tablet screens the benefit of clean, legible text layout.

---

## 4. Verification & Testing

Since this is a read-only investigation, the proposed code changes can be validated visually and programmatically using developer tools:
1. **Lighthouse / Web Vitals Audit**: Verify that the dynamic height (`100dvh`) and structural changes prevent Layout Shift (CLS) on device emulation.
2. **Responsive Simulation**: Emulate screens at 320px, 375px, 768px, 1024px, 1440px, and 1920px. Ensure the mode buttons fit correctly and do not overflow vertically or horizontally.
3. **Continuous Scroll Check**: Check that the marquee text flows continuously without jumps, gaps, or overlapping letters.
