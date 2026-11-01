/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // msedge-tts (dipakai /api/tts) tidak boleh dibundel webpack di SERVER —
  // lib WebSocket-nya rusak saat di-minify ("t.mask is not a function").
  experimental: {
    serverComponentsExternalPackages: ["msedge-tts"],
  },
  webpack: (config) => {
    // Di SISI CLIENT, msedge-tts dibundel agar suara TTS tetap (Ardi neural)
    // bekerja tanpa bergantung suara bawaan browser. Node built-ins yang
    // tidak ada di browser dipetakan:
    //  - fs     → false     (hanya dipakai rawToFile, tidak dipakai aplikasi)
    //  - stream → polyfill  (Readable untuk audio/metadata stream)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      stream: "stream-browserify",
      path: false,
    };
    return config;
  },
};

export default nextConfig;
