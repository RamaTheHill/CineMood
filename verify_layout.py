import os
import re

def check_marquee_bug():
    html_path = "cinemood/index.html"
    css_path = "cinemood/style.css"
    
    if not os.path.exists(html_path) or not os.path.exists(css_path):
        print("[FAIL] Source files not found")
        return False
        
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
        
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
        
    # Extract film strip spans
    track_match = re.search(r'<div class="film-strip-track">([\s\S]*?)</div>', html_content)
    if not track_match:
        print("[FAIL] film-strip-track not found in index.html")
        return False
        
    spans_content = track_match.group(1)
    spans = re.findall(r'<span>([^<]+)</span>', spans_content)
    
    if not spans:
        print("[FAIL] No movie spans found in film-strip-track")
        return False
        
    # Calculate track duplication
    unique_spans = set(spans)
    print(f"[INFO] Found {len(spans)} spans in total. Unique titles: {len(unique_spans)}")
    
    # Calculate estimated text width at 0.75rem (12px) font size in Inter (approx 7px per character)
    # Margin is 2rem (32px) left/right per span (64px gap between spans)
    total_char_len = sum(len(title) for title in spans)
    # Since they are duplicated, let's estimate one cycle (first half)
    half_count = len(spans) // 2
    first_half = spans[:half_count]
    
    cycle_chars = sum(len(title) for title in first_half)
    estimated_text_width = cycle_chars * 7 # 7px avg char width
    estimated_margin_width = half_count * 64 # 64px gap per span
    estimated_cycle_width = estimated_text_width + estimated_margin_width
    
    print(f"[INFO] Estimated width of one cycle: {estimated_cycle_width}px (Text: {estimated_text_width}px, Margins: {estimated_margin_width}px)")
    
    success = True
    if estimated_cycle_width < 1920:
        print(f"[WARN] Marquee Snapping Bug detected! One cycle width ({estimated_cycle_width}px) is less than 1920px.")
        print("       On a 1920px screen, translating by -50% will expose a blank gap of approx", 1920 - estimated_cycle_width, "px.")
        print("       This will cause a visible jump/snap when the keyframe animation resets.")
        success = False
    else:
        print("[PASS] Marquee width is sufficient for 1920px screens.")
        
    # Check for where watch links overflow
    where_row_match = re.search(r'\.card-where-row\s*\{([^}]*)\}', css_content)
    if where_row_match:
        rules = where_row_match.group(1)
        if "flex-wrap: wrap" not in rules:
            print("[WARN] Card where-row flex overflow hazard! '.card-where-row' does not have 'flex-wrap: wrap'.")
            print("       On mobile screens (320px-375px), long provider text and the TMDB link button")
            print("       will overflow and clip the boundaries of the card.")
            success = False
        else:
            print("[PASS] Card where-row flex-wrap rule is present.")
    else:
        print("[WARN] .card-where-row class not found in style.css")
        success = False

    return success

if __name__ == "__main__":
    print("=== CineMood Layout and Marquee Auditor ===")
    check_marquee_bug()
