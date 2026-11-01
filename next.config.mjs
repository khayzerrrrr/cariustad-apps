/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // msedge-tts (dipakai /api/tts) tidak boleh dibundel webpack — lib
  // WebSocket-nya rusak saat di-minify ("t.mask is not a function").
  experimental: {
    serverComponentsExternalPackages: ["msedge-tts"],
  },
};

export default nextConfig;
