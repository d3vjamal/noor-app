#!/usr/bin/env python3
"""Draw the app logo (open book + audio waves) as a transparent vector and render every icon from it.

Writes the vector drawables used by the Android splash screen and adaptive icon, plus the legacy
launcher PNGs and the 512px Play Store icon. Run: python3 scripts/make-icons.py
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = f'{ROOT}/android/app/src/main/res'

BG = '#0F6B4F'          # brand green; adaptive-icon + splash background
BG_DARK = '#0A4A38'     # gradient end for the PNG icons
PAGE, PAGE_EDGE, SPINE = '#FBF7EC', '#D6CFB8', '#BDB59C'
LINE, AMBER = '#A9D3C3', '#F59E0B'

# Glyph drawn on a 1152 grid centred on (576, 509); the book is 190 wide, the waves 69 tall.
CX, CY = 576, 509
BARS = [(536, 438, 468), (556, 428, 478), (576, 419, 488), (596, 428, 478), (616, 438, 468)]  # x, top, bottom
LEFT_PAGE = [(481, 483), ((512, 483), (546, 488), (576, 499)), (576, 590), ((546, 581), (512, 572), (481, 567))]
LEFT_LINES = [((494, 509), (563, 513)), ((494, 522), (563, 526)), ((494, 536), (563, 540)), ((494, 553), (540, 556))]


def mx(p):  # mirror a point across the spine
    return (1152 - p[0], p[1])


def page_path(mirror):
    f = mx if mirror else (lambda p: p)
    (x0, y0), (c1, c2, p1), p2, (c3, c4, p3) = LEFT_PAGE
    pts = [f((x0, y0)), [f(c1), f(c2), f(p1)], f(p2), [f(c3), f(c4), f(p3)]]
    return pts


def vector_xml(size, scale, bg=None):
    """VectorDrawable of the glyph centred in a size x size viewport at `scale` units per grid unit."""
    def X(x): return round(size / 2 + (x - CX) * scale, 2)
    def Y(y): return round(size / 2 + (y - CY) * scale, 2)
    def pt(p): return f'{X(p[0])},{Y(p[1])}'
    out = [f'<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="{size}dp" android:height="{size}dp"\n    android:viewportWidth="{size}" android:viewportHeight="{size}">']
    if bg:
        out.append(f'  <path android:fillColor="{bg}" android:pathData="M0,0H{size}V{size}H0Z"/>')

    def path(d, fill=None, stroke=None, w=0):
        a = f'  <path android:pathData="{d}"'
        if fill: a += f' android:fillColor="{fill}"'
        if stroke: a += f' android:strokeColor="{stroke}" android:strokeWidth="{round(w * scale, 2)}" android:strokeLineCap="round"'
        out.append(a + '/>')

    for x, t, b in BARS:
        path(f'M{pt((x, t + 6))} L{pt((x, b - 6))}', stroke=AMBER, w=12)
    for mirror in (False, True):
        (a, (c1, c2, p1), p2, (c3, c4, p3)) = page_path(mirror)
        path(f'M{pt(a)} C{pt(c1)} {pt(c2)} {pt(p1)} L{pt(p2)} C{pt(c3)} {pt(c4)} {pt(p3)} Z', fill=PAGE)
    # darker strip along the bottom edge of the pages
    path(f'M{pt((481, 567))} C{pt((512, 572))} {pt((546, 581))} {pt((576, 590))} C{pt((606, 581))} {pt((640, 572))} {pt((671, 567))} '
         f'L{pt((671, 575))} C{pt((640, 580))} {pt((606, 589))} {pt((576, 599))} C{pt((546, 589))} {pt((512, 580))} {pt((481, 575))} Z', fill=PAGE_EDGE)
    path(f'M{pt((576, 499))} L{pt((576, 597))}', stroke=SPINE, w=2)
    for mirror in (False, True):
        for a, b in LEFT_LINES:
            if mirror: a, b = mx(a), mx(b)
            path(f'M{pt(a)} L{pt(b)}', stroke=LINE, w=4)
    out.append('</vector>\n')
    return '\n'.join(out)


# ---- raster ----
SS = 4  # supersampling for smooth edges


def bezier(p0, c1, c2, p1, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u**3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t**3 * p1[0],
                    u**3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t**3 * p1[1]))
    return pts


def draw_glyph(d, size, scale):
    def T(p): return (size / 2 + (p[0] - CX) * scale, size / 2 + (p[1] - CY) * scale)
    def line(a, b, color, w):
        a, b, r = T(a), T(b), w * scale / 2
        d.line([a, b], fill=color, width=max(1, round(w * scale)))
        for q in (a, b):
            d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=color)
    for x, t, b in BARS:
        line((x, t + 6), (x, b - 6), AMBER, 12)
    for mirror in (False, True):
        (a, (c1, c2, p1), p2, (c3, c4, p3)) = page_path(mirror)
        poly = bezier(a, c1, c2, p1) + [p2] + bezier(p2, c3, c4, p3) + [a]
        d.polygon([T(p) for p in poly], fill=PAGE)
    strip = bezier((481, 567), (512, 572), (546, 581), (576, 590)) + bezier((576, 590), (606, 581), (640, 572), (671, 567)) \
        + [(671, 575)] + bezier((671, 575), (640, 580), (606, 589), (576, 599)) + bezier((576, 599), (546, 589), (512, 580), (481, 575))
    d.polygon([T(p) for p in strip], fill=PAGE_EDGE)
    line((576, 499), (576, 597), SPINE, 2)
    for mirror in (False, True):
        for a, b in LEFT_LINES:
            line(mx(a) if mirror else a, mx(b) if mirror else b, LINE, 4)


def gradient(size):
    import numpy as np
    c0, c1 = np.array(Image.new('RGB', (1, 1), '#1A8060').getpixel((0, 0))), np.array(Image.new('RGB', (1, 1), BG_DARK).getpixel((0, 0)))
    ys, xs = np.mgrid[0:size, 0:size]
    t = ((xs + ys) / (2 * (size - 1)))[..., None]
    return Image.fromarray((c0 + (c1 - c0) * t).astype('uint8'), 'RGB')


def icon(size, shape, glyph_frac=0.58):
    big = size * SS
    base = gradient(big).convert('RGBA')
    draw_glyph(ImageDraw.Draw(base), big, glyph_frac * big / 190)
    mask = Image.new('L', (big, big), 0)
    md = ImageDraw.Draw(mask)
    if shape == 'round':
        md.ellipse([0, 0, big - 1, big - 1], fill=255)
    elif shape == 'rounded':
        md.rounded_rectangle([0, 0, big - 1, big - 1], radius=big * 0.22, fill=255)
    else:
        md.rectangle([0, 0, big, big], fill=255)
    base.putalpha(mask)
    return base.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    open(f'{RES}/drawable/ic_splash_glyph.xml', 'w').write(vector_xml(288, 0.62))
    open(f'{RES}/drawable/ic_launcher_foreground_vector.xml', 'w').write(vector_xml(108, 0.28))
    sizes = {'ldpi': 36, 'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for dpi, s in sizes.items():
        os.makedirs(f'{RES}/mipmap-{dpi}', exist_ok=True)
        icon(s, 'rounded').save(f'{RES}/mipmap-{dpi}/ic_launcher.png')
        icon(s, 'round').save(f'{RES}/mipmap-{dpi}/ic_launcher_round.png')
    icon(512, 'square', 0.56).convert('RGB').save(f'{RES}/playstore-icon.png')
    icon(512, 'square', 0.56).convert('RGB').save(f'{RES}/ic_launcher-web.png')
    print('done')
