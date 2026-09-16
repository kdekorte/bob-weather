#!/usr/bin/env python3
"""
Generate resources/icons/app.png — weather dashboard app icon.

Follows actual macOS icon conventions (verified from real .icns files):
  • 1024 × 1024 px canvas  (icon_512x512@2x slot in the iconset)
  • Rounded-rect background with transparency OUTSIDE the squircle shape
  • Artwork fills the full canvas — no artificial padding/safe-zone inset
  • macOS squircle corner radius ≈ 22.5% of canvas width → ~230 px at 1024

Requires: pillow  (pip3 install pillow)
"""
import math
from PIL import Image, ImageDraw

# ── Canvas constants ──────────────────────────────────────────────────────────
CANVAS = 1024
# macOS squircle corner radius is ~22.5% of the icon size
CORNER = int(CANVAS * 0.225)   # ≈ 230 px

# ── Colours ───────────────────────────────────────────────────────────────────
BG    = (26,  42,  74,  255)   # #1a2a4a  dark navy
SUN   = (245, 200,  50, 255)   # golden yellow
WHITE = (255, 255, 255, 255)
RAIN  = (100, 180, 245, 255)   # sky blue

# ── Base canvas — transparent, then paint the squircle background ─────────────
img  = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.rounded_rectangle([(0, 0), (CANVAS-1, CANVAS-1)], radius=CORNER, fill=BG)

# ── Helper: scale a 0–1 fraction to an absolute pixel on the canvas ──────────
def S(v):
    return v * CANVAS

# ── Sun (upper-right quadrant) ────────────────────────────────────────────────
SX = S(0.63)
SY = S(0.25)
SR = CANVAS * 0.10   # ~103 px radius

# Rays
RAY_INNER = SR + CANVAS * 0.030
RAY_OUTER = SR + CANVAS * 0.090
RAY_W     = int(CANVAS * 0.018)
for deg in range(0, 360, 45):
    rad = math.radians(deg)
    x0 = SX + math.cos(rad) * RAY_INNER
    y0 = SY + math.sin(rad) * RAY_INNER
    x1 = SX + math.cos(rad) * RAY_OUTER
    y1 = SY + math.sin(rad) * RAY_OUTER
    draw.line([(x0, y0), (x1, y1)], fill=SUN, width=RAY_W)

# Sun disc
draw.ellipse([(SX-SR, SY-SR), (SX+SR, SY+SR)], fill=SUN)

# ── Cloud — pure overlapping circles, no rectangles ──────────────────────────
cloud = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
cc    = ImageDraw.Draw(cloud)

def puff(fx, fy, fr):
    cx = S(fx); cy = S(fy); r = CANVAS * fr
    cc.ellipse([(cx-r, cy-r), (cx+r, cy+r)], fill=WHITE)

# Bottom row — four circles that form the rounded base
puff(0.22, 0.65, 0.100)
puff(0.34, 0.68, 0.108)
puff(0.50, 0.68, 0.108)
puff(0.62, 0.65, 0.100)
# Mid-row bridge circles — seal the gap between upper and lower rows
puff(0.28, 0.60, 0.108)
puff(0.42, 0.59, 0.110)
puff(0.57, 0.60, 0.108)
# Upper puffs — bumpy top silhouette
puff(0.28, 0.50, 0.108)
puff(0.42, 0.43, 0.118)   # tallest centre puff
puff(0.57, 0.49, 0.105)

img = Image.alpha_composite(img, cloud)
draw = ImageDraw.Draw(img)

# ── Raindrops ─────────────────────────────────────────────────────────────────
RW = int(CANVAS * 0.017)   # drop width  ~17 px
RH = int(CANVAS * 0.026)   # drop height ~27 px
drop_fxs = [0.22, 0.34, 0.46, 0.58, 0.70]
for i, fx in enumerate(drop_fxs):
    dx = S(fx)
    dy = S(0.82 if i % 2 == 0 else 0.87)
    draw.ellipse([(dx-RW, dy-RH), (dx+RW, dy+RH)], fill=RAIN)

# ── Save ──────────────────────────────────────────────────────────────────────
img.save('resources/icons/app.png', 'PNG')
print(f"Written resources/icons/app.png  ({img.size[0]}×{img.size[1]})")
