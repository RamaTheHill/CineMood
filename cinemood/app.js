import { fetchRecommendations } from './api.js';

// ─── DATA ───────────────────────────────────────────────────────────────────

const FILMS_DB = [
  {
    title: "Манчестер у моря",
    year: 2016, type: "фильм", genre: "драма",
    rating: "7.8 IMDb", age_rating: "16+",
    mood_tags: ["грусть","тяжело","потеря","одиночество","тихо","пасмурно","осмыслить","понять"],
    why_template: "Этот фильм не пытается утешить — он сидит рядом с болью и не уходит. Если сейчас внутри что-то тяжёлое и ты хочешь, чтобы экран это признал — именно сюда. Он не даёт ответов, но ты перестаёшь чувствовать себя одиноким в своём состоянии.",
    where: "Кинопоиск, Amazon Prime", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/9h22dvN7LYIud5oUAurXXrfGHUS.jpg"
  },
  {
    title: "Паразиты",
    year: 2019, type: "фильм", genre: "триллер, сатира",
    rating: "8.5 IMDb", age_rating: "18+",
    mood_tags: ["напряжение","злость","несправедливость","интерес","жара","взрыв","понять","острее"],
    why_template: "Если что-то внутри кипит — этот фильм не успокоит, он усилит и даст выход. Бон Джун-хо снял злость на мир так точно, что после сеанса становится легче — не потому что всё решилось, а потому что тебя услышали.",
    where: "Кинопоиск, Apple TV+", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/9xL2PwIOerz8jld06J9cxwuJfoD.jpg"
  },
  {
    title: "Меланхолия",
    year: 2011, type: "фильм", genre: "драма, фантастика",
    rating: "7.2 IMDb", age_rating: "16+",
    mood_tags: ["тревога","пустота","конец","депрессия","тихо","пасмурно","осмыслить","одиночество"],
    why_template: "Для состояния, когда слова не подходят — только образы. Триер снял тревогу и предчувствие конца так красиво, что смотришь это почти как медитацию. Странно, но становится легче — твоё состояние вдруг обретает форму.",
    where: "YouTube (аренда), Okko", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/2OyiI4iuHLcDNm2KJFg3W6fyDfs.jpg"
  },
  {
    title: "Прочь",
    year: 2017, type: "фильм", genre: "триллер, хоррор",
    rating: "7.7 IMDb", age_rating: "16+",
    mood_tags: ["напряжение","тревога","недоверие","злость","чужой","опасность","понять"],
    why_template: "Если сейчас есть ощущение, что окружение не то, что кажется — этот фильм резонирует на уровне нервной системы. Джордан Пил превратил социальную тревогу в физическое ощущение. После него многое проясняется.",
    where: "Netflix, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/4Jysc15DPKSyWWYByDaXVv3Y6rn.jpg"
  },
  {
    title: "Она",
    year: 2013, type: "фильм", genre: "драма, романтика",
    rating: "8.0 IMDb", age_rating: "12+",
    mood_tags: ["одиночество","нежность","поиск","тоска","тепло","связь","понять","город"],
    why_template: "Для состояния нежного одиночества — когда хочется близости, но настоящей близости нет. Спайк Джонз снял это с такой точностью, что во время просмотра чувствуешь себя менее одиноким — парадоксально, но это работает.",
    where: "Netflix, Okko", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/3Pnkt6NcB7Xc6cDftTBAF6gIzC6.jpg"
  },
  {
    title: "Жизнь Пи",
    year: 2012, type: "фильм", genre: "драма, приключение",
    rating: "7.9 IMDb", age_rating: "6+",
    mood_tags: ["поиск","смысл","красиво","потеря","вера","путешествие","надежда","тепло"],
    why_template: "Когда хочется красоты и чего-то большего, чем обыденность. Этот фильм говорит о выживании и смысле через абсолютно прекрасные образы — после него остаётся ощущение, что жизнь глубже, чем кажется.",
    where: "Disney+, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/sKfOdwKRDoVROHg9B7suyKM82I9.jpg"
  },
  {
    title: "Безумно богатые азиаты",
    year: 2018, type: "фильм", genre: "комедия, романтика",
    rating: "6.9 IMDb", age_rating: "12+",
    mood_tags: ["весело","отдохнуть","лёгко","компания","праздник","тепло","улыбка"],
    why_template: "Для вечера, когда хочется ярко, легко и с удовольствием — без лишних вопросов к себе. Блестящий, стильный, искренний. Поднимает настроение без единой фальши.",
    where: "Netflix, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/1g2UNIgEIwvoPCnoUQoetppJW1h.jpg"
  },
  {
    title: "Тихое место",
    year: 2018, type: "фильм", genre: "хоррор, драма",
    rating: "7.5 IMDb", age_rating: "12+",
    mood_tags: ["напряжение","тревога","семья","молчание","выживание","страх","понять"],
    why_template: "Когда тревога внутри уже есть — этот фильм выносит её наружу, даёт ей форму и структуру. После просмотра своя тревога кажется чуть более управляемой. Плюс — это очень сделанное кино.",
    where: "Кинопоиск, Amazon Prime", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/b6MMVZWO7LPITq9XS5a4R22CZjG.jpg"
  },
  {
    title: "Любовь",
    year: 2015, type: "фильм", genre: "драма, эротика",
    rating: "6.1 IMDb", age_rating: "18+",
    mood_tags: ["тоска","потеря","страсть","ностальгия","боль","воспоминания","одиночество"],
    why_template: "Гаспар Ноэ снял тоску по любви так физически и честно, что больно смотреть — но именно это и нужно иногда. Для состояния, когда хочешь прожить что-то острое, а не убежать от него.",
    where: "Mubi, YouTube (аренда)", audience: "solo", exclude: ["дети"], poster_url: "https://image.tmdb.org/t/p/w500/t9IR4jY9EJmh3WTvJ4hd6F8bWpW.jpg"
  },
  {
    title: "Дикая",
    year: 2014, type: "фильм", genre: "драма, приключение",
    rating: "7.1 IMDb", age_rating: "16+",
    mood_tags: ["поиск","перемены","одиночество","природа","путь","потеря","себя","вперёд"],
    why_template: "Для момента, когда хочется уйти и начать заново — но страшно. Этот фильм про то, как человек идёт сквозь свою боль буквально — и находит что-то важное. Мощный и тихий одновременно.",
    where: "Okko, YouTube (аренда)", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/1Nnc1NgUJpE6ANPwB3yodjA3N7B.jpg"
  },
  {
    title: "Тайное окно",
    year: 2004, type: "фильм", genre: "триллер, психологический",
    rating: "6.8 IMDb", age_rating: "12+",
    mood_tags: ["тревога","напряжение","одиночество","изоляция","психика","странно","понять"],
    why_template: "Напряжённый, умный, неочевидный. Для состояния, когда хочется что-то острое, но не пустое — фильм держит в голове ещё долго после финала.",
    where: "Кинопоиск, Amazon Prime", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/diBN05oonizXuF3VDnrO2F45XIK.jpg"
  },
  {
    title: "Волк с Уолл-стрит",
    year: 2013, type: "фильм", genre: "комедия, биография",
    rating: "8.2 IMDb", age_rating: "18+",
    mood_tags: ["энергия","весело","драйв","много","шумно","компания","мощь","движение"],
    why_template: "Когда нужен заряд без остановок — три часа безумного темпа, харизмы и жизни на полную. Скорсезе снял это так, что ты выходишь с желанием что-то делать.",
    where: "Netflix, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/ihlWMaVZVXFzxU5wwZnbHJZ7Zpx.jpg"
  },
  {
    title: "Всё везде и сразу",
    year: 2022, type: "фильм", genre: "фантастика, комедия, драма",
    rating: "7.8 IMDb", age_rating: "16+",
    mood_tags: ["хаос","поиск","смысл","семья","много","странно","взрыв","нежность","любовь"],
    why_template: "Для состояния когда всё сложно и непонятно — этот фильм превращает хаос в нечто прекрасное. Он говорит: даже в самом абсурдном существовании есть смысл любить. Сложно не заплакать.",
    where: "Netflix, Amazon Prime", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/oFiudghfudYUtW3yHgvv82xgoXP.jpg"
  },
  {
    title: "Настоящий детектив",
    year: 2014, type: "сериал", genre: "криминал, драма",
    rating: "9.0 IMDb", age_rating: "18+",
    mood_tags: ["мрак","философия","одиночество","вопросы","ночь","тяжело","понять","глубина"],
    why_template: "Для состояния, когда хочется чего-то тёмного и умного — этот сериал думает вместе с тобой о природе зла, смысла и человеческой боли. Первый сезон — один из лучших когда-либо снятых.",
    where: "Max (HBO), Okko", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/dHqKLovbM9GT0fkwtL5ew5SPtmk.jpg"
  },
  {
    title: "Чёрное зеркало",
    year: 2011, type: "сериал", genre: "антология, sci-fi",
    rating: "8.8 IMDb", age_rating: "16+",
    mood_tags: ["тревога","технологии","будущее","странно","осмыслить","вопросы","одиночество"],
    why_template: "Когда хочется думать и немного бояться — умнейшая антология о том, куда мы идём. Каждая серия — отдельный мир, идеально для вечера без обязательств досматривать.",
    where: "Netflix", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/usjxU1cyXk9FDVCJFwIT01iCLty.jpg"
  },
  {
    title: "Euphoria",
    year: 2019, type: "сериал", genre: "драма",
    rating: "8.4 IMDb", age_rating: "18+",
    mood_tags: ["яркость","боль","молодость","тревога","поиск","ночь","интенсивно","красиво"],
    why_template: "Для состояния, где красота и боль живут рядом. Это не развлечение — это опыт. Если сейчас внутри что-то острое и живое — этот сериал это признаёт и усиливает, как увеличительное стекло.",
    where: "Max (HBO), Okko", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/yJz0VPfztciUt8cYulEOnk7wQhs.jpg"
  },
  {
    title: "Тед Лассо",
    year: 2020, type: "сериал", genre: "комедия, спорт",
    rating: "8.8 IMDb", age_rating: "12+",
    mood_tags: ["тепло","улыбка","доброта","отдохнуть","лёгко","команда","надежда","позитив"],
    why_template: "Когда хочется тепла без слащавости — это редкое попадание. Добрый, умный, смешной. Для вечеров когда надо просто выдохнуть и почувствовать, что люди бывают хорошими.",
    where: "Apple TV+", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/htV1GTyatTXJB589hjiqUQPegjd.jpg"
  },
  {
    title: "Белый лотос",
    year: 2021, type: "сериал", genre: "сатира, драма",
    rating: "7.8 IMDb", age_rating: "18+",
    mood_tags: ["ирония","напряжение","богатство","скука","компания","отдых","острее","людей"],
    why_template: "Блестящая сатира на людей с деньгами и проблемами, которые они сами себе создают. Для состояния лёгкого цинизма — наблюдать за чужими катастрофами с бокалом в руке.",
    where: "Max (HBO), Okko", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/m50tjkb2PuvVmGHifRpVXCMswxn.jpg"
  },
  {
    title: "Острые козырьки",
    year: 2013, type: "сериал", genre: "криминал, драма",
    rating: "8.8 IMDb", age_rating: "18+",
    mood_tags: ["мощь","драйв","воля","тёмно","амбиции","история","напряжение","энергия"],
    why_template: "Когда нужен персонаж, который не сдаётся ни при каких обстоятельствах. Томас Шелби — это сила воли в чистом виде. Для состояния, когда нужен пример того, как идти вперёд.",
    where: "Netflix", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/pVJzfWgb3sHN29hLaiI5jmBN9vx.jpg"
  },
  {
    title: "Унесённые призраками",
    year: 2001, type: "аниме", genre: "аниме, фэнтези, приключение",
    rating: "8.6 IMDb", age_rating: "6+",
    mood_tags: ["чудо","детство","мягко","тепло","побег","сказка","красиво","волшебство"],
    why_template: "Для момента, когда хочется полностью уйти в другой мир — добрый, загадочный, прекрасный. Миядзаки снял это для детей, но взрослые выходят с мокрыми глазами. Чистая магия.",
    where: "Netflix, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/uANcal3l15d0rFb5fTXhCAhSold.jpg"
  },
  {
    title: "Твоё имя",
    year: 2016, type: "аниме", genre: "аниме, романтика, фэнтези",
    rating: "8.4 IMDb", age_rating: "12+",
    mood_tags: ["тоска","красиво","любовь","потеря","чудо","нежность","поиск","связь"],
    why_template: "Для состояния, когда хочется что-то красивое и пронзительное — этот фильм попадает прямо в сердце. Макото Синкай снял ностальгию и тягу к близкому человеку так точно, что слёзы приходят сами.",
    where: "Кинопоиск, Netflix", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/iH2WDCYLIUjc7oPWRT7Kxgxza6k.jpg"
  },
  {
    title: "Атака титанов",
    year: 2013, type: "аниме", genre: "аниме, фэнтези, экшен, драма",
    rating: "9.0 IMDb", age_rating: "18+",
    mood_tags: ["напряжение","мощь","драйв","тьма","выживание","злость","борьба","вопросы"],
    why_template: "Для состояния, когда нужно что-то мощное и не пустое — этот сериал про борьбу против невозможного захватывает полностью. За экшеном скрывается глубокая история о свободе и природе зла.",
    where: "Кинопоиск, Crunchyroll", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/9whSxgqSW7dPIIMJyM4WG3BYVo7.jpg"
  },
  {
    title: "Душа",
    year: 2020, type: "мультфильм", genre: "мультфильм, драма, фэнтези",
    rating: "8.1 IMDb", age_rating: "6+",
    mood_tags: ["смысл","поиск","жизнь","тепло","красиво","музыка","вопросы","нежность"],
    why_template: "Для момента, когда задаёшься вопросом зачем всё это — Pixar ответил честнее, чем большинство серьёзных фильмов. Смотришь как мультик, выходишь с новым взглядом на обычные дни.",
    where: "Disney+, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/jZkksyMZdTYw7fIVKyA95nFEPnt.jpg"
  },
  {
    title: "Головоломка",
    year: 2015, type: "мультфильм", genre: "мультфильм, комедия, драма",
    rating: "8.1 IMDb", age_rating: "6+",
    mood_tags: ["грусть","эмоции","детство","перемены","потеря","тепло","поиск","нежность"],
    why_template: "Когда эмоции сложно разобрать — этот мультфильм делает это буквально. Pixar показал, что грусть — не враг, а важная часть тебя. После просмотра становится мягче к себе.",
    where: "Disney+, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/8wukxopBFO2Vrf50jlLpbrfj4OB.jpg"
  },
  {
    title: "Аркейн",
    year: 2021, type: "мультсериал", genre: "мультсериал, фэнтези, экшен, драма",
    rating: "9.0 IMDb", age_rating: "16+",
    mood_tags: ["мощь","красиво","боль","семья","борьба","тьма","сестры","напряжение"],
    why_template: "Один из красивейших анимационных сериалов когда-либо. Для состояния, когда хочется визуально мощного и эмоционально глубокого — это попадание в десятку. Особенно если важна тема отношений между близкими.",
    where: "Netflix", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/kVioUjk1SXGWblJNaKsIJcBqUcY.jpg"
  },
  {
    title: "Гравити Фолс",
    year: 2012, type: "мультсериал", genre: "мультсериал, приключение, комедия, мистика",
    rating: "8.9 IMDb", age_rating: "6+",
    mood_tags: ["чудо","детство","тайна","тепло","приключение","лето","улыбка","семья"],
    why_template: "Для состояния, когда хочется лёгкости и ощущения детского восторга — этот сериал работает в любом возрасте. Умный, тёплый, немного страшный — идеально для вечера с выдохом.",
    where: "Disney+, Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/oizbK0XcWO0AKQuTEH5suEJqfZ7.jpg"
  },

  // ── СНГ / СОВЕТСКОЕ КИНО ─────────────────────────────────────────────────
  {
    title: "Кин-дза-дза!",
    year: 1986, type: "фильм", genre: "фантастика, комедия, абсурд",
    rating: "8.5 IMDb", age_rating: "6+", region: "cis",
    mood_tags: ["абсурд","философия","странно","ирония","путешествие","смысл","пустота","вопросы"],
    why_template: "Один из самых странных и умных советских фильмов. Данелия снял притчу об абсурдности иерархии и человеческой природы — и это до сих пор актуально. Если хочется чего-то, что не похоже ни на что другое — это оно.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/wBEwCZODMBz9oiPzJo3Qt1awyxr.jpg"
  },
  {
    title: "Сталкер",
    year: 1979, type: "фильм", genre: "драма, фантастика, философия",
    rating: "8.1 IMDb", age_rating: "12+", region: "cis",
    mood_tags: ["философия","пустота","тишина","смысл","вопросы","вера","мрак","глубина"],
    why_template: "Тарковский снял медитацию о вере, надежде и природе желания. Смотреть в состоянии, когда хочется тишины и настоящей глубины. Один из самых важных фильмов в истории кино.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/mzJxTxIODATNaYUwyJ2C2XPkhXW.jpg"
  },
  {
    title: "Зеркало",
    year: 1975, type: "фильм", genre: "драма, биография, лирика",
    rating: "8.1 IMDb", age_rating: "12+", region: "cis",
    mood_tags: ["ностальгия","детство","потеря","память","тоска","тихо","осмыслить","мать"],
    why_template: "Тарковский сплёл воспоминания, сны и историю в одно. Если сейчас внутри что-то из прошлого — этот фильм его поднимет и даст имя. Требует внимания, но отдаёт глубиной.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/hLzhdirfOApuoXoS8SnGNotu1bf.jpg"
  },
  {
    title: "Возвращение",
    year: 2003, type: "фильм", genre: "драма, психологический",
    rating: "7.9 IMDb", age_rating: "12+", region: "cis",
    mood_tags: ["отец","молчание","напряжение","тайна","одиночество","понять","взросление","страх"],
    why_template: "Звягинцев дебютировал с фильмом о молчании между отцом и сыновьями — тяжёлом, необъяснимом, настоящем. Для состояния, когда что-то важное висит в воздухе, но не произносится.",
    where: "Кинопоиск, YouTube (аренда)", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/qE6vQOOiHfNNdz3bjpzO11QNnPP.jpg"
  },
  {
    title: "Левиафан",
    year: 2014, type: "фильм", genre: "драма",
    rating: "7.6 IMDb", age_rating: "18+", region: "cis",
    mood_tags: ["несправедливость","злость","система","бессилие","Россия","пить","тяжело","понять"],
    why_template: "Звягинцев снял Россию такой, какая она есть — без прикрас и с горечью. Если сейчас что-то кипит по отношению к системе или несправедливости — этот фильм будет как разговор.",
    where: "Кинопоиск, YouTube (аренда)", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/dPAvJdASE9tAtHhwlX1bFQN54aG.jpg"
  },
  {
    title: "Нелюбовь",
    year: 2017, type: "фильм", genre: "драма, триллер",
    rating: "7.8 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["одиночество","семья","холод","потеря","пустота","равнодушие","боль","понять"],
    why_template: "Самый холодный фильм Звягинцева — про людей, которые перестали чувствовать рядом. Если сейчас есть ощущение эмоционального отчуждения — он назовёт это словами.",
    where: "Кинопоиск, Okko", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/3lzTMR045BOYfZoQQVaINtKYnei.jpg"
  },
  {
    title: "Аритмия",
    year: 2017, type: "фильм", genre: "драма, романтика",
    rating: "7.5 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["усталость","работа","отношения","любовь","Россия","тепло","настоящее","жизнь"],
    why_template: "Хлебников снял обычную жизнь обычных людей так точно, что смотришь как в зеркало. Врач скорой помощи и его жена — про усталость, любовь и попытку не сломаться. Очень настоящий.",
    where: "Кинопоиск, YouTube (аренда)", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/mvIswmr0ucVPzMYU9VIOw2vW4aB.jpg"
  },
  {
    title: "Дылда",
    year: 2019, type: "фильм", genre: "драма, война",
    rating: "7.0 IMDb", age_rating: "18+", region: "cis",
    mood_tags: ["травма","боль","женщины","выживание","тихо","послевоенное","тяжело","красиво"],
    why_template: "Балагов снял фильм о женщинах после Второй мировой — через тело, молчание и близость. Очень тяжёлый, но снятый с такой нежностью, что невозможно оторваться.",
    where: "Кинопоиск, Мubi", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/2dFUoGaxwS0eXjD3CDFyz9KQijB.jpg"
  },
  {
    title: "Брат",
    year: 1997, type: "фильм", genre: "криминал, драма",
    rating: "7.9 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["90е","Россия","одиночество","сила","музыка","улицы","культ","настоящее"],
    why_template: "Балабанов поймал дух 90-х точнее всех. Данила Багров — архетип человека, который ищет себя в распадающемся мире. Если хочется что-то настоящее и русское — сюда.",
    where: "Кинопоиск, YouTube (бесплатно)", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/gCnIuwpr8Vde5Rr30SYRvQbgNZY.jpg"
  },
  {
    title: "Брат 2",
    year: 2000, type: "фильм", genre: "криминал, приключение",
    rating: "8.1 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["90е","Россия","американская мечта","справедливость","музыка","энергия","культ","дружба"],
    why_template: "Ещё более культовый сиквел — Балабанов отправил Данилу в Америку и получил один из главных русских фильмов вообще. Смешной, дерзкий и очень точный про русский взгляд на мир.",
    where: "Кинопоиск, YouTube (бесплатно)", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/x6iASprSv0kKxcEKZAqjzN6aNDS.jpg"
  },
  {
    title: "Иван Васильевич меняет профессию",
    year: 1973, type: "фильм", genre: "комедия, фантастика",
    rating: "8.6 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["весело","смех","классика","советское","лёгко","компания","путаница","ностальгия"],
    why_template: "Абсолютная классика советской комедии — Гайдай снял это блестяще. Для вечера, когда хочется хохотать без остановки и ни о чём не думать. Работает в любом возрасте.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/bSbkw1HDPRfk4w5bdajsZvBhVzr.jpg"
  },
  {
    title: "Операция «Ы» и другие приключения Шурика",
    year: 1965, type: "фильм", genre: "комедия",
    rating: "8.7 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["весело","смех","советское","классика","лёгко","компания","ностальгия","простота"],
    why_template: "Гайдай снял три новеллы, каждая из которых — маленький шедевр комедии. Бесценно для вечера, когда хочется просто смеяться — без иронии, без подтекста, от души.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/UObZrxhJklRmaOepUS9iTs9x4f.jpg"
  },
  {
    title: "Служебный роман",
    year: 1977, type: "фильм", genre: "комедия, романтика",
    rating: "8.5 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["тепло","романтика","советское","офис","улыбка","ностальгия","нежность","превращение"],
    why_template: "Рязанов снял идеальный романтический фильм — тёплый, человечный, смешной. Для состояния, когда хочется мягко и с нежностью — это классика, которая не стареет.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/nkUrlg5X2dLL5t2huJOPZfLr3S6.jpg"
  },
  {
    title: "Мимино",
    year: 1977, type: "фильм", genre: "комедия, драма",
    rating: "8.4 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["тепло","ностальгия","дом","дружба","грузия","советское","мечта","лёгко"],
    why_template: "Данелия снял историю грузинского лётчика — смешную, нежную и немного грустную. Про мечту и то, что дом всегда важнее амбиций. Один из самых обаятельных советских фильмов.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/61reasUU2uxRFQhxfKdvVHHMOsl.jpg"
  },
  {
    title: "Тени забытых предков",
    year: 1965, type: "фильм", genre: "драма, фольклор",
    rating: "8.0 IMDb", age_rating: "12+", region: "cis",
    mood_tags: ["красиво","любовь","потеря","народное","Украина","природа","магия","трагедия"],
    why_template: "Параджанов снял визуальную поэму о карпатских гуцулах — каждый кадр как картина. Если хочется кино как искусство — редкая, завораживающая работа.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/iUZMsGuxq6QkSabTqfgC66EMqxx.jpg"
  },
  {
    title: "Купе номер 6",
    year: 2021, type: "фильм", genre: "драма, роуд-муви",
    rating: "7.4 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["одиночество","путешествие","случайная встреча","Россия","поезд","нежность","тепло","поиск"],
    why_template: "Финско-российский фильм про поездку в плацкарте — неловкую, живую, настоящую. Для состояния, когда хочется чего-то тёплого и человеческого без лишних объяснений.",
    where: "Кинопоиск, Okko", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/3RJDvZuYXjXTkAJgJIZyETEajsF.jpg"
  },
  {
    title: "Майор",
    year: 2013, type: "фильм", genre: "криминал, драма",
    rating: "7.4 IMDb", age_rating: "18+", region: "cis",
    mood_tags: ["несправедливость","система","моральный выбор","напряжение","Россия","вина","тяжело","честность"],
    why_template: "Быков снял клаустрофобную притчу о моральном выборе в системе, где правил нет. Короткий, жёсткий, точный. Для состояния, когда думаешь о том, что правильно, а что нет.",
    where: "Кинопоиск, YouTube (аренда)", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/k79CTNBkj6W0cJg70SwO2ogw0dk.jpg"
  },
  {
    title: "Игла",
    year: 1988, type: "фильм", genre: "криминал, драма",
    rating: "7.2 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["культ","Цой","музыка","90е","одиночество","Казахстан","наркотики","прохлада"],
    why_template: "Культовый казахский фильм с Виктором Цоем в главной роли. Холодный, стильный, меланхоличный — и саундтрек Кино делает его отдельным переживанием.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/uGGc1wC5cD9rVRBMTII5LGZLd5A.jpg"
  },
  {
    title: "Ирония судьбы, или С лёгким паром!",
    year: 1975, type: "фильм", genre: "комедия, романтика",
    rating: "8.3 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["новый год","тепло","ностальгия","романтика","советское","лёгко","смех","уют"],
    why_template: "Рязанов снял идеальный новогодний фильм — тёплый, абсурдный и невероятно добрый. Смотрится в любое время года, но особенно когда хочется ощущения уюта и простого счастья.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/oqAwCig5JzaX896QImeVZCXXcpG.jpg"
  },
  {
    title: "Интердевочка",
    year: 1989, type: "фильм", genre: "драма",
    rating: "7.5 IMDb", age_rating: "16+", region: "cis",
    mood_tags: ["перестройка","женщина","выживание","западная мечта","одиночество","цена","80е","Россия"],
    why_template: "Тодоровский снял историю позднесоветской эпохи через судьбу женщины, ищущей выход. Редкий для своего времени откровенный разговор о выборе, цене и иллюзиях.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "solo", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/nUi1vuuemOgSehUzyLixUyt3m7C.jpg"
  },

  // ── СОВЕТСКАЯ И РОССИЙСКАЯ АНИМАЦИЯ ───────────────────────────────────────
  {
    title: "Ёжик в тумане",
    year: 1975, type: "мультфильм", genre: "мультфильм, философия, лирика",
    rating: "9.0 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["туман","одиночество","тихо","чудо","смысл","детство","медитация","мягко"],
    why_template: "Норштейн создал 10 минут чистой поэзии. Признан лучшим мультфильмом всех времён. Для состояния, когда хочется тишины и чего-то настоящего — ничего лучше не существует.",
    where: "YouTube (бесплатно)", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/tfo5BSZG7YGiwsUXA3U3i7T7IqQ.jpg"
  },
  {
    title: "Трое из Простоквашино",
    year: 1978, type: "мультфильм", genre: "мультфильм, комедия, семья",
    rating: "9.1 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["детство","тепло","советское","дом","смех","ностальгия","лёгко","семья"],
    why_template: "Советская анимация в лучшем виде — умная, добрая, смешная. Матроскин, Шарик и дядя Фёдор — одни из самых любимых персонажей нескольких поколений. Чистый уют.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/zfrH8FWjSfAuhZl4y22nxjpg7s1.jpg"
  },
  {
    title: "Ну, погоди!",
    year: 1969, type: "мультсериал", genre: "мультсериал, комедия",
    rating: "8.9 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["весело","советское","детство","смех","классика","ностальгия","лёгко","компания"],
    why_template: "Каждая серия — маленький шедевр советской анимации. Волк и Заяц — про вечную погоню, которая никогда не надоедает. Идеально для вечера, когда хочется просто улыбнуться.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/evPwhhd8nnlLEaKlj35HtWDPOLk.jpg"
  },
  {
    title: "Чебурашка и крокодил Гена",
    year: 1969, type: "мультфильм", genre: "мультфильм, семья, дружба",
    rating: "8.7 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["одиночество","дружба","тепло","детство","советское","нежность","принятие","простота"],
    why_template: "История существа, которое не знает кто оно такое и ищет друга — удивительно точная для любого возраста. Для момента, когда хочется тепла и ощущения принятия.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/kw6UmmvqYnaPIdw24WoD83Akfod.jpg"
  },
  {
    title: "Малыш и Карлсон",
    year: 1968, type: "мультфильм", genre: "мультфильм, комедия, фэнтези",
    rating: "8.5 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["детство","фантазия","тепло","смех","одиночество","воображение","дружба","советское"],
    why_template: "Советская экранизация Астрид Линдгрен — одна из лучших. Карлсон говорит фразы, которые помнят наизусть. Для состояния, когда хочется что-то по-настоящему доброе и смешное.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/qVTlkbENYeBSKZ2SLX2WqogdeUz.jpg"
  },
  {
    title: "Падал прошлогодний снег",
    year: 1983, type: "мультфильм", genre: "мультфильм, абсурд, комедия",
    rating: "8.7 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["абсурд","смех","советское","ирония","детство","странно","весело","простота"],
    why_template: "13 минут чистого советского абсурда — мужик идёт за ёлкой, а возвращается ни с чем. Культовый мультфильм, смешной на любом уровне. Идеально когда хочется абсурдного юмора.",
    where: "YouTube (бесплатно)", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/xEpK6mFiqpWl7zf5SeFBEd8A8ne.jpg"
  },
  {
    title: "Тайна третьей планеты",
    year: 1981, type: "мультфильм", genre: "мультфильм, фантастика, приключение",
    rating: "8.4 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["космос","приключение","детство","советское","фантастика","загадка","тепло","чудо"],
    why_template: "Шедевр советской фантастической анимации по Киру Булычёву. Алиса Селезнёва и её папа исследуют галактику — красочно, умно и с настоящей атмосферой. Ностальгия чистой воды.",
    where: "YouTube (бесплатно), Кинопоиск", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/7ICu6SPJBMuWixymqtRIIBvc55S.jpg"
  },
  {
    title: "Алиса в Зазеркалье (Союзмультфильм)",
    year: 1982, type: "мультфильм", genre: "мультфильм, фэнтези, абсурд",
    rating: "8.2 IMDb", age_rating: "0+", region: "cis",
    mood_tags: ["абсурд","чудо","советское","детство","странно","логика","сказка","воображение"],
    why_template: "Советская экранизация Кэрролла — странная, лиричная и очень авторская. Идеально для состояния, когда хочется погрузиться в мир, где логика не работает, а сны становятся реальностью.",
    where: "YouTube (бесплатно)", audience: "any", exclude: [], poster_url: "https://image.tmdb.org/t/p/w500/gYVNpaKMljE4PBxA7mDVGwPLig7.jpg"
  }
];

// ─── QUIZ STEPS ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "mood_weather",
    type: "text",
    emoji: "🌤",
    question: "Твоё настроение сейчас — как погода. Опиши её.",
    hint: "Пасмурно? Штиль? Гроза? Жарко без ветра? Как угодно, в одном предложении."
  },
  {
    id: "escape_or_understand",
    type: "options",
    emoji: "🧭",
    question: "Что тебе сейчас нужнее от фильма?",
    hint: "",
    options: [
      { icon: "✈️", label: "Убежать", sub: "Отвлечься, выдохнуть, не думать", value: "escape" },
      { icon: "🔍", label: "Понять", sub: "Осмыслить, прожить, разобраться", value: "understand" },
      { icon: "⚡", label: "Зарядиться", sub: "Получить энергию и драйв", value: "energize" },
      { icon: "🌙", label: "Просто побыть", sub: "Тихо, без усилий, фон", value: "rest" }
    ]
  },
  {
    id: "what_hooks",
    type: "text",
    emoji: "🪝",
    question: "Что последнее время цепляет тебя — темы, образы, мысли?",
    hint: "Например: отношения, одиночество, деньги, смерть, свобода, будущее, прошлое..."
  },
  {
    id: "alone_or_together",
    type: "options",
    emoji: "👥",
    question: "Будешь смотреть один или с кем-то?",
    hint: "",
    options: [
      { icon: "🧘", label: "Один", sub: "Полное погружение", value: "solo" },
      { icon: "❤️", label: "С партнёром", sub: "Вдвоём на диване", value: "partner" },
      { icon: "🍿", label: "С компанией", sub: "Друзья, семья", value: "group" }
    ]
  },
  {
    id: "last_feeling",
    type: "text",
    emoji: "💬",
    question: "Последнее ощущение от фильма или сериала — каким оно было?",
    hint: "Может, пусто? Тепло? Долго думал? Не зацепило вообще? Плакал?"
  },
  // FILTERS
  {
    id: "content_type",
    type: "multi",
    emoji: "📺",
    question: "Какой формат предпочитаешь?",
    hint: "Можно выбрать несколько",
    options: [
      { icon: "🎬", label: "Фильм", value: "фильм" },
      { icon: "📺", label: "Сериал", value: "сериал" },
      { icon: "🎨", label: "Мультфильм", value: "мультфильм" },
      { icon: "📡", label: "Мультсериал", value: "мультсериал" },
      { icon: "⛩️", label: "Аниме", value: "аниме" },
      { icon: "🎲", label: "Не важно", value: "any" }
    ]
  },
  {
    id: "age_rating",
    type: "options",
    emoji: "🔞",
    question: "Возрастное ограничение — что подходит?",
    hint: "",
    options: [
      { icon: "🟢", label: "0+", sub: "Для всей семьи", value: "0+" },
      { icon: "🟡", label: "6+", sub: "Для детей от 6 лет", value: "6+" },
      { icon: "🟠", label: "12+", sub: "Подростки и старше", value: "12+" },
      { icon: "🔴", label: "16+", sub: "Для взрослых", value: "16+" },
      { icon: "🚫", label: "18+", sub: "Только для взрослых", value: "18+" },
      { icon: "✅", label: "Любой", sub: "Без ограничений", value: "any" }
    ]
  },
  {
    id: "year_range",
    type: "range",
    emoji: "📅",
    question: "Период выхода — какие годы?",
    hint: "Перетащи ползунки чтобы выбрать диапазон",
    min: 1930, max: 2026, defaultFrom: 2007, defaultTo: 2026
  },
  {
    id: "length",
    type: "options",
    emoji: "⏱",
    question: "Сколько времени готов потратить?",
    hint: "",
    options: [
      { icon: "⚡", label: "До 90 минут", sub: "Коротко и ёмко", value: "short" },
      { icon: "🎯", label: "Стандарт", sub: "90–150 мин / 6–10 серий", value: "standard" },
      { icon: "🌊", label: "Длинно", sub: "2.5+ часа / долгий сериал", value: "long" },
      { icon: "♾️", label: "Не важно", sub: "Главное — качество", value: "any" }
    ]
  },
  {
    id: "language",
    type: "options",
    emoji: "🌍",
    question: "Какое кино предпочитаешь?",
    hint: "",
    options: [
      { icon: "🇷🇺", label: "СНГ / Советское", sub: "Россия, СССР, Украина, Казахстан...", value: "cis" },
      { icon: "🇺🇸", label: "Американское", sub: "США, UK, Австралия", value: "en" },
      { icon: "⛩️", label: "Азиатское", sub: "Япония, Корея, Китай", value: "asia" },
      { icon: "🇪🇺", label: "Европейское", sub: "Франция, Италия, Дания...", value: "eu" },
      { icon: "🌐", label: "Любое", sub: "Субтитры — не проблема", value: "any" }
    ]
  },
  {
    id: "exclude_genres",
    type: "multi",
    emoji: "🚫",
    question: "Что точно не хочешь сейчас?",
    hint: "Можно выбрать несколько",
    options: [
      { icon: "👻", label: "Хоррор", value: "хоррор" },
      { icon: "😂", label: "Комедия", value: "комедия" },
      { icon: "💔", label: "Тяжёлая драма", value: "тяжёлая драма" },
      { icon: "🔫", label: "Экшен", value: "экшен" },
      { icon: "🌌", label: "Фантастика", value: "фантастика" },
      { icon: "💀", label: "Насилие", value: "насилие" },
      { icon: "🚫", label: "Ничего не исключаю", value: "none" }
    ]
  },
  {
    id: "refine_emotion",
    type: "options",
    emoji: "🔥",
    question: "Какую эмоцию вы хотите испытать в финале?",
    hint: "Уточняющий вопрос",
    options: [
      { icon: "🤯", label: "Шок / Неожиданность", sub: "Внезапный твист", value: "шок" },
      { icon: "😌", label: "Катарсис / Облегчение", sub: "Светлая грусть или радость", value: "катарсис" },
      { icon: "🤔", label: "Задумчивость", sub: "Открытый финал", value: "открытый" },
      { icon: "🎲", label: "Неважно", sub: "Главное — процесс", value: "any" }
    ]
  },
  {
    id: "refine_pace",
    type: "options",
    emoji: "⏱️",
    question: "Какой темп повествования вам сейчас ближе?",
    hint: "Уточняющий вопрос",
    options: [
      { icon: "🐢", label: "Медленный", sub: "Погружение, вдумчивость", value: "медленный" },
      { icon: "🐇", label: "Динамичный", sub: "События сменяются быстро", value: "динамичный" },
      { icon: "🎢", label: "Рваный", sub: "Непредсказуемые скачки", value: "рваный" },
      { icon: "🎲", label: "Неважно", sub: "Любой темп", value: "any" }
    ]
  }
];

// ─── STATE ───────────────────────────────────────────────────────────────────

let state = {
  step: 0,
  answers: {},
  multiSelected: new Set(),
  mode: 'local' // 'local' or 'tmdb'
};

let recommendationsPromise = null;

// Helper to escape HTML characters for XSS prevention
function escapeHTML(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── INIT ────────────────────────────────────────────────────────────────────

document.getElementById("btn-start").addEventListener("click", () => {
  show("screen-quiz");
  hide("screen-hero");
  renderStep();
  updateCarouselState();
});

document.getElementById("btn-next").addEventListener("click", nextStep);
document.getElementById("btn-back").addEventListener("click", prevStep);
document.getElementById("btn-restart").addEventListener("click", restart);
document.getElementById("btn-home").addEventListener("click", restart);
document.getElementById("btn-home-results").addEventListener("click", restart);

document.getElementById("btn-refine").addEventListener("click", () => {
  hide("screen-results");
  show("screen-quiz");
  state.step = STEPS.findIndex(s => s.id === "refine_emotion");
  renderStep();
});

// Mode Toggle
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
  });
});

// ─── STEP RENDER ─────────────────────────────────────────────────────────────

function renderStep() {
  const s = STEPS[state.step];
  const total = STEPS.length;
  const pct = ((state.step + 1) / total) * 100;

  document.getElementById("progress-bar").style.width = pct + "%";
  document.getElementById("step-label").textContent = `Шаг ${state.step + 1} из ${total}`;
  document.getElementById("btn-back").disabled = state.step === 0;
  document.getElementById("btn-next").textContent = state.step === total - 1 ? "Подобрать фильм →" : "Далее →";

  const container = document.getElementById("steps-container");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.className = "step";

  if (s.type === "text") {
    div.innerHTML = `
      <h2>${s.emoji} ${s.question}</h2>
      ${s.hint ? `<p class="step-hint">${s.hint}</p>` : ""}
      <textarea id="text-input" placeholder="Напиши здесь..." rows="4">${escapeHTML(state.answers[s.id] || "")}</textarea>
    `;
  } else if (s.type === "options") {
    const saved = state.answers[s.id];
    div.innerHTML = `
      <h2>${s.emoji} ${s.question}</h2>
      ${s.hint ? `<p class="step-hint">${s.hint}</p>` : ""}
      <div class="options-grid">
        ${s.options.map(o => `
          <div class="option-card ${saved === o.value ? "selected" : ""}" data-value="${o.value}">
            <span class="opt-icon">${o.icon}</span>
            <div>
              <div class="opt-label">${o.label}</div>
              ${o.sub ? `<div class="opt-sub">${o.sub}</div>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    `;
    div.querySelectorAll(".option-card").forEach(card => {
      card.addEventListener("click", () => {
        div.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        state.answers[s.id] = card.dataset.value;
        setTimeout(() => { if (state.step < STEPS.length - 1) nextStep(); }, 300);
      });
    });
  } else if (s.type === "multi") {
    if (!state.answers[s.id]) state.multiSelected = new Set();
    else state.multiSelected = new Set(state.answers[s.id]);

    div.innerHTML = `
      <h2>${s.emoji} ${s.question}</h2>
      <p class="multi-hint">${s.hint}</p>
      <div class="options-grid cols2">
        ${s.options.map(o => `
          <div class="option-card ${state.multiSelected.has(o.value) ? "selected" : ""}" data-value="${o.value}">
            <span class="opt-icon">${o.icon}</span>
            <div class="opt-label">${o.label}</div>
          </div>
        `).join("")}
      </div>
    `;
    div.querySelectorAll(".option-card").forEach(card => {
      card.addEventListener("click", () => {
        const v = card.dataset.value;
        if (v === "none") {
          state.multiSelected.clear();
          state.multiSelected.add("none");
          div.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
        } else {
          state.multiSelected.delete("none");
          if (state.multiSelected.has(v)) state.multiSelected.delete(v);
          else state.multiSelected.add(v);
          div.querySelectorAll(".option-card").forEach(c => {
            c.classList.toggle("selected", state.multiSelected.has(c.dataset.value));
          });
        }
        state.answers[s.id] = [...state.multiSelected];
      });
    });
  } else if (s.type === "range") {
    const savedFrom = (state.answers[s.id] && state.answers[s.id].from) || s.defaultFrom;
    const savedTo   = (state.answers[s.id] && state.answers[s.id].to)   || s.defaultTo;
    div.innerHTML = `
      <h2>${s.emoji} ${s.question}</h2>
      ${s.hint ? `<p class="step-hint">${s.hint}</p>` : ""}
      <div class="year-display">
        <div class="year-box"><span class="year-lbl">С</span><span class="year-val" id="yr-from-val">${savedFrom}</span></div>
        <div class="year-dash">—</div>
        <div class="year-box"><span class="year-lbl">По</span><span class="year-val" id="yr-to-val">${savedTo}</span></div>
      </div>
      <div class="dual-range-wrap">
        <div class="dual-track">
          <div class="dual-fill" id="dual-fill"></div>
        </div>
        <input type="range" class="dual-range" id="yr-from" min="${s.min}" max="${s.max}" value="${savedFrom}" />
        <input type="range" class="dual-range" id="yr-to"   min="${s.min}" max="${s.max}" value="${savedTo}" />
      </div>
      <div class="year-range-labels"><span>${s.min}</span><span>${s.max}</span></div>
    `;
    const fromEl = div.querySelector("#yr-from");
    const toEl   = div.querySelector("#yr-to");
    const fillEl = div.querySelector("#dual-fill");
    const fromVal = div.querySelector("#yr-from-val");
    const toVal   = div.querySelector("#yr-to-val");

    function updateRange(e) {
      let f = parseInt(fromEl.value);
      let t = parseInt(toEl.value);

      if (f >= t) {
        if (e && e.target === fromEl) {
          fromEl.value = t;
          f = t;
        } else if (e && e.target === toEl) {
          toEl.value = f;
          t = f;
        } else {
          f = Math.min(f, t);
          t = Math.max(f, t);
          fromEl.value = f;
          toEl.value = t;
        }
      }

      fromVal.textContent = f;
      toVal.textContent   = t;
      const range = s.max - s.min;
      const left  = ((f - s.min) / range) * 100;
      const right = ((s.max - t) / range) * 100;
      fillEl.style.left  = left + "%";
      fillEl.style.right = right + "%";
      state.answers[s.id] = { from: f, to: t };
    }
    fromEl.addEventListener("input", updateRange);
    toEl.addEventListener("input", updateRange);
    updateRange(null);
  }

  container.appendChild(div);
  if (s.type === "text") {
    const ta = document.getElementById("text-input");
    ta.addEventListener("input", () => { state.answers[s.id] = ta.value; });
  }
}

function nextStep() {
  const s = STEPS[state.step];
  if (s.type === "text") {
    const val = (document.getElementById("text-input")?.value || "").trim();
    state.answers[s.id] = val;
  }

  if (state.step === STEPS.length - 1) {
    showLoading();
  } else {
    state.step++;
    renderStep();
  }
}

function prevStep() {
  if (state.step > 0) { state.step--; renderStep(); }
}

// ─── LOADING ─────────────────────────────────────────────────────────────────

function showLoading() {
  hide("screen-quiz");
  show("screen-loading");

  // Reset loading step classes
  ["ls1","ls2","ls3","ls4"].forEach(id => {
    document.getElementById(id).className = "ls-item" + (id === "ls1" ? " active" : "");
  });

  // Start TMDB fetch concurrently if in tmdb mode
  if (state.mode === 'tmdb') {
    const DEFAULT_TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
    recommendationsPromise = Promise.race([
      fetchRecommendations(state.answers, DEFAULT_TMDB_KEY),
      new Promise((_, reject) => setTimeout(() => reject(new Error("TMDB fetch timeout")), 5000))
    ]);
  } else {
    recommendationsPromise = Promise.resolve(getRecommendations());
  }

  const ids = ["ls1","ls2","ls3","ls4"];
  let i = 0;
  const interval = setInterval(() => {
    if (i > 0) { document.getElementById(ids[i-1]).className = "ls-item done"; }
    if (i < ids.length) { document.getElementById(ids[i]).className = "ls-item active"; }
    i++;
    if (i > ids.length) {
      clearInterval(interval);
      setTimeout(showResults, 600);
    }
  }, 700);
}

// ─── RECOMMENDATION ENGINE ───────────────────────────────────────────────────

// Age rating hierarchy: 0+ < 6+ < 12+ < 16+ < 18+
const AGE_ORDER = ["0+", "6+", "12+", "16+", "18+"];

function scoreFilm(film, matched_tags = []) {
  const a = state.answers;
  let score = 0;

  // ── Year range filter (hard) ──
  const yr = a.year_range;
  if (yr) {
    if (film.year < yr.from || film.year > yr.to) return -999;
  }

  // ── Age rating filter (hard) ──
  const ar = a.age_rating;
  if (ar && ar !== "any") {
    const maxIdx   = AGE_ORDER.indexOf(ar);
    const filmIdx  = AGE_ORDER.indexOf(film.age_rating);
    if (filmIdx > maxIdx) return -999;
  }

  // ── Content type filter (hard) ──
  const ct = Array.isArray(a.content_type) ? a.content_type : [a.content_type || "any"];
  if (!ct.includes("any") && ct.length > 0 && !ct.includes(film.type)) return -999;

  // ── Region / language filter ──
  const lang = a.language;
  const isCIS = film.region === "cis";
  if (lang === "cis" && !isCIS) return -999;          // только СНГ — жёстко
  if (lang && lang !== "any" && lang !== "cis" && isCIS) score -= 25; // не СНГ — штраф
  if (lang === "cis" && isCIS) score += 30;           // СНГ выбрано — буст

  // Mood text matching
  const moodText = ((a.mood_weather || "") + " " + (a.what_hooks || "") + " " + (a.last_feeling || "")).toLowerCase();
  film.mood_tags.forEach(tag => { 
    if (moodText.includes(tag)) {
      score += 15; 
      matched_tags.push(tag);
    } 
  });

  // Escape vs understand
  const intent = a.escape_or_understand;
  if (intent === "escape" && ["аниме","комедия","приключение","фэнтези","романтика"].some(g => film.genre.includes(g))) score += 20;
  if (intent === "understand" && ["драма","психологический","философия"].some(g => film.genre.includes(g))) score += 20;
  if (intent === "energize" && ["криминал","триллер","биография","экшен"].some(g => film.genre.includes(g))) score += 20;
  if (intent === "rest" && ["комедия","романтика","аниме","спорт"].some(g => film.genre.includes(g))) score += 15;

  // Audience
  const aud = a.alone_or_together;
  if (aud === "solo" && film.audience === "solo") score += 10;
  if ((aud === "group" || aud === "partner") && film.audience === "any") score += 8;
  if (aud === "solo" && film.audience === "any") score += 5;

  // Excluded genres
  const excludeGenreMap = {
    'хоррор': ['хоррор', 'ужасы'],
    'комедия': ['комедия'],
    'тяжёлая драма': ['драма', 'трагедия'],
    'экшен': ['экшен', 'боевик'],
    'фантастика': ['фантастика', 'sci-fi'],
    'насилие': ['криминал', 'триллер']
  };
  const excluded = Array.isArray(a.exclude_genres) ? a.exclude_genres : [];
  if (!excluded.includes("none")) {
    excluded.forEach(ex => {
      const targets = excludeGenreMap[ex] || [ex];
      targets.forEach(target => {
        if (film.genre.toLowerCase().includes(target)) score -= 50;
      });
    });
  }

  // Hooks keyword match
  const hooks = (a.what_hooks || "").toLowerCase();
  const hookWords = hooks.split(/\s+/);
  hookWords.forEach(w => { if (w.length > 3 && film.genre.toLowerCase().includes(w)) score += 10; });

  // Mood-specific boosts
  const sadWords    = ["грустно","тяжело","больно","устал","потеря","пусто","плохо"];
  const happyWords  = ["хорошо","радостно","весело","бодро","отлично","лёгко","тепло"];
  const anxiousWords= ["тревога","страх","беспокойство","нервно","неспокойно","напряжение"];
  if (sadWords.some(w => moodText.includes(w)) && film.mood_tags.some(t => ["грусть","тяжело","тоска"].includes(t))) {
    score += 25;
    matched_tags.push("мрачно");
  }
  if (happyWords.some(w => moodText.includes(w)) && film.mood_tags.some(t => ["весело","тепло","улыбка"].includes(t))) {
    score += 25;
    matched_tags.push("тепло");
  }
  if (anxiousWords.some(w => moodText.includes(w)) && film.mood_tags.some(t => ["тревога","напряжение"].includes(t))) {
    score += 20;
    matched_tags.push("напряжение");
  }

  // Refine logic
  const re = a.refine_emotion;
  if (re && re !== "any") {
    if (re === "шок" && ["триллер","детектив"].some(g => film.genre.includes(g))) score += 25;
    if (re === "катарсис" && ["драма"].some(g => film.genre.includes(g))) score += 25;
  }
  const rp = a.refine_pace;
  if (rp && rp !== "any") {
    if (rp === "медленный" && ["драма","артхаус"].some(g => film.genre.includes(g))) score += 25;
    if (rp === "динамичный" && ["экшен","комедия"].some(g => film.genre.includes(g))) score += 25;
  }

  return Math.max(0, Math.min(100, score)) + Math.random() * 5;
}

function getRecommendations() {
  let allTags = [];
  const scored = FILMS_DB.map(f => {
    let mTags = [];
    const score = scoreFilm(f, mTags);
    if (mTags.length) allTags.push(...mTags);
    return { ...f, score, mTags };
  });
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  const toMoodMatch = (score) => Math.max(60, Math.min(98, Math.round(score)));

  const main = { ...top[0], mood_match: toMoodMatch(top[0].score) };
  const alts = top.slice(1, 3).map((f, i) => ({
    ...f,
    mood_match: toMoodMatch(f.score - 8 - i * 4)
  }));

  const uniqueTags = [...new Set(top[0].mTags || [])];
  
  return { main, alts, uniqueTags };
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────

async function showResults() {
  let main, alts, uniqueTags = [];
  try {
    const data = await recommendationsPromise;
    main = data.main;
    alts = data.alts;
    if (state.mode === 'tmdb') {
      uniqueTags = data.main.genre ? data.main.genre.split(', ') : [];
    } else {
      uniqueTags = data.uniqueTags || [];
    }
  } catch (err) {
    console.error("Failed to load recommendations, falling back to local:", err);
    const localData = getRecommendations();
    main = localData.main;
    alts = localData.alts;
    uniqueTags = localData.uniqueTags;
  }

  // Transition screens only when data is resolved
  hide("screen-loading");
  show("screen-results");

  // Analysis block
  const aBox = document.getElementById("analysis-box");
  const aText = document.getElementById("analysis-text");
  if (uniqueTags.length > 0) {
    show("analysis-box");
    const escapedTags = uniqueTags.map(escapeHTML).join(", ");
    aText.innerHTML = `Мы зацепились за ваши ответы, которые указали на состояния: <strong>${escapedTags}</strong>. Алгоритм подобрал фильмы, которые лучше всего резонируют с этим настроением.`;
  } else {
    hide("analysis-box");
  }

  // Main card
  if (main.poster_url) {
    show("card-poster-wrap");
    document.getElementById("card-poster").src = main.poster_url;
  } else {
    hide("card-poster-wrap");
  }

  document.getElementById("main-title").textContent = main.title;
  document.getElementById("main-year").textContent = main.year;
  document.getElementById("main-type").textContent = main.type;
  document.getElementById("main-genre").textContent = main.genre;
  document.getElementById("main-rating").textContent = main.rating;
  document.getElementById("main-why").textContent = main.why_template;
  document.getElementById("main-where").textContent = main.where;
  document.getElementById("ring-pct").textContent = main.mood_match + "%";

  // TMDB details link setup
  const tmdbBtn = document.getElementById("btn-tmdb-link");
  if (main.tmdb_url) {
    tmdbBtn.href = main.tmdb_url;
    tmdbBtn.classList.remove("hidden");
  } else {
    tmdbBtn.classList.add("hidden");
  }

  // Animate ring
  const circumference = 2 * Math.PI * 34;
  const fill = document.getElementById("ring-fill");
  fill.style.strokeDasharray = circumference;
  fill.style.strokeDashoffset = circumference;
  fill.setAttribute("stroke", "url(#ringGrad)");
  setTimeout(() => {
    const offset = circumference * (1 - main.mood_match / 100);
    fill.style.strokeDashoffset = offset;
  }, 300);

  // Alternatives
  const grid = document.getElementById("alts-grid");
  grid.innerHTML = alts.map(a => `
    <div class="alt-card">
      ${a.poster_url ? `<div class="alt-poster-wrap"><img src="${escapeHTML(a.poster_url)}" alt="Постер"></div>` : '<div class="alt-poster-wrap missing-poster"><div class="alt-poster-placeholder">🎬<br><span>Постер отсутствует</span></div></div>'}
      <div class="alt-body">
        <h4>${escapeHTML(a.title)}</h4>
        <div class="alt-meta">${escapeHTML(a.year)} · ${escapeHTML(a.type)} · ${escapeHTML(a.genre)}</div>
        <div class="alt-match">${escapeHTML(a.mood_match)}% совпадение</div>
        <p class="alt-why">${escapeHTML(a.why_template.split(".")[0] + ".")}</p>
        <div class="alt-where">📍 ${escapeHTML(a.where)}</div>
      </div>
    </div>
  `).join("");
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function show(id) {
  document.getElementById(id).classList.remove("hidden");
  window.scrollTo(0, 0);
}
function hide(id) { document.getElementById(id).classList.add("hidden"); }

function restart() {
  state = { step: 0, answers: {}, multiSelected: new Set(), mode: state.mode };
  hide("screen-results");
  show("screen-hero");
  // reset loading screen styles
  ["ls1","ls2","ls3","ls4"].forEach(id => {
    document.getElementById(id).className = "ls-item" + (id === "ls1" ? " active" : "");
  });
  updateCarouselState();
}

// ─── CAROUSEL CONTROLLER ──────────────────────────────────────────────────────
let carouselInterval = null;
let currentSlideIndex = 0;
const slides = document.querySelectorAll(".bg-slide");

function isHeroVisible() {
  const hero = document.getElementById("screen-hero");
  return hero && !hero.classList.contains("hidden");
}

function startCarousel() {
  if (carouselInterval || slides.length <= 1) return;
  carouselInterval = setInterval(() => {
    const nextSlideIndex = (currentSlideIndex + 1) % slides.length;
    const currentSlide = slides[currentSlideIndex];
    const nextSlide = slides[nextSlideIndex];

    // Reset next slide transform instantly to prevent jump
    nextSlide.style.transition = "none";
    nextSlide.style.transform = "scale(1.08)";
    
    // Trigger browser reflow
    nextSlide.offsetHeight;

    // Restore transition style
    nextSlide.style.transition = "";
    nextSlide.style.transform = "";

    // Remove active class from current, add to next
    currentSlide.classList.remove("active");
    nextSlide.classList.add("active");

    currentSlideIndex = nextSlideIndex;
  }, 8000);
}

function pauseCarousel() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

function updateCarouselState() {
  if (document.hidden || !isHeroVisible()) {
    pauseCarousel();
  } else {
    startCarousel();
  }
}

// Event Listeners for Visibility and Window State
document.addEventListener("visibilitychange", updateCarouselState);

// Start Carousel initially if Hero is visible
updateCarouselState();
