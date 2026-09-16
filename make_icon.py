#!/usr/bin/env python3
"""
Generate resources/icons/app.png — weather dashboard icon, 512×512, RGBA.
Requires: pillow  (pip3 install pillow)
"""
import math
from PIL import Image, ImageDraw

SIZE   = 512
CORNER = 96   # rounded-rect corner radius

# ── Colours ───────────────────────────────────────────────────────────────────
BG    = (26,  42,  74,  255)   # #1a2a4a  dark navy
SUN   = (245, 200,  50, 255)   # golden yellow
WHITE = (255, 255, 255, 255)
RAIN  = (100, 180, 245, 255)   # sky blue

# ── Base canvas (transparent) ──────────────────────────────────────────────────
img  = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# ── Rounded-rect background (drawn as a filled rounded rectangle) ──────────────
draw.rounded_rectangle([(0, 0), (SIZE-1, SIZE-1)], radius=CORNER, fill=BG)

# ── Sun ───────────────────────────────────────────────────────────────────────
SX, SY, SR = 340, 152, 56    # centre x, y; radius

# Rays: 8 directions
RAY_INNER = SR + 14
RAY_OUTER = SR + 44
RAY_W     = 11
for deg in range(0, 360, 45):
    rad = math.radians(deg)
    x0 = SX + math.cos(rad) * RAY_INNER
    y0 = SY + math.sin(rad) * RAY_INNER
    x1 = SX + math.cos(rad) * RAY_OUTER
    y1 = SY + math.sin(rad) * RAY_OUTER
    draw.line([(x0, y0), (x1, y1)], fill=SUN, width=RAY_W)

# Sun disc on top of rays
draw.ellipse([(SX-SR, SY-SR), (SX+SR, SY+SR)], fill=SUN)

# ── Cloud — pure circles only, no rectangles ─────────────────────────────────
cloud = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
cc = ImageDraw.Draw(cloud)

def puff(cx, cy, r):
    cc.ellipse([(cx-r, cy-r), (cx+r, cy+r)], fill=WHITE)

# Row of circles along the bottom edge (forms the flat-ish base)
puff(148, 310, 52)   # far left base
puff(200, 318, 56)   # left-centre base
puff(256, 318, 56)   # centre base
puff(312, 310, 52)   # right base
# Upper puffs that give the cloud its bumpy top
puff(176, 270, 58)   # left upper
puff(232, 248, 64)   # centre top (tallest)
puff(288, 268, 56)   # right upper

img = Image.alpha_composite(img, cloud)
draw = ImageDraw.Draw(img)   # refresh draw handle

# ── Raindrops ─────────────────────────────────────────────────────────────────
drop_xs = [148, 196, 244, 292, 340]
for i, dx in enumerate(drop_xs):
    dy = 392 if i % 2 == 0 else 414
    rw, rh = 10, 15
    draw.ellipse([(dx-rw, dy-rh), (dx+rw, dy+rh)], fill=RAIN)

# ── Save ──────────────────────────────────────────────────────────────────────
img.save('resources/icons/app.png', 'PNG')
print(f"Written resources/icons/app.png  ({img.size[0]}×{img.size[1]})")
