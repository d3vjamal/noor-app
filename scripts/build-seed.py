#!/usr/bin/env python3
"""Build the JSONL files that `npx convex import` loads into the Convex tables.

Inputs : content-source/hadith-api/*.json, content-source/quran-api/*.json (git-ignored downloads),
         content-source/seed/{duas.json,names-raw.json,names-bn.txt}
Outputs: content-source/seed/out/<table>.jsonl   (git-ignored)
Run    : python3 scripts/build-seed.py && scripts/import-seed.sh
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content-source')
OUT = os.path.join(SRC, 'seed/out')
os.makedirs(OUT, exist_ok=True)


def write(table, rows):
    with open(f'{OUT}/{table}.jsonl', 'w') as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{table}: {len(rows)} rows')


def load(path):
    return json.load(open(f'{SRC}/{path}'))


# ---- hadith ----
BOOKS = [  # id, Bangla title, English title
    ('bukhari', 'সহীহ বুখারী', 'Sahih al-Bukhari'),
    ('muslim', 'সহীহ মুসলিম', 'Sahih Muslim'),
    ('abudawud', 'সুনান আবূ দাঊদ', 'Sunan Abu Dawud'),
    ('tirmidhi', 'জামি‘ আত-তিরমিযী', 'Jami at-Tirmidhi'),
    ('nasai', 'সুনান আন-নাসায়ী', "Sunan an-Nasa'i"),
    ('ibnmajah', 'সুনান ইবনু মাজাহ', 'Sunan Ibn Majah'),
    ('malik', 'মুওয়াত্তা মালিক', 'Muwatta Malik'),
    ('nawawi', 'আরবাঈন নববী (৪০ হাদীস)', 'Forty Hadith of an-Nawawi'),
]
books, hadith = [], []
for order, (bid, bn, en) in enumerate(BOOKS):
    ben = load(f'hadith-api/ben-{bid}.json')
    eng = load(f'hadith-api/eng-{bid}.json')
    urd_path = f'hadith-api/urd-{bid}.json'  # no Urdu edition for some books (e.g. nawawi)
    urd = load(urd_path) if os.path.exists(f'{SRC}/{urd_path}') else {'hadiths': []}
    names = ben['metadata']['sections']
    rows = {}  # number -> {section, bn, en, ur}
    for key, d in (('bn', ben), ('en', eng), ('ur', urd)):
        for h in d['hadiths']:
            r = rows.setdefault(h['hadithnumber'], {'section': str(h['reference']['book']), 'bn': '', 'en': '', 'ur': ''})
            r[key] = h['text'].strip()
    counts = {}
    for num in sorted(rows):
        r = rows[num]
        if not (r['bn'] or r['en'] or r['ur']):
            continue
        counts[r['section']] = counts.get(r['section'], 0) + 1
        doc = {'book': bid, 'section': r['section'], 'number': num}
        doc.update({k: r[k] for k in ('bn', 'en', 'ur') if r[k]})
        hadith.append(doc)
    sections = [{'id': s, 'name': names.get(s) or f'Section {s}', 'count': counts[s]} for s in sorted(counts, key=int)]
    books.append({'bookId': bid, 'titleBn': bn, 'titleEn': en, 'order': order, 'sections': sections})
write('hadithBooks', books)
write('hadith', hadith)

# ---- quran ----
info = load('quran-api/info.json')['chapters']
ara = load('quran-api/ara-quranuthmanihaf.json')['quran']
tr = {k: load(f'quran-api/{f}.json')['quran'] for k, f in
      (('bn', 'ben-muhiuddinkhan'), ('en', 'eng-abdelhaleem'), ('ur', 'urd-abulaalamaududi'))}
by = {k: {(v['chapter'], v['verse']): v['text'].strip() for v in rows} for k, rows in tr.items()}
counts = {}
ayahs = []
for v in ara:
    c, n = v['chapter'], v['verse']
    counts[c] = counts.get(c, 0) + 1
    ayahs.append({'surah': c, 'number': n, 'ar': v['text'].strip(),
                  **{k: by[k][(c, n)] for k in by if by[k].get((c, n))}})
write('surahs', [{'number': c['chapter'], 'nameAr': c['arabicname'], 'nameEn': c['name'],
                  'meaningEn': c['englishname'], 'revelation': c['revelation'],
                  'ayahCount': counts[c['chapter']]} for c in info])
write('ayahs', ayahs)

# ---- duas ----
# My curated Bangla/English set first, then UmmahAPI's duas (English only) that are not already covered.
import re


def norm(t):  # Arabic without marks, so differently-vowelled copies of one dua compare equal
    t = re.sub(r'[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]', '', t)
    t = re.sub(r'[\u0622\u0623\u0625\u0671]', '\u0627', t).replace('\u0649', '\u064A').replace('\u0629', '\u0647')
    return re.sub(r'[^\u0621-\u064A]', '', t)


def same(a, b):
    short, long_ = sorted((a, b), key=len)
    return a == b or (len(short) >= 25 and short in long_)


# My categories folded into UmmahAPI's so each dua lives in exactly one place.
CAT_OF = {'wake': 'sleep', 'sleep': 'sleep', 'clothes': 'daily', 'eat-before': 'food', 'eat-after': 'food',
          'home-enter': 'home', 'home-leave': 'home', 'toilet-enter': 'home', 'toilet-leave': 'home',
          'masjid-enter': 'masjid', 'masjid-leave': 'masjid', 'travel': 'travel', 'istighfar': 'forgiveness',
          'rabbana': 'forgiveness', 'parents': 'parents'}
duas = load('seed/duas.json')
rows = [{'slug': d['id'], 'category': CAT_OF[d['id']], 'titleBn': d['title']['bn'], 'titleEn': d['title']['en'],
         'arabic': d['arabic'], 'meaningBn': d['meaning']['bn'], 'meaningEn': d['meaning']['en'],
         'sourceBn': d['source']['bn'], 'sourceEn': d['source']['en'], 'order': i,
         **({'audioUrls': d['audioUrls']} if d.get('audioUrls') else {})}
        for i, d in enumerate(duas)]
mine = [norm(d['arabic']) for d in duas]
added = 0
for x in sorted(load('seed/ummah-duas.json')['duas'], key=lambda x: x['id']):
    if any(same(norm(x['arabic']), m) for m in mine):
        continue
    added += 1
    rows.append({'slug': f"u-{x['id']}", 'category': x['category'], 'titleBn': '', 'titleEn': x['title'],
                 'arabic': x['arabic'], 'meaningBn': '', 'meaningEn': x['translation'],
                 'sourceBn': '', 'sourceEn': x['source'], 'order': 100 + x['id'],
                 **({'transliteration': x['transliteration']} if x.get('transliteration') else {}),
                 **({'repeat': x['repeat']} if x.get('repeat', 1) > 1 else {})})
print(f'duas: {added} imported from UmmahAPI')
write('duas', rows)

# ---- 99 names ----
FIX = {'The Maginificent': 'The Magnificent', 'The Inhertior': 'The Inheritor',
       'The Guide to Repentence': 'The Guide to Repentance', 'The Forebearing': 'The Forbearing',
       'The Owner / Soverign of All': 'The Owner / Sovereign of All', 'Ad Daaarr': 'Ad Daarr'}
raw = load('seed/names-raw.json')['data']
bn = [l.rstrip('\n').split('|') for l in open(f'{SRC}/seed/names-bn.txt') if l.strip()]
assert len(raw) == len(bn) == 99
write('names', [{'number': r['number'], 'arabic': r['name'], 'translit': FIX.get(r['transliteration'].strip(), r['transliteration'].strip()),
                 'nameBn': b[0], 'meaningEn': FIX.get(r['en']['meaning'], r['en']['meaning']), 'meaningBn': b[1]}
                for r, b in zip(raw, bn)])

# ---- quotes (shown on the Listen tab) ----
q = json.load(open(f'{SRC}/seed/quotes.json'))['quotes']
write('quotes', [{'text': x['text'], **({'source': x['source']} if x.get('source') else {}), 'order': i} for i, x in enumerate(q)])
