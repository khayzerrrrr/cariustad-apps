/**
 * Konfigurasi publik cloud service (aman disimpan di kode front-end).
 *
 * Nilai-nilai ini didapat dari hasil aktivasi cloud service WorkBuddy
 * (publicConfig). Selama masih `null`, asisten memakai mesin lokal
 * berbasis aturan — tidak ada panggilan LLM.
 *
 * Cara mengaktifkan:
 * 1. Aktifkan cloud service untuk proyek ini (dialog konfirmasi WorkBuddy).
 * 2. Salin `resourceId`, `endpoint`, `oauthRelayBaseUrl`, dan `publishableKey`
 *    dari publicConfig ke objek di bawah.
 * 3. Simpan. Asisten otomatis memakai LLM WorkBuddy tanpa API key.
 *
 * Catatan: `publishableKey` hanya mengidentifikasi aplikasi dan tidak
 * membawa izin apa pun — server tetap memvalidasi Origin.
 */

export interface CloudPublicConfig {
  resourceId: string;
  endpoint: string;
  oauthRelayBaseUrl?: string;
  publishableKey: string;
}

export const CLOUD_PUBLIC_CONFIG: CloudPublicConfig | null = null;
