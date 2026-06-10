import re
import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_poster(title, year):
    # Free tutorial API key for TMDB
    api_key = "15d2ea6d0dc1d476efbca3eba2b9bbfb" 
    query = urllib.parse.quote(title)
    url = f"https://api.themoviedb.org/3/search/multi?api_key={api_key}&query={query}&language=ru-RU"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read())
            results = data.get("results", [])
            for res in results:
                # Basic check against year if available
                res_date = res.get("release_date") or res.get("first_air_date")
                if res_date and str(year) in res_date:
                    if res.get("poster_path"):
                        return f"https://image.tmdb.org/t/p/w500{res.get('poster_path')}"
            
            # Fallback to first result
            if results and results[0].get("poster_path"):
                return f"https://image.tmdb.org/t/p/w500{results[0].get('poster_path')}"
    except Exception as e:
        print(f"Error fetching {title}: {e}")
    return ""

with open("app.js", "r", encoding="utf-8") as f:
    app_js = f.read()

# Match each object in FILMS_DB
films_text = re.search(r'const FILMS_DB = \[([\s\S]*?)\];', app_js).group(1)
blocks = re.findall(r'\{[^{}]*\}', films_text)

updated_app_js = app_js
count = 0
for block in blocks:
    title_match = re.search(r'title:\s*"([^"]+)"', block)
    year_match = re.search(r'year:\s*(\d+)', block)
    if title_match and year_match:
        title = title_match.group(1)
        year = year_match.group(1)
        
        poster_url = fetch_poster(title, year)
        if poster_url:
            print(f"Found poster for {title}: {poster_url}")
            new_block = block.replace('exclude: []', f'exclude: [], poster_url: "{poster_url}"')
            updated_app_js = updated_app_js.replace(block, new_block)
            count += 1
        else:
            print(f"No poster found for {title}")

if count > 0:
    with open("app.js", "w", encoding="utf-8") as f:
        f.write(updated_app_js)
    print(f"Updated {count} movies with posters!")
