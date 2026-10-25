"""Gets photos of the child's own monster drawings ready for the game: each
photo is cropped to the drawing, the table round the paper (and any specks
or printed logo) turns white, the paper is brightened to white with the
marker kept crisp, and the result is saved as a small JPEG, at most 480 px
on its longer side, for the dialog's framed picture (KID_MONSTERS in
js/kid-monsters.js).

    python tools/kid-drawings.py SRC_DIR            # SRC_DIR/1.jpg ... -> img/monsters/kidmon1.jpg ...
    python tools/kid-drawings.py SRC_DIR --out DIR  # somewhere else
    python tools/kid-drawings.py photo.jpg --name kidmon6   # one photo, its own name

A photo's number in its file name picks its monster (1.jpg, monster-2.png
-> kidmon1, kidmon2). Take the photo from straight above, the whole drawing
on it; a table or floor round the paper is fine. Needs Pillow and numpy.
"""
import argparse
import os
import re
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'img', 'monsters')
LONG_SIDE = 480  # the longer side of a saved drawing, in px
QUALITY = 75     # JPEG quality: about 10-20 KB a drawing
LOOK = 400       # the size of the copy the drawing is looked for in


def table_mask(rgb):
    """Wood, skin and floor round the paper: warm, coloured pixels joined to
    the photo's edge. A hole in the paper keeps its colour (it is not)."""
    hsv = np.asarray(Image.fromarray(rgb).convert('HSV')).astype(float) / 255
    hue = hsv[..., 0] * 360
    warm = (hue > 10) & (hue < 60) & (hsv[..., 1] > 0.12)
    h, w = warm.shape
    seen = np.zeros_like(warm)
    todo = deque((y, x) for y in range(h) for x in (0, w - 1) if warm[y, x])
    todo.extend((y, x) for x in range(w) for y in (0, h - 1) if warm[y, x])
    for y, x in todo:
        seen[y, x] = True
    while todo:
        y, x = todo.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            j, i = y + dy, x + dx
            if 0 <= j < h and 0 <= i < w and warm[j, i] and not seen[j, i]:
                seen[j, i] = True
                todo.append((j, i))
    return seen


def even_light(img, size):
    """Divides each colour by the paper's own brightness round it (the ink
    taken out with a max filter, then blurred), so shadows and a tinted
    paper all come out white."""
    paper = img.filter(ImageFilter.MaxFilter(size)).filter(ImageFilter.GaussianBlur(size))
    a = np.asarray(img).astype(float)
    b = np.maximum(np.asarray(paper).astype(float), 1)
    return np.clip(a / b, 0, 1)


def drawing_box(rgb, table):
    """The box round the marker lines, and the specks and the paper's
    printed logo outside it, which are left out: lines are joined up a
    little, and only pieces at least a twentieth the size of the biggest one
    make the box (little ones inside it, like eyes, stay)."""
    ink = (even_light(Image.fromarray(rgb), 9).mean(axis=2) < 0.6) & ~table
    ink = np.asarray(Image.fromarray(ink.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    h, w = ink.shape
    label = np.zeros((h, w), int)
    pieces = []
    for y0, x0 in zip(*np.nonzero(ink)):
        if label[y0, x0]:
            continue
        n = len(pieces) + 1
        label[y0, x0] = n
        todo = deque([(y0, x0)])
        box = [x0, y0, x0, y0]
        area = 0
        while todo:
            y, x = todo.popleft()
            area += 1
            box = [min(box[0], x), min(box[1], y), max(box[2], x), max(box[3], y)]
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                j, i = y + dy, x + dx
                if 0 <= j < h and 0 <= i < w and ink[j, i] and not label[j, i]:
                    label[j, i] = n
                    todo.append((j, i))
        pieces.append((area, box))
    if not pieces:
        return (0, 0, w, h), np.zeros((h, w), bool)
    big = max(a for a, _ in pieces)
    boxes = [b for a, b in pieces if a >= big / 20]
    box = min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes) + 1, max(b[3] for b in boxes) + 1
    out = [n + 1 for n, (_, b) in enumerate(pieces) if b[0] >= box[2] or b[2] < box[0] or b[1] >= box[3] or b[3] < box[1]]
    return box, np.isin(label, out)


def frame(box, w, h):
    """The box with a margin, widened (or made taller) to 3:4 where the photo
    has room, so every drawing sits the same way in its frame."""
    x0, y0, x1, y1 = box
    m = 0.07 * max(x1 - x0, y1 - y0)
    x0, y0, x1, y1 = x0 - m, y0 - m, x1 + m, y1 + m
    bw, bh = x1 - x0, y1 - y0
    if bw / bh < 3 / 4:
        x0, x1 = x0 - (bh * 3 / 4 - bw) / 2, x1 + (bh * 3 / 4 - bw) / 2
    else:
        y0, y1 = y0 - (bw * 4 / 3 - bh) / 2, y1 + (bw * 4 / 3 - bh) / 2
    # Slid back inside the photo, then cut to it.
    for lo, hi, size in ((0, 2, w), (1, 3, h)):
        b = [x0, y0, x1, y1]
        if b[lo] < 0:
            b[hi] -= b[lo]
            b[lo] = 0
        if b[hi] > size:
            b[lo] -= b[hi] - size
            b[hi] = size
        x0, y0, x1, y1 = max(0, b[0]), max(0, b[1]), min(w, b[2]), min(h, b[3])
    return round(x0), round(y0), round(x1), round(y1)


def prepare(src, dst):
    photo = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    k = LOOK / max(photo.size)
    small = np.asarray(photo.resize((round(photo.width * k), round(photo.height * k)), Image.LANCZOS))
    table = table_mask(small)
    lines, specks = drawing_box(small, table)
    box = frame(lines, *table.shape[::-1])
    crop = photo.crop(tuple(round(v / k) for v in box))
    s = LONG_SIDE / max(crop.size)
    if s < 1:
        crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
    # White paper, the marker darker and crisper but still its own colour.
    flat = even_light(crop, 15)
    out = np.clip((flat - 0.06) / (0.82 - 0.06), 0, 1) ** 1.15
    # The table left in the corners turns white too, softly at the paper's
    # edge, and so do the specks and the logo.
    gone = Image.fromarray((table | specks).astype(np.uint8) * 255).crop(box).resize(crop.size, Image.BILINEAR)
    gone = np.asarray(gone.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))).astype(float)[..., None] / 255
    out = out * (1 - gone) + gone
    img = Image.fromarray((out * 255).round().astype(np.uint8))
    img.save(dst, 'JPEG', quality=QUALITY, optimize=True)
    return img.size, os.path.getsize(dst)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', help='a folder of photos (1.jpg, 2.jpg ...) or one photo')
    ap.add_argument('--out', default=OUT, help='where the drawings go (img/monsters)')
    ap.add_argument('--name', help='the saved name for one photo, e.g. kidmon6')
    a = ap.parse_args()
    if os.path.isdir(a.src):
        photos = []
        for f in sorted(os.listdir(a.src)):
            m = re.search(r'(\d+)\.(jpe?g|png|webp)$', f, re.I)
            if m:
                photos.append((os.path.join(a.src, f), f'kidmon{int(m.group(1))}'))
    else:
        m = re.search(r'(\d+)\.\w+$', a.src)
        photos = [(a.src, a.name or (m and f'kidmon{int(m.group(1))}') or 'kidmon')]
    if not photos:
        sys.exit(f'no numbered photos in {a.src}')
    os.makedirs(a.out, exist_ok=True)
    for src, name in photos:
        dst = os.path.join(a.out, f'{name}.jpg')
        (w, h), size = prepare(src, dst)
        shown = os.path.relpath(dst, ROOT)
        print(f'{src} -> {dst if shown.startswith("..") else shown}  {w}x{h}  {size // 1024} KB')


if __name__ == '__main__':
    main()
