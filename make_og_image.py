#!/usr/bin/env python3
"""
Generate the Open Graph preview image (og-image.png) for the chem study site.
Re-run: `python3 make_og_image.py`. Output: 1200x630 PNG.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "og-image.png")

# --- Palette (matches site CSS) ---
BG_TOP    = (15, 23, 42)
BG_BOT    = (5, 9, 22)
ACCENT    = (56, 189, 248)
INDIGO    = (129, 140, 248)
GREEN     = (74, 222, 128)
ORANGE    = (251, 191, 36)
PURPLE    = (192, 132, 252)
WHITE     = (248, 250, 252)
DIM       = (148, 163, 184)
GRID      = (51, 65, 85)

FONT_BOLD = "/System/Library/Fonts/Helvetica.ttc"   # index 1 = Bold
FONT_REG  = "/System/Library/Fonts/Helvetica.ttc"   # index 0 = Regular

def load(size, weight="bold"):
    try:
        idx = 1 if weight == "bold" else 0
        return ImageFont.truetype(FONT_BOLD, size, index=idx)
    except Exception:
        return ImageFont.load_default()

# --- Canvas + gradient background ---
img = Image.new("RGB", (W, H), BG_TOP)
draw = ImageDraw.Draw(img, "RGBA")
for y in range(H):
    t = y / H
    r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
    g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
    b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Soft radial glow centered on the atom
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
cx, cy = 920, 320
for r in range(440, 0, -22):
    alpha = max(0, int(50 * (1 - r / 440)))
    gdraw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(56, 189, 248, alpha))
glow = glow.filter(ImageFilter.GaussianBlur(34))
img = Image.alpha_composite(img.convert("RGBA"), glow)
draw = ImageDraw.Draw(img, "RGBA")

# Faint periodic-table grid backdrop
cell = 92
gap = 8
for row in range(7):
    for col in range(13):
        x = col * (cell + gap) + 24
        y = row * (cell + gap) + 24
        if x > W or y > H: continue
        draw.rounded_rectangle(
            (x, y, x + cell, y + cell),
            radius=10,
            outline=(GRID[0], GRID[1], GRID[2], 50),
            width=1,
        )

# --- Atom illustration ---
def draw_orbit(rx, ry, angle_deg, color):
    pad = 36
    layer = Image.new("RGBA", (rx * 2 + pad * 2, ry * 2 + pad * 2), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.ellipse((pad, pad, pad + rx * 2, pad + ry * 2), outline=color + (220,), width=5)
    # Electron at rightmost point of ellipse, will rotate with it
    ex = pad + rx * 2
    ey = pad + ry
    er = 14
    ld.ellipse((ex - er, ey - er, ex + er, ey + er),
               fill=color + (255,), outline=(255, 255, 255, 235), width=3)
    layer = layer.rotate(angle_deg, resample=Image.BICUBIC, expand=False)
    img.paste(layer, (cx - layer.width // 2, cy - layer.height // 2), layer)

# Three orbits (drawn before the nucleus so the nucleus sits on top)
draw_orbit(190, 76,  30,  ACCENT)
draw_orbit(190, 76, -30,  PURPLE)
draw_orbit(190, 76,  90,  GREEN)

# Nucleus (drawn last, on top of the orbits)
draw = ImageDraw.Draw(img, "RGBA")
nuc_r = 44
draw.ellipse((cx - nuc_r, cy - nuc_r, cx + nuc_r, cy + nuc_r),
             fill=(56, 189, 248, 255), outline=(255, 255, 255, 240), width=5)
draw.ellipse((cx - 16, cy - 18, cx, cy - 2), fill=(255, 255, 255, 110))

# --- Element-card chip (top-right) ---
ec_x, ec_y = 1010, 50
ec_w, ec_h = 150, 180
draw.rounded_rectangle((ec_x, ec_y, ec_x + ec_w, ec_y + ec_h),
                       radius=16, fill=(30, 41, 59, 240),
                       outline=ACCENT + (220,), width=3)
draw.text((ec_x + 16, ec_y + 12), "9", fill=ACCENT, font=load(22))
sym_font = load(82)
sym_tb = draw.textbbox((0, 0), "Cf", font=sym_font)
sym_w = sym_tb[2] - sym_tb[0]
draw.text((ec_x + (ec_w - sym_w) // 2, ec_y + 38), "Cf", fill=WHITE, font=sym_font)
name_font = load(20)
n_tb = draw.textbbox((0, 0), "Chem", font=name_font)
n_w = n_tb[2] - n_tb[0]
draw.text((ec_x + (ec_w - n_w) // 2, ec_y + 128), "Chem", fill=DIM, font=name_font)
w_font = load(16, "regular")
w_tb = draw.textbbox((0, 0), "Final", font=w_font)
w_w = w_tb[2] - w_tb[0]
draw.text((ec_x + (ec_w - w_w) // 2, ec_y + 152), "Final", fill=DIM, font=w_font)

# --- Left-side title block ---
LEFT = 70

# Pill: "SPRING 2026 · STUDY HUB"
font_pill = load(22)
pill_text = "SPRING 2026  ·  STUDY HUB"
ptb = draw.textbbox((0, 0), pill_text, font=font_pill)
pw, ph = ptb[2] - ptb[0], ptb[3] - ptb[1]
pill_y = 90
pill_h = ph + 20
draw.rounded_rectangle(
    (LEFT, pill_y, LEFT + pw + 36, pill_y + pill_h),
    radius=pill_h // 2,
    fill=(30, 41, 59, 235),
    outline=ACCENT + (235,), width=2,
)
draw.text((LEFT + 18, pill_y + 8), pill_text, fill=ACCENT, font=font_pill)

# Big title — "Chemistry" white, "Final" accent — stacked
font_title = load(112)
y_chem_top = pill_y + pill_h + 22
draw.text((LEFT, y_chem_top), "Chemistry", fill=WHITE, font=font_title)
y_final = y_chem_top + 122
draw.text((LEFT, y_final), "Final", fill=ACCENT, font=font_title)

# Underline accent bar
draw.rounded_rectangle((LEFT, y_final + 130, LEFT + 86, y_final + 138),
                       radius=4, fill=ACCENT + (255,))

# Subtitle
font_sub = load(28, "regular")
sub_text = "9 modules  ·  cumulative exam  ·  scoring & streaks"
draw.text((LEFT, y_final + 152), sub_text, fill=DIM, font=font_sub)

# Save
img = img.convert("RGB")
img.save(OUT, "PNG", optimize=True)
print(f"Saved {OUT} ({os.path.getsize(OUT) // 1024} KB)")
