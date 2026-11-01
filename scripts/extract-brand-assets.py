#!/usr/bin/env python3
"""
Ekstrak aset brand CariUstadz dari lembar koleksi ikon.

Sumber: assets/brand/icon-collection-src.jpg (lembar 1254x1254 berisi
4 karya: ikon squircle besar, 2 ikon lingkaran, dan lockup logo+teks).

Yang dihasilkan (semua latar transparan kecuali apple-icon):
  public/icons/mark.png          256px  ikon lingkaran versi penuh (header/footer)
  public/icons/mark-alt.png      256px  ikon lingkaran versi garis (alternatif)
  public/icons/lockup.png        h256px lockup logo + teks
  public/icons/icon-192.png      192px  ikon aplikasi (manifest)
  public/icons/icon-512.png      512px  ikon aplikasi (manifest)
  src/app/icon.png               512px  favicon modern (Next.js otomatis)
  src/app/apple-icon.png         180px  apple-touch-icon (latar putih, opak)
  src/app/favicon.ico            16/32/48

Jalankan:
  /home/khayzer/.workbuddy-ai/binaries/python/envs/default/bin/python3 \
      scripts/extract-brand-assets.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/brand/icon-collection-src.jpg"

# Bounding box hasil pengukuran (lihat catatan di bawah), plus margin kecil.
PIECES = {
    # nama: (x0, y0, x1, y1)
    "squircle": (256, 56, 994, 813),
    "circle1": (90, 851, 398, 1163),
    "circle2": (477, 853, 776, 1158),
    "lockup": (863, 903, 1164, 1159),
}

WHITE_T = 40  # ambang "dianggap putih": (255-r)+(255-g)+(255-b) <= T


def crop_tight(im: Image.Image, box, pad: int = 2) -> Image.Image:
    """Potong lalu rapatkan ke konten (buang margin kosong tersisa)."""
    piece = im.crop(box)
    bbox = piece.point(lambda p: 0)  # placeholder, dihitung ulang di bawah
    rgb = piece.convert("RGB")
    # mask konten = piksel cukup jauh dari putih
    gray = rgb.convert("L")
    mask = gray.point(lambda p: 255 if (255 - p) * 3 > WHITE_T else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise RuntimeError(f"tidak ada konten di {box}")
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(piece.width, x1 + pad)
    y1 = min(piece.height, y1 + pad)
    return piece.crop((x0, y0, x1, y1))


def remove_white_bg(piece: Image.Image) -> Image.Image:
    """Hapus latar putih yang tersambung ke tepi (flood fill), jadikan alpha.

    Isian putih di DALAM ikon (tertutup bentuk) tidak ikut terhapus karena
    flood fill hanya menjangkau latar yang tersambung ke tepi kanvas.
    """
    rgb = piece.convert("RGB")
    gray = rgb.convert("L")
    # 255 = dekat putih, 0 = konten
    near_white = gray.point(lambda p: 255 if (255 - p) * 3 <= WHITE_T * 3 else 0)

    # flood fill dari 4 sudut: nilai 128 = latar luar
    flood = near_white.copy()
    w, h = flood.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if flood.getpixel(seed) == 255:
            ImageDraw.floodfill(flood, seed, 128, thresh=0)

    alpha = flood.point(lambda p: 0 if p == 128 else 255)

    # rapikan pinggiran: erosi 1px lalu sedikit blur agar tepi halus
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def save_png(img: Image.Image, path: Path, size: int | None = None):
    out = img
    if size is not None and img.width != size:
        h = round(img.height * size / img.width)
        out = img.resize((size, h), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, optimize=True)
    print(f"  {path.relative_to(ROOT)}  {out.width}x{out.height}")


def main():
    im = Image.open(SRC).convert("RGB")
    print(f"Sumber: {SRC.name} {im.width}x{im.height}\n")

    pieces = {}
    for name, box in PIECES.items():
        tight = crop_tight(im, box)
        clean = remove_white_bg(tight)
        pieces[name] = clean
        print(f"{name:9s} dipotong {tight.width}x{tight.height}, latar dihapus")

    print("\nMenulis aset:")

    # --- ikon aplikasi (squircle) ---
    app = pieces["squircle"]
    # buat persegi (ambang sisi terpanjang) supaya tidak gepeng
    side = max(app.width, app.height)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(app, ((side - app.width) // 2, (side - app.height) // 2), app)

    save_png(square, ROOT / "public/icons/icon-512.png", 512)
    save_png(square, ROOT / "public/icons/icon-192.png", 192)
    save_png(square, ROOT / "src/app/icon.png", 512)

    # apple-touch-icon: iOS butuh opak (transparan jadi hitam di perangkat)
    apple = Image.new("RGB", (180, 180), (255, 255, 255))
    filled = square.resize((180, 180), Image.LANCZOS)
    apple.paste(filled, (0, 0), filled)
    apple.save(ROOT / "src/app/apple-icon.png", optimize=True)
    print(f"  src/app/apple-icon.png  180x180 (opak)")

    # favicon multi ukuran
    ico_path = ROOT / "src/app/favicon.ico"
    square.resize((48, 48), Image.LANCZOS).save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print(f"  src/app/favicon.ico  16/32/48")

    # --- mark lingkaran untuk header/footer ---
    save_png(pieces["circle1"], ROOT / "public/icons/mark.png", 256)
    save_png(pieces["circle2"], ROOT / "public/icons/mark-alt.png", 256)

    # --- lockup ---
    save_png(pieces["lockup"], ROOT / "public/icons/lockup.png", 512)

    print("\nSelesai.")


if __name__ == "__main__":
    main()
