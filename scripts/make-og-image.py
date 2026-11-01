#!/usr/bin/env python3
"""
Buat gambar Open Graph (1200x630) dari aset brand.

Jalankan:
  /home/khayzer/.workbuddy-ai/binaries/python/envs/default/bin/python3 \
      scripts/make-og-image.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630

# palet emerald senada dengan tema aplikasi
TOP = (6, 78, 59)      # emerald-900
BOT = (13, 115, 85)    # emerald-700
GOLD = (251, 191, 36)  # gold-400
MINT = (167, 243, 208)  # emerald-200


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def main():
    # latar gradien diagonal
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(TOP, BOT, y / H))

    # aksen lingkaran lembut di kanan atas
    glow = Image.new("L", (W, H), 0)
    dg = ImageDraw.Draw(glow)
    dg.ellipse((820, -220, 1420, 380), fill=26)
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(80))
    bg = Image.composite(Image.new("RGB", (W, H), (255, 255, 255)), bg, glow)

    dr = ImageDraw.Draw(bg)

    # garis emas tipis di bawah
    dr.rectangle((0, H - 8, W, H), fill=GOLD)

    # kartu putih membulat agar ikon gelap kontras di atas latar emerald
    size = 380
    pad = 34
    card_r = 56
    cx0 = 96 - pad
    cy0 = (H - size) // 2 - pad
    cx1 = 96 + size + pad
    cy1 = (H + size) // 2 + pad
    dr.rounded_rectangle((cx0, cy0, cx1, cy1), radius=card_r, fill=(255, 255, 255))
    # bayangan lembut di kanan-bawah kartu
    shadow = Image.new("L", (W, H), 0)
    ds = ImageDraw.Draw(shadow)
    ds.rounded_rectangle(
        (cx0 + 10, cy0 + 14, cx1 + 10, cy1 + 14), radius=card_r, fill=60
    )
    shadow = shadow.filter(
        __import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(18)
    )
    dark = Image.new("RGB", (W, H), (2, 44, 34))
    bg = Image.composite(dark, bg, shadow)
    dr = ImageDraw.Draw(bg)
    dr.rounded_rectangle((cx0, cy0, cx1, cy1), radius=card_r, fill=(255, 255, 255))

    # ikon
    icon = Image.open(ROOT / "public/icons/icon-512.png").convert("RGBA")
    icon = icon.resize((size, size), Image.LANCZOS)
    bg.paste(icon, (96, (H - size) // 2), icon)

    # teks
    font_big = ImageFont.truetype(ROOT / "assets/brand/PlusJakartaSans-Bold.ttf", 104)
    font_small = ImageFont.truetype(ROOT / "assets/brand/PlusJakartaSans-Bold.ttf", 30)

    x = 96 + size + 64
    dr.text((x, 208), "Cari", fill=(255, 255, 255), font=font_big)
    w_cari = dr.textlength("Cari", font=font_big)
    dr.text((x + w_cari, 208), "Ustadz", fill=MINT, font=font_big)

    dr.text((x, 356), "Temukan & booking ustadz", fill=(255, 255, 255), font=font_small)
    dr.text((x, 402), "dengan persetujuan manusia.", fill=MINT, font=font_small)

    # titik emas kecil sebagai aksen
    dr.ellipse((x + 2, 486, x + 14, 498), fill=GOLD)

    out = ROOT / "src/app/opengraph-image.png"
    bg.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  {W}x{H}")


if __name__ == "__main__":
    main()
