"""
Siapkan avatar foto untuk chatbot:
1. Deteksi wajah + landmark (YuNet) pada kandidat terpilih
2. Potong wajah jadi oval dengan tepi lembut (PNG transparan)
3. Simpan metadata landmark ternormalisasi (0..1) untuk overlay animasi:
   posisi mata (untuk kedip), pusat & lebar mulut (untuk lip-sync),
   warna kulit di sekitar mata (untuk kelopak), warna bibir.
"""
import cv2, numpy as np, json, os

SRC = os.path.join(os.path.dirname(__file__), "..", ".cache", "avatar-src", "candidate_0.png")
MODEL = os.path.join(os.path.dirname(__file__), "..", ".cache", "yunet.onnx")
OUT_IMG = os.path.join(os.path.dirname(__file__), "..", "public", "avatar", "photo-face.png")
OUT_META = os.path.join(os.path.dirname(__file__), "..", "public", "avatar", "photo-face-meta.json")

img = cv2.imread(SRC)
h, w = img.shape[:2]
det = cv2.FaceDetectorYN_create(MODEL, "", (w, h), score_threshold=0.6)
ok, faces = det.detect(img)
assert faces is not None and len(faces) > 0, "wajah tidak terdeteksi"
faces = sorted(faces, key=lambda f: -f[2])
f = faces[0]
x, y, fw, fh = f[0:4]
lm = f[4:14].reshape(5, 2)  # mata kanan, mata kiri, hidung, sudut mulut kanan, sudut mulut kiri
re_ye, le_ye, nose, rm, lmc = lm

# --- ukuran potong: oval longgar di sekitar wajah ---
face_cx, face_cy = x + fw / 2, y + fh / 2
rad_w = fw * 0.78          # radius horizontal oval
rad_h = fh * 0.95          # radius vertikal (mencakup dagu + dahi)
cx0 = int(max(0, face_cx - rad_w)); cy0 = int(max(0, face_cy - rad_h))
cx1 = int(min(w, face_cx + rad_w)); cy1 = int(min(h, face_cy + rad_h))
crop = img[cy0:cy1, cx0:cx1].copy()
ch, cw = crop.shape[:2]

# --- mask oval dengan tepi lembut ---
mask = np.zeros((ch, cw), np.uint8)
ecx, ecy = face_cx - cx0, face_cy - cy0
cv2.ellipse(mask, (int(ecx), int(ecy)), (int(rad_w * 0.96), int(rad_h * 0.92)), 0, 0, 360, 255, -1)
mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=max(2, rad_w * 0.045))
rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
rgba[:, :, 3] = mask

# --- upscale ke lebar 640 supaya tajam saat ditampilkan 320-420px ---
scale = 640 / cw
final = cv2.resize(rgba, (640, int(ch * scale)), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(OUT_IMG, final)
fh2, fw2 = final.shape[:2]
sx, sy = fw2 / cw, fh2 / ch  # faktor skala crop -> final

def norm(px, py):
    return round(float((px - cx0) * sx / fw2), 4), round(float((py - cy0) * sy / fh2), 4)

def fl(v):
    return round(float(v), 4)

def sample_bgr(px, py, r=6):
    x0 = int(max(0, (px - cx0) * sx - r)); y0 = int(max(0, (py - cy0) * sy - r))
    x1 = int(min(fw2, (px - cx0) * sx + r)); y1 = int(min(fh2, (py - cy0) * sy + r))
    region = final[y0:y1, x0:x1, :3]
    b, g, rr = [int(v) for v in region.reshape(-1, 3).mean(axis=0)]
    return f"#{rr:02x}{g:02x}{b:02x}"

re_n = norm(*re_ye); le_n = norm(*le_ye); rm_n = norm(*rm); lm_n = norm(*lmc); nose_n = norm(*nose)
mouth_cx = (rm[0] + lmc[0]) / 2
mouth_cy = (rm[1] + lmc[1]) / 2
mouth_w = abs(lmc[0] - rm[0])
mc_n = norm(mouth_cx, mouth_cy)
meta = {
    "image": {"w": fw2, "h": fh2},
    "face": {"score": round(float(f[14]), 3)},
    "eyeR": {"x": re_n[0], "y": re_n[1]},
    "eyeL": {"x": le_n[0], "y": le_n[1]},
    "nose": {"x": nose_n[0], "y": nose_n[1]},
    "mouthCornerR": {"x": rm_n[0], "y": rm_n[1]},
    "mouthCornerL": {"x": lm_n[0], "y": lm_n[1]},
    "mouthCenter": {"x": mc_n[0], "y": mc_n[1]},
    "mouthWidthNorm": fl(mouth_w * sx / fw2),
    "eyeSpreadNorm": fl(abs(le_ye[0] - re_ye[0]) * sx / fw2),
    "eyeSizeNorm": fl(abs(le_ye[0] - re_ye[0]) * 0.16 * sx / fw2),
    "skinColor": sample_bgr((re_ye[0] + le_ye[0]) / 2, min(re_ye[1], le_ye[1]) - fh * 0.22),
    "lipColor": sample_bgr(mouth_cx, mouth_cy - fh * 0.015, 3),
}
os.makedirs(os.path.dirname(OUT_META), exist_ok=True)
with open(OUT_META, "w") as fp:
    json.dump(meta, fp, indent=2)
print(json.dumps(meta, indent=2))
print("saved:", OUT_IMG, f"{fw2}x{fh2}")
