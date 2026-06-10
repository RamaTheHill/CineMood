import os
import re

INDEX_PATH = "/Users/ramathehill/CineMood/cinemood/index.html"
STYLE_PATH = "/Users/ramathehill/CineMood/cinemood/style.css"
APP_PATH = "/Users/ramathehill/CineMood/cinemood/app.js"

print("--- CineMood Milestone 1 Code Audit ---")

def test_index_html():
    print("\nAuditing index.html...")
    if not os.path.exists(INDEX_PATH):
        print("FAIL: index.html not found!")
        return False
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Preload checks
    preload_patterns = [
        r'<link\s+rel="preload"\s+as="image"\s+href="https://image\.tmdb\.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2\.jpg"\s*/?>',
        r'<link\s+rel="preload"\s+as="image"\s+href="https://image\.tmdb\.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD\.jpg"\s*/?>',
        r'<link\s+rel="preload"\s+as="image"\s+href="https://image\.tmdb\.org/t/p/original/mBaXZ95R2OxueZhvQbcEWy2DqyO\.jpg"\s*/?>'
    ]
    preloads_found = 0
    for pattern in preload_patterns:
        if re.search(pattern, content):
            preloads_found += 1
    print(f"Preloads found: {preloads_found}/3")
    
    # 2. First slide active
    first_active = re.search(r'<div\s+class="bg-slide\s+active"', content) is not None
    print(f"First slide active: {first_active}")
    
    # 3. Film strip track and duplicated text
    has_track = '<div class="film-strip-track">' in content
    print(f"Film strip track present: {has_track}")
    
    # Count occurrences of specific spans
    parasites_count = content.count("<span>Паразиты</span>")
    manchester_count = content.count("<span>Манчестер у моря</span>")
    print(f"Duplicated film spans (e.g. Parasites count: {parasites_count}, Manchester count: {manchester_count})")
    
    success = (preloads_found == 3) and first_active and has_track and (parasites_count >= 2)
    print("Result for index.html:", "PASS" if success else "FAIL")
    return success

def test_style_css():
    print("\nAuditing style.css...")
    if not os.path.exists(STYLE_PATH):
        print("FAIL: style.css not found!")
        return False
    with open(STYLE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Remove spacing/newlines for easier regex
    collapsed = re.sub(r'\s+', '', content)
    
    # 1. bg-slide style
    has_bg_slide = ".bg-slide{" in collapsed or ".bg-slide" in content
    has_opacity_transition = "opacity:0" in collapsed and "transition:" in collapsed and "will-change:" in collapsed
    print(f"bg-slide class check: {has_bg_slide} and opacity/transition/will-change check: {has_opacity_transition}")
    
    # 2. active bg-slide
    has_active_slide = ".bg-slide.active{" in collapsed
    has_active_props = "opacity:0.45" in collapsed and "transform:scale(1.02)" in collapsed
    print(f"bg-slide.active class check: {has_active_slide} and properties check: {has_active_props}")
    
    # 3. marquee transform translate3d(-50%,0,0) at 100%
    has_marquee_100 = "100%{transform:translate3d(-50%,0,0)}" in collapsed or "100%{transform:translate3d(-50%,0,0);}" in collapsed
    print(f"Marquee translate3d(-50%, 0, 0) at 100%: {has_marquee_100}")
    
    # 4. Hero min-height with dvh
    has_dvh = "min-height:100dvh" in collapsed
    print(f"Hero dynamic viewport height (100dvh): {has_dvh}")
    
    # 5. Media queries
    has_mq_768 = "@media(max-width:768px)" in collapsed or "@media (max-width: 768px)" in content
    has_mq_480 = "@media(max-width:480px)" in collapsed or "@media (max-width: 480px)" in content
    has_mq_h500 = "@media(max-height:500px)" in collapsed or "@media (max-height: 500px)" in content
    print(f"Media queries present: max-width 768px: {has_mq_768}, max-width 480px: {has_mq_480}, max-height 500px: {has_mq_h500}")
    
    success = has_opacity_transition and has_active_props and has_marquee_100 and has_dvh and has_mq_768 and has_mq_480 and has_mq_h500
    print("Result for style.css:", "PASS" if success else "FAIL")
    return success

def test_app_js():
    print("\nAuditing app.js...")
    if not os.path.exists(APP_PATH):
        print("FAIL: app.js not found!")
        return False
    with open(APP_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    collapsed = re.sub(r'\s+', '', content)
    
    # 1. Carousel controls: setInterval, clearInterval
    has_set_interval = "setInterval" in content
    has_clear_interval = "clearInterval" in content
    print(f"Carousel timer check: setInterval: {has_set_interval}, clearInterval: {has_clear_interval}")
    
    # 2. Page Visibility API
    has_visibility_listener = "visibilitychange" in content
    has_document_hidden = "document.hidden" in content
    print(f"Page Visibility check: visibilitychange: {has_visibility_listener}, document.hidden: {has_document_hidden}")
    
    # 3. window.scrollTo(0,0) in show function
    has_scroll_to = "window.scrollTo(0,0)" in collapsed or "window.scrollTo(0, 0)" in content
    print(f"Scroll-to-top on screen transition: {has_scroll_to}")
    
    success = has_set_interval and has_clear_interval and has_visibility_listener and has_document_hidden and has_scroll_to
    print("Result for app.js:", "PASS" if success else "FAIL")
    return success

all_pass = test_index_html() and test_style_css() and test_app_js()
print(f"\nFinal Audit Verdict: {'CLEAN' if all_pass else 'INTEGRITY VIOLATION / ISSUES FOUND'}")
