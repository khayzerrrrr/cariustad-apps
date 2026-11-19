#!/usr/bin/env python3
"""
Generate submission/DIAGRAM_ARSITEKTUR.pptx — deck diagram arsitektur
CariUstadz untuk formulir submisi hackathon.
Jalankan: /home/khayzer/.workbuddy-ai/binaries/python/envs/default/bin/python scripts/make-submission-pptx.py
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---- palet (tema emerald CariUstadz) ----
DARK   = RGBColor(0x04, 0x2F, 0x2E)   # emerald-950
TEAL   = RGBColor(0x0D, 0x94, 0x88)   # teal-600
EMER   = RGBColor(0x05, 0x96, 0x69)   # emerald-600
GOLD   = RGBColor(0xF5, 0x9E, 0x0B)   # amber-500 (aksen penting)
GOLD_D = RGBColor(0xB4, 0x530, 0x09) if False else RGBColor(0xB4, 0x53, 0x09)
LIGHT  = RGBColor(0xEC, 0xFD, 0xF5)   # emerald-50
INK    = RGBColor(0x0F, 0x17, 0x2A)   # slate-900
GREY   = RGBColor(0x47, 0x55, 0x69)   # slate-600
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
MINT   = RGBColor(0xA7, 0xF3, 0xD0)   # emerald-200

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]


def box(slide, x, y, w, h, text, fill=LIGHT, line=None, color=INK, size=13,
        bold=False, align=PP_ALIGN.LEFT, radius=True, anchor=MSO_ANCHOR.MIDDLE,
        font="Verdana"):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    if line:
        shp.line.color.rgb = line
        shp.line.width = Pt(1.25)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    tf = shp.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = Inches(0.12)
    tf.margin_right = Inches(0.12)
    tf.margin_top = Inches(0.05)
    tf.margin_bottom = Inches(0.05)
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = font
    return shp


def label(slide, x, y, w, text, size=13, color=GREY, bold=False, align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = "Verdana"
    return tb


def arrow(slide, x, y, w=0.34, color=TEAL):
    shp = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x), Inches(y), Inches(w), Inches(0.22))
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    shp.line.fill.background()
    shp.shadow.inherit = False
    return shp


def header(slide, title, sub=""):
    box(slide, 0, 0, 13.333, 0.95, "", fill=DARK, radius=False)
    label(slide, 0.55, 0.14, 11.5, title, size=22, color=WHITE, bold=True)
    if sub:
        label(slide, 0.55, 0.58, 12.0, sub, size=12, color=MINT)


def bg(slide, color=WHITE):
    box(slide, 0, 0, 13.333, 7.5, "", fill=color, radius=False)


# ================= SLIDE 1 — JUDUL =================
s = prs.slides.add_slide(BLANK)
bg(s, DARK)
box(s, 0, 0, 13.333, 7.5, "", fill=DARK, radius=False)
label(s, 0.9, 1.5, 11.5, "TENCENT CLOUD HACKATHON — INDONESIA", size=15, color=MINT, bold=True)
label(s, 0.9, 2.0, 11.5, "CariUstadz", size=54, color=WHITE, bold=True)
label(s, 0.9, 3.1, 11.5, "Alur Agent & Trust Boundary", size=28, color=GOLD, bold=True)
label(s, 0.9, 3.9, 11.8,
      "Agen yang mengubah percakapan menjadi tindakan: cari ustadz, cek aturan budaya Islam, "
      "susun rencana — dan berhenti menunggu persetujuan manusia sebelum mengeksekusi.",
      size=14, color=WHITE)
box(s, 0.9, 5.0, 3.3, 0.55, "Challenge B — Agen Kantor", fill=TEAL, color=WHITE, size=13, bold=True, align=PP_ALIGN.CENTER)
box(s, 4.4, 5.0, 3.3, 0.55, "cariustad-apps.vercel.app", fill=RGBColor(0x0F, 0x766, 0x5F) if False else RGBColor(0x0F, 0x76, 0x6E), color=WHITE, size=13, align=PP_ALIGN.CENTER)
box(s, 7.9, 5.0, 3.6, 0.55, "github.com/khayzerrrrr/cariustad-apps", fill=RGBColor(0x0F, 0x76, 0x6E), color=WHITE, size=12, align=PP_ALIGN.CENTER)
label(s, 0.9, 6.6, 11.5, "Next.js 14 · TypeScript · DeepSeek/OpenRouter · Mesin aturan lokal deterministik", size=12, color=MINT)

# ================= SLIDE 2 — ALUR 11 LANGKAH =================
s = prs.slides.add_slide(BLANK)
bg(s)
header(s, "Alur Agent — 11 Langkah", "Setiap langkah deterministik kecuali penyusunan bahasa; persetujuan manusia adalah titik henti wajib.")

steps = [
    ("1. Input", "Percakapan bahasa alami di /asisten"),
    ("2. Prompt Guard", "23 pola injeksi (ID+EN) ditolak"),
    ("3. Scope Guard", "Batas domain; dalil → Mode Hafizh"),
    ("4. Parse Niat", "Booking parser: hari, jam, kota, peserta"),
    ("5. Cari Ustadz", "Katalog 483 profil, filter bidang/kota"),
    ("6. Cultural Rules", "Salat Jumat, waktu salat, gender"),
    ("7. Klarifikasi", "Tanya SATU hal yang kurang"),
    ("8. Susun Rencana", "Kandidat + link undang + peringatan"),
    ("9. PERSETUJUAN", "Titik henti wajib — kata 'setuju'"),
    ("10. Eksekusi", "Status confirmed di halaman Booking"),
    ("11. Audit Log", "Waktu, keputusan, alasan tercatat"),
]
cols, cw, ch = 4, 2.85, 1.28
x0, y0, gx, gy = 0.55, 1.5, 0.32, 0.42
for i, (t, d) in enumerate(steps):
    col, row = i % cols, i // cols
    x = x0 + col * (cw + gx)
    y = y0 + row * (ch + gy)
    is_stop = (i == 8)
    box(s, x, y, cw, ch, "", fill=GOLD if is_stop else LIGHT,
        line=GOLD_D if is_stop else TEAL)
    label(s, x + 0.12, y + 0.10, cw - 0.24, t, size=13,
          color=RGBColor(0x7C, 0x2D, 0x12) if is_stop else DARK, bold=True)
    label(s, x + 0.12, y + 0.48, cw - 0.24, d, size=10.5,
          color=RGBColor(0x7C, 0x2D, 0x12) if is_stop else GREY)
label(s, x0, y0 + 3 * (ch + gy) + 0.12, 12.3,
      "Langkah 9 (emas) tidak punya jalur pintas: tidak ada kode yang mengeksekusi booking tanpa persetujuan. "
      "Permintaan 'langsung booking tanpa konfirmasi' justru terdeteksi sebagai upaya melewati persetujuan.",
      size=12, color=INK, bold=True)

# ================= SLIDE 3 — ARSITEKTUR TEKNIS =================
s = prs.slides.add_slide(BLANK)
bg(s)
header(s, "Arsitektur Teknis", "Kunci API hanya di server; seluruh jawaban LLM melewati gerbang terverifikasi.")

# kolom kiri: klien & server
box(s, 0.55, 1.45, 5.9, 1.5, "", fill=LIGHT, line=TEAL)
label(s, 0.75, 1.58, 5.5, "BROWSER — /asisten", size=13, color=DARK, bold=True)
label(s, 0.75, 1.95, 5.5,
      "UI chat + avatar lip-sync (Web Speech API) · audit log (localStorage) · "
      "answerEngine: draf terverifikasi → LLM → validasi → fallback lokal",
      size=11, color=GREY)

arrow(s, 3.4, 3.12)

box(s, 0.55, 3.45, 5.9, 1.9, "", fill=LIGHT, line=TEAL)
label(s, 0.75, 3.58, 5.5, "SERVER — Next.js Route Handlers", size=13, color=DARK, bold=True)
label(s, 0.75, 3.95, 5.5,
      "/api/llm  → Prompt Guard → Scope Guard → LLM Router (DeepSeek → OpenRouter) → "
      "validasi keluaran (nama halusinasi & hari yang dikarang ditolak 422)\n"
      "/api/chat → mesin aturan lokal (jalur cadangan deterministik)",
      size=11, color=GREY)

arrow(s, 3.4, 5.52)

box(s, 0.55, 5.95, 5.9, 1.15, "", fill=DARK)
label(s, 0.75, 6.08, 5.5, "DATA TERVERIFIKASI (sumber kebenaran)", size=12, color=MINT, bold=True)
label(s, 0.75, 6.45, 5.5,
      "483 profil ustadz/ustadzah, 54 kota · dalil-db: 26+ kutipan ayat/hadis shahih "
      "dengan tautan verifikasi · aturan budaya dalam kode",
      size=11, color=WHITE)

# kolom kanan: bagaimana prompt mendorong generasi AI
box(s, 6.95, 1.45, 5.85, 5.65, "", fill=RGBColor(0xF8, 0xFA, 0xFC), line=TEAL)
label(s, 7.15, 1.58, 5.5, "BAGAIMANA PROMPT MENDORONG GENERASI AI", size=13, color=DARK, bold=True)
prompt_layers = [
    ("1. Draf final dari mesin lokal", "Kandidat ustadz, urutan, link undang, peringatan waktu sudah final — model hanya menuliskan ulang."),
    ("2. System prompt bertingkat", "Tanpa data → grounded prompt. Dengan data → aturan 'jawab HANYA dari baris terverifikasi'."),
    ("3. Aturan anti-halusinasi", "Dilarang mengubah angka/nama/hari; detail yang tidak tertulis = tidak ada."),
    ("4. Validasi setelah generasi", "Nama ustadz tak dikenal dan hari yang dikarang → 422 → jawaban lokal yang benar dipakai."),
    ("5. Mode Ustadz Hafizh", "Kutipan dalil dikunci pada dataset terverifikasi; di luar itu → rujuk ustadz."),
]
yy = 2.0
for t, d in prompt_layers:
    box(s, 7.15, yy, 0.34, 0.34, str(prompt_layers.index((t, d)) + 1), fill=TEAL, color=WHITE, size=12, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    label(s, 7.62, yy - 0.02, 5.0, t, size=12, color=INK, bold=True)
    label(s, 7.62, yy + 0.28, 5.0, d, size=10.5, color=GREY)
    yy += 1.02

# ================= SLIDE 4 — PERTAHANAN BERLAPIS =================
s = prs.slides.add_slide(BLANK)
bg(s)
header(s, "Pertahanan Berlapis", "Lapisan probabilistik (system prompt) sengaja paling dalam — jika model gagal patuh, lapisan 1–3 sudah menahan.")

layers = [
    ("1", "Prompt Guard — 23 pola injeksi (ID + EN)", "Deterministik", EMER),
    ("2", "Scope Guard — klasifikasi batas domain (fatwa, off-topic)", "Deterministik", EMER),
    ("3", "Cultural Rules — Salat Jumat, waktu salat, preferensi gender", "Deterministik", EMER),
    ("3b", "Dalil Grounding — kutipan hanya dari dalil-db terverifikasi", "Deterministik", EMER),
    ("4", "System prompt — instruksi perilaku model", "Probabilistik", GOLD),
    ("5", "Validasi keluaran — nama halusinasi, hari dikarang, kontak", "Deterministik", EMER),
]
y = 1.55
for num, desc, kind, colr in layers:
    box(s, 0.55, y, 0.75, 0.72, num, fill=colr, color=WHITE, size=15, bold=True, align=PP_ALIGN.CENTER)
    box(s, 1.35, y, 8.6, 0.72, desc, fill=LIGHT, color=INK, size=13, bold=False)
    box(s, 10.0, y, 2.75, 0.72, kind, fill=colr, color=WHITE, size=12, bold=True, align=PP_ALIGN.CENTER)
    y += 0.87
label(s, 0.55, y + 0.1, 12.2,
      "Penolakan dibuat SEBELUM panggilan LLM: 5 dari 7 jalur uji tidak memanggil model sama sekali — "
      "penolakan tidak bisa dinegosiasikan lewat prompt, biaya per penolakan nol.",
      size=12, color=INK, bold=True)

# ================= SLIDE 5 — AKUNTABILITAS & PENGUJIAN =================
s = prs.slides.add_slide(BLANK)
bg(s)
header(s, "Akuntabilitas & Verifikasi", "Manusia memegang keputusan akhir; setiap klaim bisa diuji ulang.")

box(s, 0.55, 1.5, 5.9, 2.6, "", fill=LIGHT, line=TEAL)
label(s, 0.75, 1.62, 5.5, "TRUST BOUNDARY", size=13, color=DARK, bold=True)
label(s, 0.75, 1.98, 5.5,
      "• Rencana booking ditampilkan dulu — eksekusi hanya setelah 'setuju'\n"
      "• Kontak ustadz baru dibuka setelah konfirmasi\n"
      "• Agen menolak berfatwa — talak, waris, dosa → dirujuk ustadz\n"
      "• Audit log bisa dibuka pengguna dari /asisten",
      size=11.5, color=GREY)

box(s, 6.85, 1.5, 5.9, 2.6, "", fill=LIGHT, line=TEAL)
label(s, 7.05, 1.62, 5.5, "PENGUJIAN OTOMATIS — 118 PEMERIKSAAN", size=13, color=DARK, bold=True)
label(s, 7.05, 1.98, 5.5,
      "test:http 22 · test:agent 11 skenario · test:guard 32\n"
      "test:expert 38 · test:voice 12 · test:lipsync 8\n"
      "Semua lulus pada commit yang disubmit, diuji langsung\n"
      "terhadap production cariustad-apps.vercel.app",
      size=11.5, color=GREY)

box(s, 0.55, 4.4, 12.2, 2.35, "", fill=DARK)
label(s, 0.8, 4.55, 11.7, "REPRODUKSI", size=13, color=MINT, bold=True)
label(s, 0.8, 4.95, 11.7,
      "git clone https://github.com/khayzerrrrr/cariustad-apps && cd cariustad-apps && npm install && npm run dev\n"
      "Buka http://localhost:3000/asisten — tanpa kunci API pun berjalan dengan mesin aturan lokal.\n\n"
      "Uji production:  BASE_URL=https://cariustad-apps.vercel.app npm run test:http && npm run test:agent",
      size=12, color=WHITE)
label(s, 0.8, 6.45, 11.7, "Demo: https://cariustad-apps.vercel.app/asisten", size=12, color=GOLD, bold=True)

prs.save("submission/DIAGRAM_ARSITEKTUR.pptx")
import os
print("OK", os.path.getsize("submission/DIAGRAM_ARSITEKTUR.pptx"), "bytes")
