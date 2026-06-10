// ─── TMDB API LAYER ──────────────────────────────────────────────────────────
// Free API: https://www.themoviedb.org/settings/api  (register → get key)

const TMDB_BASE  = 'https://api.themoviedb.org/3';
const TMDB_IMG   = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY  = 'cinemood_cache';

// ── Genre IDs ──
const GENRE = {
  action:    28,  adventure: 12,  animation: 16,  comedy:  35,
  crime:     80,  drama:     18,  family:    10751, fantasy: 14,
  horror:    27,  music:     10402, mystery: 9648, romance: 10749,
  scifi:     878, thriller:  53,  western:   37,  war:     10752
};

const GENRE_ID_TO_RU = {
  28: 'экшен', 12: 'приключение', 16: 'мультфильм', 35: 'комедия',
  80: 'криминал', 18: 'драма', 10751: 'семейный', 14: 'фэнтези',
  27: 'хоррор', 10402: 'музыка', 9648: 'детектив', 10749: 'мелодрама',
  878: 'фантастика', 53: 'триллер', 37: 'вестерн', 10752: 'военный'
};

// ── Mood → genre IDs ──
const MOOD_TO_GENRES = {
  sad:     [GENRE.drama],
  heavy:   [GENRE.drama, GENRE.mystery],
  anxious: [GENRE.thriller, GENRE.horror, GENRE.mystery],
  angry:   [GENRE.thriller, GENRE.crime, GENRE.action],
  happy:   [GENRE.comedy, GENRE.romance, GENRE.adventure],
  warm:    [GENRE.family, GENRE.romance, GENRE.comedy],
  energy:  [GENRE.action, GENRE.crime, GENRE.adventure],
  wonder:  [GENRE.fantasy, GENRE.animation, GENRE.scifi],
  think:   [GENRE.drama, GENRE.scifi, GENRE.mystery],
  empty:   [GENRE.drama, GENRE.romance],
};

// ── Keywords → TMDB keyword IDs ──
const HOOK_KEYWORDS = {
  'одиночество': 4882,  'любовь':       9840,  'смерть': 10050,
  'семья':        10224, 'дружба':        18007, 'война':  12564,
  'психология':  9882,  'самопознание':  2341,  'будущее': 803,
  'ностальгия':  3234,  'детство':       10683, 'потеря': 11284,
  'месть':        9826,  'выживание':    161172, 'свобода': 1299,
};

// ── Certification → TMDB cert (US) ──
const AGE_TO_CERT = {
  '0+':  ['G', 'TV-Y', 'TV-G'],
  '6+':  ['G', 'PG', 'TV-Y', 'TV-G', 'TV-Y7'],
  '12+': ['G', 'PG', 'PG-13', 'TV-Y', 'TV-G', 'TV-Y7', 'TV-PG', 'TV-14'],
  '16+': ['G', 'PG', 'PG-13', 'R', 'TV-Y', 'TV-G', 'TV-Y7', 'TV-PG', 'TV-14'],
  '18+': ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR', 'TV-Y', 'TV-G', 'TV-Y7', 'TV-PG', 'TV-14', 'TV-MA'],
};

// ── Watch providers (region RU/US) by platform name ──
const PROVIDER_IDS = {
  netflix: 8, disney: 337, hbo: 384, apple: 350,
  crunchyroll: 283, okko: 494, kinopoisk: 553, amazon: 119
};

// ─── BUILD API PARAMS FROM QUIZ ANSWERS ──────────────────────────────────────

export function buildParams(answers) {
  const genreIds = new Set();
  const keywords = [];

  // Mood text analysis
  const moodText = [
    answers.mood_weather || '',
    answers.what_hooks || '',
    answers.last_feeling || ''
  ].join(' ').toLowerCase();

  // Detect mood categories
  const detect = (words) => words.some(w => moodText.includes(w));

  if (detect(['грустно','грустный','тяжело','больно','пусто','потеря','плохо','слезы','боль']))
    MOOD_TO_GENRES.sad.forEach(g => genreIds.add(g));
  if (detect(['тревог','страх','нервно','беспокой','напряж','неспокойно']))
    MOOD_TO_GENRES.anxious.forEach(g => genreIds.add(g));
  if (detect(['злость','зол','раздраж','кипит','несправедлив']))
    MOOD_TO_GENRES.angry.forEach(g => genreIds.add(g));
  if (detect(['весело','радост','хорошо','бодро','отлично','лёгко','тепло','улыбка']))
    MOOD_TO_GENRES.happy.forEach(g => genreIds.add(g));
  if (detect(['тепло','дом','семья','уют','нежност']))
    MOOD_TO_GENRES.warm.forEach(g => genreIds.add(g));
  if (detect(['энергия','драйв','движение','мощь','сила']))
    MOOD_TO_GENRES.energy.forEach(g => genreIds.add(g));
  if (detect(['чудо','магия','фантаз','волшебств','другой мир']))
    MOOD_TO_GENRES.wonder.forEach(g => genreIds.add(g));
  if (detect(['думать','смысл','философ','вопрос','осмыслить','понять']))
    MOOD_TO_GENRES.think.forEach(g => genreIds.add(g));

  // Intent override
  const intent = answers.escape_or_understand;
  if (intent === 'escape') {
    [GENRE.comedy, GENRE.adventure, GENRE.fantasy, GENRE.animation].forEach(g => genreIds.add(g));
  } else if (intent === 'understand') {
    [GENRE.drama, GENRE.mystery].forEach(g => genreIds.add(g));
  } else if (intent === 'energize') {
    [GENRE.action, GENRE.crime, GENRE.thriller].forEach(g => genreIds.add(g));
  } else if (intent === 'rest') {
    [GENRE.comedy, GENRE.romance, GENRE.animation].forEach(g => genreIds.add(g));
  }

  // Hook keywords
  const hooksText = (answers.what_hooks || '').toLowerCase();
  for (const [word, id] of Object.entries(HOOK_KEYWORDS)) {
    if (hooksText.includes(word)) keywords.push(id);
  }

  // Year range
  const yr = answers.year_range || { from: 2007, to: 2026 };

  // Excluded genres
  const excludeMap = {
    'хоррор': GENRE.horror, 'комедия': GENRE.comedy,
    'экшен': GENRE.action, 'фантастика': GENRE.scifi,
  };
  const excluded = Array.isArray(answers.exclude_genres) ? answers.exclude_genres : [];
  const excludedIds = excluded
    .filter(e => e !== 'none' && excludeMap[e])
    .map(e => excludeMap[e]);

  const finalGenres = [...genreIds].filter(g => !excludedIds.includes(g));
  // If nothing detected, use drama as default
  if (finalGenres.length === 0) finalGenres.push(GENRE.drama);

  return {
    genres: finalGenres.slice(0, 3), // TMDB: comma = AND, pipe = OR
    excludedGenres: excludedIds,
    keywords: keywords.slice(0, 3),
    yearFrom: yr.from,
    yearTo:   yr.to,
    contentType: answers.content_type || 'any',
    ageRating: answers.age_rating || 'any',
  };
}

// ─── FETCH FROM TMDB ─────────────────────────────────────────────────────────

export async function fetchRecommendations(answers, apiKey) {
  const params = buildParams(answers);

  // Cache check
  const cacheKey = CACHE_KEY + '_' + JSON.stringify(params);
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const results = [];
  const endpoints = resolveEndpoints(params);

  for (const ep of endpoints) {
    try {
      const url = buildUrl(ep, params, apiKey);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(resp.status);
      const data = await resp.json();
      const items = (data.results || []).slice(0, 8);
      results.push(...items.map(item => normalizeItem(item, ep.mediaType)));
    } catch(e) {
      console.warn('TMDB fetch failed:', e);
    }
  }

  // Deduplicate by id+type
  const seen = new Set();
  const unique = results.filter(r => {
    const k = r.type + r.tmdb_id;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // Score and sort
  const scored = unique.map(r => ({ ...r, score: moodScore(r, answers) }));
  scored.sort((a,b) => b.score - a.score);
  const top3 = scored.slice(0, 3);
  if (top3.length === 0) {
    throw new Error("No recommendations found from TMDB");
  }

  const output = {
    main: { ...top3[0], mood_match: clamp(top3[0]?.score || 70) },
    alts: top3.slice(1).map((r, i) => ({
      ...r, mood_match: clamp((top3[0]?.score || 70) - 8 - i * 5)
    }))
  };

  sessionStorage.setItem(cacheKey, JSON.stringify(output));
  return output;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function resolveEndpoints(params) {
  const ct = Array.isArray(params.contentType) ? params.contentType : [params.contentType || 'any'];
  if (ct.includes('any')) {
    return [
      { endpoint: '/discover/movie', mediaType: 'movie', extra: {} },
      { endpoint: '/discover/tv',    mediaType: 'tv',    extra: {} },
    ];
  }
  const endpoints = [];
  if (ct.includes('фильм')) {
    endpoints.push({ endpoint: '/discover/movie', mediaType: 'movie', extra: {} });
  }
  if (ct.includes('сериал')) {
    endpoints.push({ endpoint: '/discover/tv', mediaType: 'tv', extra: {} });
  }
  if (ct.includes('аниме')) {
    endpoints.push(
      { endpoint: '/discover/tv', mediaType: 'tv', extra: { with_keywords: '210024', with_origin_country: 'JP' } },
      { endpoint: '/discover/movie', mediaType: 'movie', extra: { with_keywords: '210024', with_origin_country: 'JP' } }
    );
  }
  if (ct.includes('мультфильм')) {
    endpoints.push({ endpoint: '/discover/movie', mediaType: 'movie', extra: { with_genres: '16' } });
  }
  if (ct.includes('мультсериал')) {
    endpoints.push({ endpoint: '/discover/tv', mediaType: 'tv', extra: { with_genres: '16' } });
  }
  return endpoints.length ? endpoints : [
    { endpoint: '/discover/movie', mediaType: 'movie', extra: {} },
    { endpoint: '/discover/tv',    mediaType: 'tv',    extra: {} },
  ];
}

function buildUrl(ep, params, apiKey) {
  const p = new URLSearchParams({
    api_key: apiKey,
    language: 'ru-RU',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 300,
    'vote_average.gte': 6.5,
    page: 1,
    ...ep.extra,
  });

  // Genres (OR logic for better results)
  if (params.genres.length && !ep.extra.with_genres) {
    p.set('with_genres', params.genres.join('|'));
  }

  // Exclude genres
  if (params.excludedGenres.length) {
    p.set('without_genres', params.excludedGenres.join(','));
  }

  // Year
  const isMovie = ep.mediaType === 'movie';
  if (params.yearFrom) p.set(isMovie ? 'primary_release_date.gte' : 'first_air_date.gte', params.yearFrom + '-01-01');
  if (params.yearTo)   p.set(isMovie ? 'primary_release_date.lte' : 'first_air_date.lte', params.yearTo + '-12-31');

  // Keywords
  if (params.keywords.length) p.set('with_keywords', params.keywords.join('|'));

  return `${TMDB_BASE}${ep.endpoint}?${p.toString()}`;
}

function normalizeItem(item, mediaType) {
  const isMovie = mediaType === 'movie';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const mappedGenres = item.genre_ids ? item.genre_ids.map(id => GENRE_ID_TO_RU[id]).filter(Boolean).slice(0, 3).join(', ') : '';
  return {
    tmdb_id:   item.id,
    title:     item.title || item.name || 'Без названия',
    year:      year,
    type:      isMovie ? 'фильм' : 'сериал',
    genre:     mappedGenres || (isMovie ? 'фильм' : 'сериал'),
    rating:    item.vote_average ? item.vote_average.toFixed(1) + ' TMDB' : '—',
    vote_average_raw: item.vote_average,
    why_template: generateWhy(item, mediaType),
    where:     'TMDB',
    poster_url: item.poster_path ? TMDB_IMG + item.poster_path : null,
    overview:  item.overview || '',
    tmdb_url:  `https://www.themoviedb.org/${mediaType}/${item.id}`,
    score:     0,
  };
}

function generateWhy(item, mediaType) {
  const desc = item.overview || '';
  if (desc.length > 20) {
    return desc.length > 200 ? desc.slice(0, 200) + '...' : desc;
  }
  return mediaType === 'movie'
    ? 'Этот фильм подобран под твоё текущее состояние на основе жанра и атмосферы.'
    : 'Этот сериал подобран под твоё текущее состояние на основе жанра и атмосферы.';
}

function moodScore(item, answers) {
  let score = (item.vote_average_raw || 7) * 3; // base from rating
  const text = (answers.mood_weather + ' ' + answers.what_hooks + ' ' + answers.last_feeling).toLowerCase();
  // Basic boost based on overview keyword match
  const ov = (item.overview || '').toLowerCase();
  ['любовь','семья','смерть','война','одиночество','дружба'].forEach(w => {
    if (text.includes(w) && ov.includes(w)) score += 10;
  });
  return score + Math.random() * 5;
}

function clamp(n) {
  return Math.max(60, Math.min(98, Math.round(n)));
}
