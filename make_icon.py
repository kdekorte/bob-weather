#!/usr/bin/env python3
"""
Generate resources/icons/app.png — weather dashboard icon, 512×512, RGBA.
Requires: pillow  (pip3 install pillow)
"""
import math
from PIL import Image, ImageDraw, ImageFilter

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

# ── Cloud (layered soft ellipses then sharp-edge fill) ────────────────────────
# Build cloud on its own RGBA layer so we can apply a slight blur for softness
cloud_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
cd = ImageDraw.Draw(cloud_layer)

def cloud_puff(cx, cy, rx, ry):
    cd.ellipse([(cx-rx, cy-ry), (cx+rx, cy+ry)], fill=WHITE)

cloud_puff(188, 262, 82, 66)   # left puff
cloud_puff(232, 242, 68, 58)   # top-left puff
cloud_puff(272, 286, 74, 58)   # right puff
cloud_puff(150, 294, 58, 50)   # far-left puff
# Flat bottom — rectangle to fill the underside flush
cd.rectangle([(100, 300), (344, 348)], fill=WHITE)

# Very slight blur to blend puffs into each other naturally
cloud_layer = cloud_layer.filter(ImageFilter.GaussianBlur(radius=4))
# Re-sharpen alpha: anything > threshold becomes opaque white
r, g, b, a = cloud_layer.split()
import PIL.ImageOps
# Set rgb channels back to white where alpha > 0
cloud_clean = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
cc = ImageDraw.Draw(cloud_clean)
cloud_puff2 = lambda cx, cy, rx, ry: cc.ellipse([(cx-rx, cy-ry), (cx+rx, cy+ry)], fill=WHITE)
cloud_puff2(188, 262, 82, 66)
cloud_puff2(232, 242, 68, 58)
cloud_puff2(272, 286, 74, 58)
cloud_puff2(150, 294, 58, 50)
cc.rectangle([(100, 300), (344, 348)], fill=WHITE)

img = Image.alpha_composite(img, cloud_clean)
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
