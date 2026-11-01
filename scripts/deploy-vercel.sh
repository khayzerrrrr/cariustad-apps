#!/usr/bin/env bash
# Deploy CariUstadz ke Vercel — production.
#
# Prasyarat: sudah `vercel login` (sekali saja).
# Skrip ini: link project -> setel env var dari .env.local -> deploy production.
#
# Pemakaian:
#   bash scripts/deploy-vercel.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VC="/home/khayzer/.workbuddy-ai/binaries/node/workspace/node_modules/.bin/vercel"
PROJECT="cariustad-apps"
cd "$ROOT"

if [ ! -x "$VC" ]; then
  echo "✗ Vercel CLI tidak ditemukan di $VC"
  exit 1
fi

# --- 1. cek login -----------------------------------------------------------
if ! "$VC" whoami >/dev/null 2>&1; then
  echo "✗ Belum login ke Vercel."
  echo
  echo "  Jalankan dulu:"
  echo "    $VC login"
  echo
  echo "  Pilih Continue with GitHub, lalu authorize."
  exit 1
fi

WHO="$("$VC" whoami 2>/dev/null | tail -1)"
echo "✓ Login sebagai: $WHO"

# --- 2. link project --------------------------------------------------------
echo
echo "→ Menghubungkan ke project '$PROJECT'..."
"$VC" link --yes --project "$PROJECT"

# --- 3. env var dari .env.local ---------------------------------------------
# NEXT_PUBLIC_AVATAR_GLB sengaja TIDAK diset: tanpa itu agent memakai
# avatar 3D prosedural yang lebih rapi.
SKIP_VARS=" NEXT_PUBLIC_AVATAR_GLB "
ENV_FILE="$ROOT/.env.local"

set_env() {
  local name="$1" value="$2"
  case "$SKIP_VARS" in
    *" $name "*) echo "  · $name dilewati (tidak dipakai di production)"; return 0 ;;
  esac
  if [ -z "$value" ]; then
    echo "  · $name dilewati (nilai kosong)"
    return 0
  fi
  if printf '%s' "$value" | "$VC" env add "$name" production --force >/dev/null 2>&1; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name GAGAL"
    return 1
  fi
}

echo
echo "→ Menyetel environment variables (production) dari .env.local..."
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value; do
    case "$key" in ''|\#*) continue ;; esac
    key="$(printf '%s' "$key" | tr -d '[:space:]')"
    value="${value%$'\r'}"
    case "$key" in
      DEEPSEEK_API_KEY|DEEPSEEK_MODEL|DEEPSEEK_BASE_URL|OPENROUTER_API_KEY|OPENROUTER_CHEAP_MODEL|OPENROUTER_PREFER_FREE|NEXT_PUBLIC_AVATAR_GLB)
        set_env "$key" "$value" ;;
    esac
  done < "$ENV_FILE"
else
  echo "  ! .env.local tidak ada — deploy tetap jalan dengan mesin aturan lokal"
fi

# --- 4. deploy --------------------------------------------------------------
echo
echo "→ Deploy ke production..."
"$VC" deploy --prod --yes

echo
echo "✓ Selesai. Buka URL di atas, lalu periksa badge di /asisten:"
echo "  harus tertulis 'DeepSeek deepseek-flash', bukan 'Mesin lokal'."
