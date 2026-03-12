'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Memuat komponen hanya di sisi client (browser) untuk menghindari hydration error
const EncryptedText = dynamic(
  () => import('./ui/encrypted-text').then((mod) => mod.EncryptedText),
  { ssr: false }
);

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden">
      {/* Efek Cahaya / Glow di Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-500/20 blur-[100px] rounded-full -z-10" />

      {/* Tempat Foto Profil */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl bg-zinc-800 flex items-center justify-center"
      >
        <span className="text-zinc-400 text-sm">Foto Profil</span>
      </motion.div>

      {/* Konten Teks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight" id="about">
          Halo, Saya <br />
          <span className="text-white mt-2 block">
            {/* Nama diubah menjadi putih */}
            <EncryptedText 
              text="Marshall Rasendria Mahendra" 
              revealDelayMs={100} 
              className="text-white drop-shadow-md"
            />
          </span>
        </h1>
        
        {/* Deskripsi menggunakan Encrypted Text dengan kecepatan lebih tinggi */}
        <div className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed h-[120px] sm:h-[90px]">
          <EncryptedText 
            text="Mahasiswa Telkom University yang antusias dalam pengembangan backend, cloud computing, dan riset data. Berpengalaman membangun sistem seperti vendor-marketplace dan terus mengeksplorasi teknologi baru."
            revealDelayMs={25} // Dipercepat agar pengunjung tidak menunggu lama
            className="text-zinc-400"
          />
        </div>

        {/* Tombol Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="px-8 py-3 w-full sm:w-auto rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
            Lihat Proyek Saya
          </button>
          <button className="px-8 py-3 w-full sm:w-auto rounded-full border border-white/20 hover:bg-white/10 transition-colors">
            Hubungi Saya
          </button>
        </div>
      </motion.div>
    </section>
  );
}