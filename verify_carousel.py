import os
import re

def verify_carousel():
    app_js_path = "cinemood/app.js"
    if not os.path.exists(app_js_path):
        print("[FAIL] app.js not found")
        return False
        
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js = f.read()
        
    # Look for startCarousel function
    carousel_match = re.search(r'function startCarousel\(\)\s*\{([\s\S]*?)\n\}', app_js)
    if not carousel_match:
        print("[FAIL] startCarousel function not found")
        return False
        
    carousel_code = carousel_match.group(1)
    
    # Check if nextSlide.style.transform is set to scale(1.08)
    has_inline_scale = "nextSlide.style.transform = \"scale(1.08)\"" in carousel_code
    
    # Check if there is any code resetting nextSlide.style.transform
    clears_inline_scale = "nextSlide.style.transform = \"\"" in carousel_code or "nextSlide.style.transform = ''" in carousel_code
    
    print("=== CineMood Carousel Controller Auditor ===")
    print("Carousel code snippet:")
    print(carousel_code.strip())
    print("-" * 40)
    
    if has_inline_scale and not clears_inline_scale:
        print("[WARN] Ken Burns Animation Bug detected!")
        print("       The JavaScript sets 'nextSlide.style.transform = \"scale(1.08)\"' inline,")
        print("       but never clears it. Since inline styles have higher specificity than CSS classes,")
        print("       the class-based '.bg-slide.active { transform: scale(1.02); }' will be overridden.")
        print("       Subsequent slides will remain statically at scale(1.08) rather than animating to scale(1.02).")
        return False
    else:
        print("[PASS] Carousel inline styles are managed correctly.")
        return True

if __name__ == "__main__":
    verify_carousel()
