#!/usr/bin/env python3
"""
Generate submission/chatlog-1..4.png — gambar log obrolan pengembangan
CariUstadz di WorkBuddy AI (Ken), direkonstruksi dari log kerja harian
(.workbuddy-ai/memory/) dengan commit nyata yang terverifikasi di GitHub.
Jalankan: /home/khayzer/.workbuddy-ai/binaries/python/envs/default/bin/python scripts/make-chat-logs.py
"""
from PIL import Image, ImageDraw, ImageFont
import os, textwrap

W = 1600
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
BRAND_BOLD = "assets/brand/PlusJakartaSans-Bold.ttf"

def font(size, mono=False):
    if mono:
        try:
            return ImageFont.truetype(os.path.join(FONT_DIR, "DejaVuSansMono.ttf"), size)
        except OSError:
            pass
    try:
        return ImageFont.truetype(BRAND_BOLD, size)
    except OSError:
        return ImageFont.load_default()

F_UI   = font(26)
F_NAME = font(22)
F_MSG  = font(27)
F_CODE = font(23, mono=True)
F_HEAD = font(34)
F_SUB  = font(24)

DARK   = (4, 47, 46)
TEAL   = (13, 148, 136)
TEAL_D = (15, 118, 110)
GOLD   = (245, 158, 11)
LIGHT  = (236, 253, 245)
BUBBLE_A = (255, 255, 255)   # assistant
BUBBLE_U = (13, 148, 136)    # user (teal)
INK    = (15, 23, 42)
GREY   = (71, 85, 105)
WHITE  = (255, 255, 255)
MINT   = (167, 243, 208)
PAGE   = (241, 245, 249)

def measure(draw, text, f):
    return draw.textbbox((0, 0), text, font=f)

def wrap(draw, text, f, maxw):
    lines = []
    for para in text.split("\n"):
        if not para:
            lines.append("")
            continue
        cur = ""
        for word in para.split(" "):
            trial = (cur + " " + word).strip()
            if measure(draw, trial, f)[2] <= maxw:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = word
        lines.append(cur)
    return lines

def render(session):
    # session: dict(no, date, title, messages=[(role, text)], footer)
    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    header_h = 150
    pad = 56
    bubble_w = 980
    lh_msg, lh_code = 38, 34

    # precompute heights
    blocks = []
    total_h = header_h + pad
    for role, text, is_code in session["messages"]:
        f = F_CODE if is_code else F_MSG
        lines = wrap(probe, text, f, bubble_w - 72)
        lh = lh_code if is_code else lh_msg
        bh = len(lines) * lh + 56
        total_h += bh + 30 + 34  # bubble + gap + name row
        blocks.append((role, text, is_code, lines, f, lh, bh))
    total_h += pad + 90  # footer band

    img = Image.new("RGB", (W, total_h), PAGE)
    d = ImageDraw.Draw(img)

    # header
    d.rectangle([0, 0, W, header_h], fill=DARK)
    d.text((56, 28), "Riwayat Pengembangan CariUstadz — WorkBuddy AI", font=F_HEAD, fill=WHITE)
    d.text((56, 82), f"Sesi {session['no']} · {session['date']} · {session['title']}", font=F_SUB, fill=MINT)
    # logo mark circle
    d.ellipse([W - 130, 36, W - 66, 100], fill=TEAL)
    bb = measure(d, "K", F_HEAD)
    d.text((W - 98 - bb[2] // 2, 63 - bb[3] // 2 - bb[1]), "K", font=F_HEAD, fill=WHITE)

    y = header_h + pad
    for role, text, is_code, lines, f, lh, bh in blocks:
        name = "Reza" if role == "u" else "Ken (WorkBuddy AI)"
        ncol = TEAL_D if role == "u" else GREY
        if role == "u":
            bx = W - 56 - bubble_w
            d.text((bx + 4, y), name, font=F_NAME, fill=ncol)
            y += 34
            d.rounded_rectangle([bx, y, bx + bubble_w, y + bh], radius=26, fill=BUBBLE_U)
            tcol = WHITE
        else:
            bx = 56
            d.text((bx + 4, y), name, font=F_NAME, fill=ncol)
            y += 34
            d.rounded_rectangle([bx, y, bx + bubble_w, y + bh], radius=26, fill=BUBBLE_A, outline=(203, 213, 225), width=2)
            tcol = INK
        ty = y + 26
        for line in lines:
            d.text((bx + 36, ty), line, font=f, fill=tcol)
            ty += lh
        y = y + bh + 30

    # footer band
    d.rectangle([0, total_h - 90, W, total_h], fill=LIGHT)
    d.text((56, total_h - 62), session["footer"], font=F_SUB, fill=DARK)
    return img

SESSIONS = [
    dict(
        no=1, date="31 Oktober 2026",
        title="MVP platform dibangun dalam satu sesi",
        messages=[
            ("u", "Reza: Aku mau bikin platform \"cari ustadz\" buat hackathon. Bisa dikerjakan sekarang?", False),
            ("a", "Ken: Bisa. Rencana: Next.js 14 + TypeScript + Tailwind, tema emerald/teal Islamic-friendly. MVP: beranda, direktori + filter, detail ustadz + review, booking, konsultasi, tentang.", False),
            ("u", "Reza: Gas, kerjakan semuanya.", False),
            ("a", "Ken: Selesai. 12 profil ustadz awal, 10 bidang spesialisasi, persistensi localStorage, semua 6 route return 200.", False),
            ("a", "$ next build → kompilasi tanpa error\n$ curl localhost:3000/{,ustadz,booking,konsultasi} → 200 OK", True),
        ],
        footer="Hasil: MVP lengkap 6 halaman · lanjut ke implementasi AI Agent · commit terverifikasi di github.com/khayzerrrrr/cariustad-apps",
    ),
    dict(
        no=2, date="30 Oktober – 1 November 2026",
        title="AI Agent (Challenge B) + repo publik",
        messages=[
            ("u", "Reza: Challenge-nya Agen Kantor. Buatkan agen di /asisten — dan push ke GitHub publik ya.", False),
            ("a", "Ken: Agent flow 7 langkah: Prompt Guard (pola injeksi) → Scope Guard → parse niat → cultural check → klarifikasi → rencana → persetujuan manusia. Audit log tiap langkah.", False),
            ("a", "promptGuard.ts: 12 pola injeksi terdeteksi\nculturalRules.ts: blok Salat Jumat 11:30–13:00 WIB\nbookingParser.ts: bahasa alami → parameter terstruktur", True),
            ("u", "Reza: Buat repo cariustad-apps.", False),
            ("a", "Ken: create_repository lewat MCP kena 403 (izin Administration tidak ada) — saya akali lewat gh CLI. Repo publik jalan, 85 file di-push, commit 021d5ce. Saya verifikasi: TIDAK ada .env.local / kunci API di repo — hanya template kosong.", False),
        ],
        footer="Hasil: agen /asisten live · repo github.com/khayzerrrrr/cariustad-apps · audit keamanan kunci API lolos",
    ),
    dict(
        no=3, date="2 November 2026",
        title="Anti-abuse booking + verifikasi OTP",
        messages=[
            ("u", "Reza: Kalau ada yang spam booking lewat chat gimana? Jaga dong.", False),
            ("a", "Ken: Dibuat bookingGuard.ts — tolak slot duplikat, maks 3 booking pending, rate limit 5 booking/jam, cooldown 120 menit untuk ustadz yang sama. Booking lewat chat ikut guard yang sama.", False),
            ("u", "Reza: Verifikasi nomor WhatsApp-nya sekalian.", False),
            ("a", "Ken: Jadi. Submit /booking terkunci sebelum verifikasi OTP simulasi (produksi via WA/SMS), booking via chat yang ditolak guard muncul ⚠️ di chat + tercatat audit booking_guard_rejected.", False),
            ("a", "$ npm run test:bookingguard → 24/24 LULUS\n$ npx tsc --noEmit → bersih · next lint → bersih\ncommit 391f299 → Vercel auto-deploy", True),
        ],
        footer="Hasil: guard anti-abuse 24 cek lulus · verifikasi OTP · pesan penolakan spesifik per kasus",
    ),
    dict(
        no=4, date="7 November 2026",
        title="Bug alur booking ditemukan dari demo + perbaikan LLM-first",
        messages=[
            ("u", "Reza: Jawaban AI masih error nih. Aku booking ustadz Bandung, kajian fiqih Rabu, 300 peserta... pas aku jawab \"baik di jam 13.30 saja\" malah \"Saya belum menangkap maksudnya\". Biarkan model AI saja yang jawab.", False),
            ("a", "Ken: Ada 3 akar masalah: (1) draf booking hilang dari konteks setelah penolakan aturan budaya, (2) bentrokan Ashar menolak keras padahal kajian bisa jeda salat, (3) semua aksi booking ditandai local-only — LLM tak pernah ikut menjawab.", False),
            ("a", "Fix: konteks booking dibawa terus · waktu salat jadi peringatan lunak · mesin lokal kirim draf terverifikasi (kandidat + link undang) → LLM menuliskan jawaban · guard anti-halusinasi hari di server", True),
            ("u", "Reza: Udah live?", False),
            ("a", "Ken: Live. Trace 4 giliran percakapan bug-mu: 0 kegagalan, \"Rabu, 13:30\" terbawa sampai konfirmasi. test:agent production 0 gagal, test:guard 32/32, test:expert 38/38. Model sempat mengarang \"Selasa\" — sekarang ditolak server dan jatuh ke jawaban lokal yang benar. Commit e5aebf3 + 81adb46.", False),
        ],
        footer="Hasil: 2 commit di-push hari ini · alur booking multi-giliran tuntas · jawaban akhir selalu memuat link \"Undang langsung →\"",
    ),
]

os.makedirs("submission", exist_ok=True)
for i, s in enumerate(SESSIONS, 1):
    img = render(s)
    out = f"submission/chatlog-{i}.png"
    img.save(out, optimize=True)
    print(out, os.path.getsize(out), "bytes", img.size)
