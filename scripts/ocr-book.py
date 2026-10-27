#!/usr/bin/env python3
"""OCR the scanned Bengali book into per-page text for text-to-speech.

Usage: TESSDATA_PREFIX=<dir with ben.traineddata> python3 -I scripts/ocr-book.py hadis.pdf assets/content/book-hadis.json
Needs: tesseract (brew install tesseract) and `pip install pymupdf`.
Arabic quotations are not read aloud: lines that are not mostly Bengali script are dropped.
"""
import json, os, re, subprocess, sys, tempfile
from multiprocessing import Pool

import pymupdf

PDF, OUT = sys.argv[1], sys.argv[2]
BN = re.compile(r'[ঀ-৿]')
LETTER = re.compile(r'[^\W\d_]', re.UNICODE)
SKIP = re.compile(r'almodina|^\W*$')


def clean(text):
    lines = []
    for ln in text.splitlines():
        ln = ln.strip().strip('|').strip()
        letters = LETTER.findall(ln)
        if not ln or SKIP.search(ln) or not letters:
            continue
        if len(BN.findall(ln)) / len(letters) < 0.7:  # Arabic / noise
            continue
        lines.append(ln)
    return '\n'.join(lines)


def ocr(i):
    with tempfile.TemporaryDirectory() as d:
        img = os.path.join(d, 'p.png')
        with pymupdf.open(PDF) as doc:
            doc[i].get_pixmap(dpi=200).save(img)
        r = subprocess.run(['tesseract', img, '-', '-l', 'ben', '--psm', '4'], capture_output=True, text=True)
        return i, clean(r.stdout)


if __name__ == '__main__':
    n = pymupdf.open(PDF).page_count
    pages = [''] * n
    with Pool(max(1, (os.cpu_count() or 4) - 2)) as pool:
        for k, (i, t) in enumerate(pool.imap_unordered(ocr, range(n)), 1):
            pages[i] = t
            if k % 25 == 0:
                print(f'{k}/{n}', flush=True)
    json.dump({'version': 1, 'pages': pages}, open(OUT, 'w'), ensure_ascii=False)
    print('done', n, 'pages,', sum(1 for p in pages if p), 'with text')
