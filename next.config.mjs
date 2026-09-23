/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Font dimuat langsung oleh peramban lewat tautan di app/layout.tsx.
  // Pengambilan font saat proses build dimatikan agar build tetap berhasil
  // meski jaringan sedang tidak dapat menjangkau Google Fonts.
  optimizeFonts: false,
};

export default nextConfig;
