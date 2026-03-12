'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion, AnimatePresence,
  useScroll, useTransform, useSpring,
  useMotionValue, useInView,
} from 'framer-motion';
import {
  Sun, Moon, X, ExternalLink, Download,
  Instagram, Github, Linkedin, MessageCircle,
  ArrowRight, Home, FolderOpen, Mail,
} from 'lucide-react';
import { ThemeAnimationType, useModeAnimation } from 'react-theme-switch-animation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Dock, DockIcon } from '@/components/ui/dock';
import LogoLoop from '@/components/LogoLoop';
import { GitHubCalendar } from 'react-github-calendar';

// ─── LAZY HEAVY COMPONENTS ────────────────────────────────────────────────────
const EncryptedText = dynamic(
  () => import('../components/ui/encrypted-text').then(m => m.EncryptedText),
  { ssr: false }
);
const PixelBlastBg = dynamic(
  () => import('../components/PixelBlast').then(m => m.default),
  { ssr: false, loading: () => null }
);

// ─── DATA ─────────────────────────────────────────────────────────────────────
const techStackList = [
  { name: 'Node.js',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'NestJS',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg' },
  { name: 'GraphQL',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/graphql/graphql-plain.svg' },
  { name: 'PostgreSQL',   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
  { name: 'Prisma',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg' },
  { name: 'MySQL',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg' },
  { name: 'Docker',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'React',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Next.js',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
  { name: 'TypeScript',   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
  { name: 'JavaScript',   icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { name: 'Bootstrap',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bootstrap/bootstrap-original.svg' },
  { name: 'PHP',          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg' },
  { name: 'Laravel',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg' },
  { name: 'Python',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
];

const logoLoopItems = techStackList
  .filter(t => t.icon)
  .map(t => ({ src: t.icon, alt: t.name, href: '#' }));

const logoRow1 = logoLoopItems.slice(0, Math.ceil(logoLoopItems.length / 2));
const logoRow2 = logoLoopItems.slice(Math.ceil(logoLoopItems.length / 2));

const certifications = [
  { title: 'Microsoft Certified: Azure AI Fundamentals',    issuer: 'Microsoft',     year: '2025', img: '/sertifikat/sertifikat-1.png' },
  { title: 'IBM AI Developer Professional Certificate', issuer: 'IBM', year: '2026', img: '/sertifikat/sertifikat-2.png' },
  { title: 'Google AI Professional Certificate', issuer: 'Google', year: '2026', img: '/sertifikat/sertifikat-3.png' }
];

const projects = [
  { title: 'Vendor Marketplace', date: 'On-Going', desc: 'Aplikasi marketplace komprehensif dirancang dengan modul untuk manajemen merchant, pemrosesan pesanan, dan sistem verifikasi aman.', tech: ['Node.js','NestJS','Prisma','TypeScript','PostgreSQL'], images: ['/projects/vendor-1.jpg'], github: 'https://github.com/mxslr/vendor-marketplace.git', demo: '' },
      { title: 'KantinKu Dashboard', date: 'Januari 2026',     desc: 'Dashboard interaktif untuk mengimplementasikan arsitektur microservices untuk memantau dan mengelola operasional kantin secara real-time.', tech: ['Vanilla JS', 'Node.js', 'Express.js', 'GraphQL', 'Docker'], images: ['/projects/kantinku-1.jpeg', '/projects/kantinku-2.jpeg', '/projects/kantinku-3.jpeg', '/projects/kantinku-4.jpeg'], github: 'https://github.com/mxslr/kantinku.git', demo: '' },
      { title: 'Warkop Maju Jaya',   date: 'Desember 2025',   desc: 'Sistem backend solid untuk digitalisasi pencatatan dan operasional warung kopi modern yang efisien.', tech: ['Node.js', 'Express', 'Vanilla JS', 'HTML/CSS', 'Docker'], images: ['/projects/warkop-1.jpeg', '/projects/warkop-2.jpeg', '/projects/warkop-3.jpeg'], github: 'https://github.com/mxslr/warkop-maju-jaya.git', demo: '' },
      { title: 'Sistem Booking Ruangan', date: 'Mei 2025',     desc: 'Sistem Informasi Booking Ruangan berbasis web yang memungkinkan mahasiswa dan dosen untuk mengajukan booking ruangan secara online 24/7.', tech: ['Laravel', 'PHP', 'MySQL', 'Bootstrap', 'JavaScript'], images: ['/projects/booking-1.png', '/projects/booking-2.png', '/projects/booking-3.png', '/projects/booking-4.png'], github: 'https://github.com/mxslr/booking-ruangan-telkomuniversity.git', demo: '' },
      { title: 'ConcertHub', date: 'Desember 2025', desc: 'Sistem Pemesanan Tiket Konser Berbasis Web yang memungkinkan pengguna untuk mencari, memilih, dan membeli tiket konser secara online.', tech: ['Node.js', 'Express.js', 'GraphQL', 'Docker', 'Vanilla JS'], images: ['/projects/concerthub-1.png', '/projects/concerthub-2.png', '/projects/concerthub-3.png', '/projects/concerthub-4.png', '/projects/concerthub-5.png', '/projects/concerthub-6.png', '/projects/concerthub-7.png '], github: 'https://github.com/mxslr/concerthub-microservices.git', demo: '' },
    ];

const experiences = [
  { role: 'Staff of Competition Division', org: 'ERP Laboratory Telkom University',       date: 'Februari 2026 - Present', desc: 'Menjadi Penanggung Jawab program kerja \'Champions Teams\' yang berfokus pada pengembangan iklim kompetitif mahasiswa. Bertanggung jawab memimpin sesi brainstorming, mengelola grup komunitas, serta melakukan riset, pendataan, dan kurasi informasi perlombaan untuk didistribusikan secara strategis melalui media sosial laboratorium. Responsible for the Champions Teams work program, which focuses on developing a competitive environment for students. Responsible for leading brainstorming sessions, managing community groups, and conducting research, data collection, and curation of competition information to be distributed strategically through the laboratory\'s social media.' },
  { role: 'Sponsorship Staff',                     org: 'TUNFC 2026 (Telkom Univ. National Futsal Championship)', date: 'Desember 2025 - Present',    desc: 'Bertanggung jawab dalam divisi sponsorship, menyusun strategi penawaran kerja sama, dan mencari mitra potensial untuk mendukung kesuksesan kejuaraan futsal nasional.' },
  { role: 'Research & Development Division',       org: 'Central Computer Improvement (CCI)',     date: 'Januari 2026 - Present',          desc: 'Aktif dalam divisi R&D dan Riset Data. Bertugas mengeksplorasi teknologi baru, menganalisis data, dan berkontribusi dalam pengembangan inovasi teknologi.' },
];

const translations = {
  en: {
    splash: 'Welcome to My Portfolio',
    heroTag: '— Portfolio 2026',
    heroTitle: 'Software Engineer\n& AI Enthusiast',
    heroDesc: 'Focused on comprehensive software engineering and system architecture, with a growing passion for Artificial Intelligence. Transforming complex data into intelligent solutions.',
    aboutTag: 'about me',
    aboutName: 'Marshall Rasendria Mahendra',
    aboutDesc: "Hi! I'm an Information Systems student at Telkom University bridging the gap between robust systems and intelligent solutions. My core expertise lies in Software Engineering and Cloud Computing, while my current passion is diving deep into Artificial Intelligence. From designing scalable backend architectures to building complex marketplace apps, I'm constantly exploring new ways to solve problems with tech.",
    aboutHighlight1: 'Software Engineering and Cloud Computing,',
    aboutHighlight2: 'Artificial Intelligence',
    downloadCV: 'Download CV',
    techStack: 'Tech Stack',
    tabProjects: 'Projects',
    tabCertifications: 'Certifications',
    tabTechStack: 'Tech Stack',
    expTitle: 'Experience.',
    expSubtitle: 'My journey in organizations, research, and career development.',
    contactTitle: "Let's Talk.",
    contactDesc: 'Have a question, project idea, or collaboration offer? Let\'s discuss it via WhatsApp.',
    chatWA: 'Chat on WhatsApp',
    madeWith: 'Made with',
    closeModal: 'Close',
    nextProject: 'Next Project',
    gallery: 'Gallery',
    clickZoom: 'Click image to zoom',
    scrollCue: 'Scroll',
    navHome: 'Home',
    navProjects: 'Projects',
    navContact: 'Contact',
    projects: [
      { title: 'Vendor Marketplace', date: 'On-Going', desc: 'A comprehensive marketplace application designed with modules for merchant management, order processing, and secure verification systems.', tech: ['Node.js','NestJS','Prisma','TypeScript','PostgreSQL'], images: ['/projects/vendor-1.jpg'], github: 'https://github.com/mxslr/vendor-marketplace.git', demo: '' },
      { title: 'KantinKu Dashboard', date: 'Januari 2026',     desc: 'An interactive dashboard to implement a microservices architecture for monitoring and managing cafeteria operations in real time.', tech: ['Vanilla JS', 'Node.js', 'Express.js', 'GraphQL', 'Docker'], images: ['/projects/kantinku-1.jpeg', '/projects/kantinku-2.jpeg', '/projects/kantinku-3.jpeg', '/projects/kantinku-4.jpeg'], github: 'https://github.com/mxslr/kantinku.git', demo: '' },
      { title: 'Warkop Maju Jaya',   date: 'Desember 2025',   desc: 'A solid backend system for efficient digitization of record-keeping and operations for modern coffee shops.', tech: ['Node.js', 'Express', 'Vanilla JS', 'HTML/CSS', 'Docker'], images: ['/projects/warkop-1.jpeg', '/projects/warkop-2.jpeg', '/projects/warkop-3.jpeg'], github: 'https://github.com/mxslr/warkop-maju-jaya.git', demo: '' },
      { title: 'Sistem Booking Ruangan', date: 'May 2025',     desc: 'A web-based Room Booking Information System that allows students and lecturers to submit room bookings online 24/7.', tech: ['Laravel', 'PHP', 'MySQL', 'Bootstrap', 'JavaScript'], images: ['/projects/booking-1.png', '/projects/booking-2.png', '/projects/booking-3.png', '/projects/booking-4.png'], github: 'https://github.com/mxslr/booking-ruangan-telkomuniversity.git', demo: '' },
      { title: 'ConcertHub', date: 'December 2025', desc: 'A web-based Concert Ticketing System that allows users to browse, select, and purchase concert tickets online.', tech: ['Node.js', 'Express.js', 'GraphQL', 'Docker', 'Vanilla JS'], images: ['/projects/concerthub-1.png', '/projects/concerthub-2.png', '/projects/concerthub-3.png', '/projects/concerthub-4.png', '/projects/concerthub-5.png', '/projects/concerthub-6.png', '/projects/concerthub-7.png '], github: 'https://github.com/mxslr/concerthub-microservices.git', demo: '' },
    ],
    experiences: [
      { role: 'Staff of Competition Division', org: 'ERP Laboratory Telkom University', date: 'February 2026 - Present', desc: 'Responsible for the Champions Teams work program, which focuses on developing a competitive environment for students. Responsible for leading brainstorming sessions, managing community groups, and conducting research, data collection, and curation of competition information to be distributed strategically through the laboratory\'s social media.' },
      { role: 'Sponsorship Staff', org: 'TUNFC 2026 (Telkom Univ. National Futsal Championship)', date: 'December 2025 - Present', desc: 'Responsible for the sponsorship division, developing partnership offer strategies, and seeking potential partners to support the success of the national futsal championship.' },
      { role: 'Research & Development Division', org: 'Central Computer Improvement (CCI)', date: 'January 2026 - Present', desc: 'Active in the R&D and Data Research division. Tasked with exploring new technologies, analyzing data, and contributing to technology innovation development.' },
    ],
    terminalLines: [
      { text: '> node server.js', muted: false },
      { text: '  Server running on port :3000 ✓', muted: true },
      { text: '> prisma migrate deploy', muted: false },
      { text: '  Database synced ✓', muted: true },
      { text: '> git push origin main', muted: false },
      { text: '  Deployed to cloud ✓', muted: true },
    ],
  },
  id: {
    splash: 'Selamat Datang di Portofolio Saya',
    heroTag: '— Portofolio 2026',
    heroTitle: 'Insinyur Perangkat Lunak\nF& Penggemar Kecerdasan Buatan',
    heroDesc: 'Berfokus pada rekayasa perangkat lunak dan arsitektur sistem yang komprehensif, dengan minat yang semakin berkembang dalam Kecerdasan Buatan. Mengubah data kompleks menjadi solusi cerdas.',
    aboutTag: 'tentang saya',
    aboutName: 'Marshall Rasendria Mahendra',
    aboutDesc: 'Halo! Saya mahasiswa Sistem Informasi di Telkom University yang menjembatani kesenjangan antara sistem yang tangguh dan solusi cerdas. Keahlian utama saya terletak pada Rekayasa Perangkat Lunak dan Komputasi Awan, sementara semangat saya saat ini adalah mendalami Kecerdasan Buatan. Dari merancang arsitektur backend yang dapat diskalakan hingga membangun aplikasi marketplace yang kompleks, saya terus mengeksplorasi cara-cara baru untuk memecahkan masalah dengan teknologi.',
    aboutHighlight1: 'Rekayasa Perangkat Lunak dan Komputasi Awan,',
    aboutHighlight2: 'Kecerdasan Buatan',
    downloadCV: 'Unduh CV',
    techStack: 'Struktur Teknologi',
    tabProjects: 'Proyek',
    tabCertifications: 'Sertifikasi',
    tabTechStack: 'Struktur Teknologi',
    expTitle: 'Pengalaman.',
    expSubtitle: 'Perjalanan organisasi, riset, dan pengembangan karir saya.',
    contactTitle: 'Mari Bicara.',
    contactDesc: 'Punya pertanyaan, ide proyek, atau tawaran kolaborasi? Mari diskusikan melalui WhatsApp.',
    chatWA: 'Chat di WhatsApp',
    madeWith: 'Dibuat dengan',
    closeModal: 'Tutup',
    nextProject: 'Proyek Selanjutnya',
    gallery: 'Galeri',
    clickZoom: 'Klik gambar untuk memperbesar',
    scrollCue: 'Gulir',
    navHome: 'Beranda',
    navProjects: 'Proyek',
    navContact: 'Kontak',
    projects: [
      { title: 'Vendor Marketplace', date: 'On-Going', desc: 'Aplikasi marketplace komprehensif dirancang dengan modul untuk manajemen merchant, pemrosesan pesanan, dan sistem verifikasi aman.', tech: ['Node.js','NestJS','Prisma','TypeScript','PostgreSQL'], images: ['/projects/vendor-1.jpg'], github: 'https://github.com/mxslr/vendor-marketplace.git', demo: '' },
      { title: 'KantinKu Dashboard', date: 'Januari 2026',     desc: 'Dashboard interaktif untuk mengimplementasikan arsitektur microservices untuk memantau dan mengelola operasional kantin secara real-time.', tech: ['Vanilla JS', 'Node.js', 'Express.js', 'GraphQL', 'Docker'], images: ['/projects/kantinku-1.jpeg', '/projects/kantinku-2.jpeg', '/projects/kantinku-3.jpeg', '/projects/kantinku-4.jpeg'], github: 'https://github.com/mxslr/kantinku.git', demo: '' },
      { title: 'Warkop Maju Jaya',   date: 'Desember 2025',   desc: 'Sistem backend solid untuk digitalisasi pencatatan dan operasional warung kopi modern yang efisien.', tech: ['Node.js', 'Express', 'Vanilla JS', 'HTML/CSS', 'Docker'], images: ['/projects/warkop-1.jpeg', '/projects/warkop-2.jpeg', '/projects/warkop-3.jpeg'], github: 'https://github.com/mxslr/warkop-maju-jaya.git', demo: '' },
      { title: 'Sistem Booking Ruangan', date: 'Mei 2025',     desc: 'Sistem Informasi Booking Ruangan berbasis web yang memungkinkan mahasiswa dan dosen untuk mengajukan booking ruangan secara online 24/7.', tech: ['Laravel', 'PHP', 'MySQL', 'Bootstrap', 'JavaScript'], images: ['/projects/booking-1.png', '/projects/booking-2.png', '/projects/booking-3.png', '/projects/booking-4.png'], github: 'https://github.com/mxslr/booking-ruangan-telkomuniversity.git', demo: '' },
      { title: 'ConcertHub', date: 'Desember 2025', desc: 'Sistem Pemesanan Tiket Konser Berbasis Web yang memungkinkan pengguna untuk mencari, memilih, dan membeli tiket konser secara online.', tech: ['Node.js', 'Express.js', 'GraphQL', 'Docker', 'Vanilla JS'], images: ['/projects/concerthub-1.png', '/projects/concerthub-2.png', '/projects/concerthub-3.png', '/projects/concerthub-4.png', '/projects/concerthub-5.png', '/projects/concerthub-6.png', '/projects/concerthub-7.png '], github: 'https://github.com/mxslr/concerthub-microservices.git', demo: '' },
    ],
    experiences: [
      { role: 'Staf Divisi Kompetisi', org: 'Laboratorium ERP Universitas Telkom', date: 'Februari 2026 - Sekarang', desc: 'Menjadi Penanggung Jawab program kerja Champions Teams yang berfokus pada pengembangan iklim kompetitif mahasiswa. Bertanggung jawab memimpin sesi brainstorming, mengelola grup komunitas, serta melakukan riset, pendataan, dan kurasi informasi perlombaan untuk didistribusikan secara strategis melalui media sosial laboratorium.' },
      { role: 'Staf Sponsor', org: 'TUNFC 2026 (Telkom Univ. National Futsal Championship)', date: 'Desember 2025 - Sekarang', desc: 'Bertanggung jawab dalam divisi sponsorship, menyusun strategi penawaran kerja sama, dan mencari mitra potensial untuk mendukung kesuksesan kejuaraan futsal nasional.' },
      { role: 'Divisi Penelitian dan Pengembangan', org: 'Central Computer Improvement (CCI)', date: 'Januari 2026 - Sekarang', desc: 'Aktif dalam divisi R&D dan Rekayasa Kecerdasan Buatan. Bertugas mengeksplorasi teknologi baru, menganalisis data, dan berkontribusi dalam pengembangan inovasi teknologi.' },
    ],
    terminalLines: [
      { text: '> node server.js', muted: false },
      { text: '  Server berjalan di port :3000 ✓', muted: true },
      { text: '> prisma migrate deploy', muted: false },
      { text: '  Database tersinkron ✓', muted: true },
      { text: '> git push origin main', muted: false },
      { text: '  Berhasil di-deploy ke cloud ✓', muted: true },
    ],
  },
} as const;

type Lang = keyof typeof translations;

const SOCIAL_ITEMS = [
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com/mxslr' },
  { label: 'LinkedIn',  icon: Linkedin,  href: 'https://linkedin.com/in/mxslr' },
  { label: 'GitHub',    icon: Github,    href: 'https://github.com/mxslr' },
];



function HeroVisual({ isDark, lang }: { isDark: boolean; lang: Lang }) {
  const t = translations[lang];
  const terminalLines = t.terminalLines.map((line, i) => ({ ...line, delay: i * 0.5 }));
  const floatingBadges = ['NestJS', 'PostgreSQL', 'TypeScript'];

  return (
    <div className="relative select-none" style={{ width: 340, height: 340 }}>
      {/* Decorative rotating rings */}
      <motion.div
        className="absolute rounded-full border border-dashed border-black/10 dark:border-white/10 pointer-events-none will-change-transform"
        style={{ inset: -28 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
      />
      <motion.div
        className="absolute rounded-full border border-black/5 dark:border-white/5 pointer-events-none will-change-transform"
        style={{ inset: -56 }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 34, ease: 'linear' }}
      />

      {/* Terminal card */}
      <div className="relative w-full h-full bg-white dark:bg-zinc-900 border border-black/15 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 py-3 border-b border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/60">
          <span className="w-3 h-3 rounded-full bg-red-400/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
          <span className="w-3 h-3 rounded-full bg-green-400/60" />
          <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">~/marshall</span>
        </div>

        {/* Terminal body */}
        <div className="flex-1 p-5 font-mono text-xs leading-relaxed overflow-hidden">
          {terminalLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.6 + line.delay, duration: 0.35, ease: 'easeOut' }}
              className={
                line.muted
                  ? 'text-green-500 dark:text-green-400 mb-2 pl-2'
                  : 'text-black dark:text-white mb-0.5'
              }
            >
              {line.text}
            </motion.div>
          ))}

          {/* Blinking cursor */}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, repeatType: 'mirror' }}
            className="inline-block w-[7px] h-[14px] bg-black dark:bg-white align-middle"
          />
        </div>

        {/* Floating tech badges (bottom-right) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
          {floatingBadges.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 4.2 + i * 0.18, duration: 0.4, ease: 'easeOut' }}
              className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border border-black/15 dark:border-white/15 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-500 shadow-sm"
            >
              {label}
            </motion.div>
          ))}
        </div>

        {/* Subtle pulsing glow overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          animate={{ opacity: [0, 0.04, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          style={{ background: isDark ? '#fff' : '#000' }}
        />
      </div>
    </div>
  );
}
// ─── DIVIDERS ─────────────────────────────────────────────────────────────────
function DiagonalDivider() {
  return (
    <div className="w-full overflow-hidden leading-none text-white dark:text-black">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-16 md:h-20 block">
        <path d="M0,80 L1440,0 L1440,80 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
function WaveDivider({ invert = false }: { invert?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-none text-white dark:text-black ${invert ? 'rotate-180' : ''}`}>
      <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="w-full h-12 block">
        <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,0 1440,25 L1440,50 L0,50 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

// ─── REVEAL BLOCK — lightweight, no clipPath ──────────────────────────────────
function RevealBlock({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const [showSplash,          setShowSplash]          = useState(true);
  const [splashExiting,       setSplashExiting]       = useState(false);
  const [mounted,             setMounted]             = useState(false);
  const [activeTab,           setActiveTab]           = useState<'projects' | 'certifications' | 'techstack'>('projects');
  const [activeModal,         setActiveModal]         = useState<any>(null);
  const [selectedGalleryImage,setSelectedGalleryImage]= useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];
  const NAV_ITEMS = [
  { label: t.navHome,     icon: Home,       id: '' },
  { label: t.navProjects, icon: FolderOpen, id: 'projects' },
  { label: t.navContact,  icon: Mail,       id: 'contact' },
];

  const { ref, toggleSwitchTheme, isDarkMode } = useModeAnimation({ animationType: ThemeAnimationType.CIRCLE });
  

  // Hero parallax — global scroll, no ref hydration issue
  const heroRef    = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [heroH, setHeroH] = useState(800);

  useEffect(() => {
    const upd = () => { if (heroRef.current) setHeroH(heroRef.current.offsetHeight); };
    upd();
    window.addEventListener('resize', upd, { passive: true });
    return () => window.removeEventListener('resize', upd);
  }, [mounted]);

  const textY    = useTransform(scrollY, [0, heroH],       [0, -100]);
  const textOpacity = useTransform(scrollY, [0, heroH * 0.55], [1, 0]);
  const imgY     = useTransform(scrollY, [0, heroH],       [0, -50]);
  const bgY      = useTransform(scrollY, [0, heroH],       [0, 70]);
  const sTextY   = useSpring(textY,  { stiffness: 60, damping: 22 });
  const sImgY    = useSpring(imgY,   { stiffness: 60, damping: 22 });

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setSplashExiting(true), 1800);
    const t2 = setTimeout(() => setShowSplash(false),   2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = (activeModal || selectedGalleryImage) ? 'hidden' : '';
  }, [activeModal, selectedGalleryImage]);

  const handleNextProject = () => {
    const idx = projects.findIndex(p => p.title === activeModal.title);
    setActiveModal({ ...projects[(idx + 1) % projects.length], isProject: true });
  };

  const scrollTo = (id: string) => {
    if (!id) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!mounted) return null;

  // fadeOut color for LogoLoop must match section bg
  const loopFade = isDarkMode ? '#000000' : '#ffffff';

  return (
    <main className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-500 overflow-x-hidden font-mono">


      {/* ── SPLASH ───────────────────────────────────────────────────── */}
      {showSplash && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black"
          animate={splashExiting
            ? { clipPath: ['circle(150% at 50% 50%)', 'circle(0% at 50% 50%)'] }
            : { clipPath: 'circle(150% at 50% 50%)' }}
          transition={splashExiting ? { duration: 0.9, ease: [0.76, 0, 0.24, 1] } : {}}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-center z-10 px-6"
          >
            <motion.h1
              className="text-3xl md:text-5xl font-bold mb-6 tracking-tighter"
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              &lt;{t.splash} /&gt;
            </motion.h1>
            <motion.div
              className="h-[2px] bg-black dark:bg-white mx-auto rounded-full"
              initial={{ width: 0 }} animate={{ width: '100%' }}
              transition={{ delay: 0.6, duration: 1.1, ease: 'easeInOut' }}
            />
            <motion.p
              className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-zinc-400"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >Loading...</motion.p>
          </motion.div>
        </motion.div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-[100] flex justify-between items-center px-6 md:px-12 py-4 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-black/10 dark:border-white/10">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xl md:text-2xl font-bold tracking-tighter hover:opacity-50 transition-opacity"
        >
          marshall.
        </button>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'id' : 'en')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span className={lang === 'en' ? 'opacity-100' : 'opacity-40'}>EN</span>
            <span className="opacity-20">/</span>
            <span className={lang === 'id' ? 'opacity-100' : 'opacity-40'}>ID</span>
          </button>
          {/* Theme toggle */}
          <button
            ref={ref as any} onClick={toggleSwitchTheme}
            className="p-2 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── FLOATING DOCK ────────────────────────────────────────────── */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200]">
        <Dock
          direction="middle"
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl px-1"
        >
          {NAV_ITEMS.map(item => (
            <DockIcon key={item.label}>
              <div className="relative group/tip">
                <button
                  onClick={() => scrollTo(item.id)}
                  className="flex items-center justify-center w-11 h-11 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                >
                  <item.icon className="w-5 h-5" />
                </button>
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2 py-1 opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
                  {item.label}
                </span>
              </div>
            </DockIcon>
          ))}
          <div className="w-px h-7 bg-black/15 dark:bg-white/15 self-center rounded-full mx-0.5" />
          {SOCIAL_ITEMS.map(item => (
            <DockIcon key={item.label}>
              <div className="relative group/tip">
                <a
                  href={item.href} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                >
                  <item.icon className="w-5 h-5" />
                </a>
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2 py-1 opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
                  {item.label}
                </span>
              </div>
            </DockIcon>
          ))}
        </Dock>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[500] bg-white dark:bg-black flex flex-col overflow-hidden"
          >
            {/* Modal header */}
            <div className="shrink-0 px-6 py-4 flex items-center border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center gap-2 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">{t.closeModal}</span>
              </button>
            </div>

            {activeModal.isProject ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModal.title}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden"
                >
                  {/* Left panel */}
                  <div className="w-full lg:w-2/5 flex flex-col relative lg:border-r border-black/10 dark:border-white/10 bg-white dark:bg-black">
                    <div className="flex-1 lg:overflow-y-auto p-6 md:p-10 pb-4 lg:pb-28">
                      <span className="text-xs font-bold border border-black/20 dark:border-white/20 rounded-full px-3 py-1 bg-zinc-100 dark:bg-zinc-900 inline-block mb-5">
                        {activeModal.date}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-tighter leading-tight">{activeModal.title}</h2>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed text-sm">{activeModal.desc}</p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {activeModal.tech?.map((t: string) => (
                          <span key={t} className="px-3 py-1 text-xs font-bold uppercase tracking-wide border border-black/15 dark:border-white/15 rounded-full bg-zinc-50 dark:bg-zinc-900">{t}</span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3">
                        {activeModal.demo && (
                          <a href={activeModal.demo} target="_blank" rel="noreferrer" className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-75 rounded-xl text-sm">
                            Live Demo <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {activeModal.github && (
                          <a href={activeModal.github} target="_blank" rel="noreferrer" className="w-full py-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-black/20 dark:border-white/20 rounded-xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-sm">
                            Source Code <Github className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Next project bar */}
                    <button
                      onClick={handleNextProject}
                      className="mt-auto h-20 border-t border-black/10 dark:border-white/10 bg-white dark:bg-black flex items-center justify-between px-6 group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-left"
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-300 mb-0.5">{t.nextProject}</p>
                        <p className="font-bold uppercase text-base">{projects[(projects.findIndex(p => p.title === activeModal.title) + 1) % projects.length].title}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Gallery */}
                  <div className="w-full lg:w-3/5 lg:overflow-y-auto bg-zinc-50 dark:bg-zinc-900/30 p-6 md:p-10">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-5 hidden lg:block">{t.gallery}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeModal.images?.map((img: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedGalleryImage(img)}
                          className="group relative aspect-video rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-900 cursor-zoom-in border border-black/5 dark:border-white/5"
                        >
                          <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/50 px-3 py-1 rounded-full backdrop-blur-sm">View</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="h-10" />
                  </div>
</motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Full image */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-6 md:p-10">
                  <img
                    src={activeModal.img}
                    alt={activeModal.title}
                    className="max-w-full max-h-[60vh] w-auto h-auto object-contain rounded-2xl shadow-xl border border-black/10 dark:border-white/10 cursor-zoom-in"
                    onClick={() => setSelectedGalleryImage(activeModal.img)}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col items-center text-center gap-4 px-6 py-8 bg-white dark:bg-black border-t border-black/10 dark:border-white/10">
                  <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">{activeModal.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-base">{activeModal.issuer}</p>
                  <span className="px-4 py-1.5 text-xs font-bold border border-black/20 dark:border-white/20 rounded-full">{activeModal.year}</span>
                  <p className="text-xs text-zinc-400 mt-1">{t.clickZoom}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGalleryImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-pointer"
            onClick={() => setSelectedGalleryImage(null)}
          >
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="absolute top-5 right-5 p-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={selectedGalleryImage} alt="preview"
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl border border-white/10 cursor-default"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
<section
  ref={heroRef}
  className="sticky top-0 z-0 min-h-screen flex flex-col justify-center overflow-hidden pt-20 pb-28"
      >
        {/* Dot-grid parallax bg */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.12)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:26px_26px] pointer-events-none"
        />

        {/* PixelBlast — lazy loaded */}
        <div className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none">
          <PixelBlastBg
            variant="circle" pixelSize={4}
            color={isDarkMode ? '#ffffff' : '#000000'}
            patternScale={4.25} patternDensity={1} pixelSizeJitter={0}
            enableRipples rippleSpeed={1} rippleThickness={0.2} rippleIntensityScale={1.5}
            liquid={false} speed={0.5} edgeFade={0.4} transparent
          />
        </div>

        {/* Edge vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,255,255,0.5)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]" />

        {/* Hero content */}
        <motion.div
          style={{ y: sTextY, opacity: textOpacity }}
          className="relative z-10 max-w-6xl mx-auto w-full px-6 flex flex-col-reverse md:flex-row items-center justify-between gap-10"
        >
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-1/2 flex flex-col justify-center"
          >
            <motion.span
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.3, duration: 0.5 }}
              className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4 block"
            >
            </motion.span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter leading-[0.9]">
              {lang === 'en'
                ? <>Software Engineer<br />& AI Enthusiast</>
                : <>Insinyur Perangkat Lunak<br />& Penggemar Kecerdasan Buatan</>
              }
            </h1>
            <div className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 min-h-[80px] max-w-md">
              <EncryptedText
                text={t.heroDesc}
                revealDelayMs={50}
                className="text-black dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              {SOCIAL_ITEMS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                  className="p-2.5 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Interactive visual */}
          <motion.div
            style={{ y: sImgY }}
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-1/2 flex justify-center md:justify-end pb-6 md:pb-0"
          >
            <HeroVisual isDark={isDarkMode} lang={lang} />
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">{t.scrollCue}</span>
          <motion.div
            animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="w-px h-7 bg-gradient-to-b from-black dark:from-white to-transparent rounded-full"
          />
        </motion.div>
      </section>

      {/* Divider hero → about */}
      <div className="-mt-1 bg-white dark:bg-black"><DiagonalDivider /></div>

      {/* ════════════════════════════════════════════════════════════════
          ABOUT
      ════════════════════════════════════════════════════════════════ */}
<section id="about" className="relative z-10 scroll-mt-0 bg-white dark:bg-black py-20 md:py-28 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.6)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <RevealBlock className="w-full md:w-2/5">
              <div className="relative w-full max-w-xs mx-auto md:max-w-none aspect-square group">
                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 translate-x-3 translate-y-3 rounded-3xl group-hover:translate-x-5 group-hover:translate-y-5 transition-transform duration-300" />
                <div className="absolute inset-0 rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg z-10">
                  <img src="/foto-profil.jpg" alt="Marshall" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </RevealBlock>

            <RevealBlock delay={0.15} className="w-full md:w-3/5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">{t.aboutTag}</p>
              <h3 className="text-3xl md:text-4xl font-bold mb-5 uppercase tracking-tight">{t.aboutName}</h3>
              <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                {lang === 'en'
                  ? <>Hi! I'm an Information Systems student at Telkom University bridging the gap between robust systems and intelligent solutions. My core expertise lies in{' '}
                      <span className="text-black dark:text-white font-bold">{t.aboutHighlight1}</span>{' '}while my current passion is diving deep into{' '}
                      <span className="text-black dark:text-white font-bold">{t.aboutHighlight2}</span>. From designing scalable backend architectures to building complex marketplace apps, I'm constantly exploring new ways to solve problems with tech.</>
                  : <>Halo! Saya mahasiswa Sistem Informasi di Telkom University yang menjembatani kesenjangan antara sistem yang tangguh dan solusi cerdas. Keahlian utama saya terletak pada{' '}
                      <span className="text-black dark:text-white font-bold">{t.aboutHighlight1}</span>{' '}sementara semangat saya saat ini adalah mendalami{' '}
                      <span className="text-black dark:text-white font-bold">{t.aboutHighlight2}</span>. Dari merancang arsitektur backend yang dapat diskalakan hingga membangun aplikasi marketplace yang kompleks, saya terus mengeksplorasi cara-cara baru untuk memecahkan masalah dengan teknologi.</>
                }
              </p>
              <a href="/projects/CV_Marshall Rasendria Mahendra.pdf" download
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider hover:opacity-80 rounded-xl shadow-lg transition-all">
                <Download className="w-5 h-5" /> {t.downloadCV}
              </a>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          LOGO LOOP — between About & Projects
      ════════════════════════════════════════════════════════════════ */}
<div className="bg-white dark:bg-black py-10 overflow-hidden">

  {/* Row 1 — lurus, scroll-triggered */}
  <div className="relative mb-3" style={{ height: 72, overflow: 'hidden' }}>
      <LogoLoop
        logos={logoRow1}
        speed={40}
        direction="left"
        logoHeight={44}
        gap={48}
        hoverSpeed={200}
        scaleOnHover={false}
        fadeOut
        fadeOutColor={loopFade}
        ariaLabel="Tech stack row 1"
      />
  </div>

  {/* Row 2 — lurus, scroll-triggered */}
  <div className="relative" style={{ height: 72, overflow: 'hidden' }}>
      <LogoLoop
        logos={logoRow2}
        speed={40}
        direction="right"
        logoHeight={44}
        gap={48}
        hoverSpeed={200}
        scaleOnHover={false}
        fadeOut
        fadeOutColor={loopFade}
        ariaLabel="Tech stack row 2"
      />
  </div>
</div>

      {/* Divider about → projects */}
      <div className="bg-zinc-50 dark:bg-zinc-950"><WaveDivider /></div>

      {/* ════════════════════════════════════════════════════════════════
          PROJECTS / TABS
      ════════════════════════════════════════════════════════════════ */}

      <section id="projects" className="scroll-mt-24 bg-zinc-50 dark:bg-zinc-950 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* --- JUDUL SECTION BARU --- */}
          <RevealBlock className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter">Showcase.</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-base md:text-lg">Koleksi proyek, sertifikasi, dan teknologi yang saya kuasai.</p>
          </RevealBlock>

          {/* Tabs */}
          <RevealBlock className="flex flex-wrap justify-center gap-3 mb-12">
            {(['projects', 'certifications', 'techstack'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-5 py-2 font-bold uppercase tracking-widest text-sm rounded-full border transition-all',
                  activeTab === tab
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-md'
                    : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5'
                )}>
                {tab === 'projects' ? t.tabProjects : tab === 'certifications' ? t.tabCertifications : t.tabTechStack}
              </button>
            ))}
          </RevealBlock>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* Projects */}
            {activeTab === 'projects' && (
              <motion.div key="projects" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
              >
                {t.projects.map((proj, i) => {
                  const fullProj = projects[i];
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.45 }}
                      onClick={() => setActiveModal({ ...fullProj, ...proj, isProject: true })}
                      className="group border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 flex flex-col cursor-pointer hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img src={fullProj.images[0]} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                            View <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-base font-bold uppercase mb-1.5">{proj.title}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{proj.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Certifications */}
            {activeTab === 'certifications' && (
              <motion.div key="certifications" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              >
                {certifications.map((cert, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.45 }}
                    onClick={() => setActiveModal({ ...cert, isProject: false })}
                    className="group cursor-pointer p-5 border border-black/10 dark:border-white/10 rounded-2xl hover:-translate-y-1.5 hover:shadow-xl transition-all bg-white dark:bg-zinc-900 flex flex-col items-center text-center"
                  >
                    <div className="w-full h-36 mb-4 rounded-xl overflow-hidden relative">
                      <img src={cert.img} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <ExternalLink className="text-white w-7 h-7" />
                      </div>
                    </div>
                    <h3 className="font-bold text-sm uppercase leading-tight mb-1.5">{cert.title}</h3>
                    <p className="text-xs text-zinc-500 mb-3">{cert.issuer}</p>
                    <span className="px-3 py-0.5 text-xs font-bold border border-black/20 dark:border-white/20 rounded-full">{cert.year}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Tech Stack */}
            {activeTab === 'techstack' && (
              <motion.div key="techstack" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4"
              >
                {techStackList.map((tech, j) => (
                  <motion.div key={j}
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: j * 0.03, duration: 0.35 }}
                    className="group flex flex-col items-center gap-2.5 p-4 border border-black/10 dark:border-white/10 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black bg-white dark:bg-zinc-900 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    {tech.icon
                      ? <img src={tech.icon} alt={tech.name} className="w-9 h-9 object-contain" />
                      : <div className="w-9 h-9 flex items-center justify-center border border-current rounded-lg font-bold text-sm">{tech.name.substring(0, 2)}</div>
                    }
                    <span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight">{tech.name}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Divider projects → experience */}
      <div className="bg-white dark:bg-black">
        <div className="w-full overflow-hidden text-zinc-50 dark:text-zinc-950">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-14 block rotate-180">
            <path d="M0,60 L1440,0 L1440,60 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

{/* ════════════════════════════════════════════════════════════════
          GITHUB CONTRIBUTIONS
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-black pt-16 md:pt-24 pb-4">
        <div className="max-w-4xl mx-auto px-6">
          <RevealBlock className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">Days I Code.</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-base md:text-lg">Jejak aktivitas dan kontribusi harian saya di GitHub.</p>
          </RevealBlock>

          <RevealBlock delay={0.15}>
            {/* Wrapper dengan overflow-x-auto agar tidak rusak/terpotong saat dibuka di HP */}
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-[800px] flex justify-start md:justify-center p-6 border border-black/15 dark:border-white/15 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 hover:shadow-lg transition-shadow">
                <GitHubCalendar 
                  username="mxslr" 
                  colorScheme={isDarkMode ? 'dark' : 'light'}
                  blockSize={14}
                  blockMargin={5}
                  fontSize={14}
                />
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          EXPERIENCE
      ════════════════════════════════════════════════════════════════ */}
      <section id="experience" className="scroll-mt-24 bg-white dark:bg-black py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <RevealBlock className="mb-14">
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter">{t.expTitle}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-base md:text-lg">{t.expSubtitle}</p>
          </RevealBlock>

          <div className="relative border-l-2 border-black/15 dark:border-white/15 pl-7 md:pl-10 ml-2 md:ml-3">
            {t.experiences.map((exp, idx) => (
              <motion.div key={idx}
                initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="mb-14 relative group"
              >
                {/* Dot */}
                <div className="absolute -left-[35px] md:-left-[49px] top-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-black border-2 border-black dark:border-white group-hover:bg-black dark:group-hover:bg-white group-hover:scale-125 transition-all" />
                <span className="text-xs font-bold border border-black/20 dark:border-white/20 rounded-full px-3 py-1 bg-zinc-100 dark:bg-zinc-900 mb-3 inline-block group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                  {exp.date}
                </span>
                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight mb-1 group-hover:translate-x-1.5 transition-transform">{exp.role}</h3>
                <h4 className="text-base font-medium text-zinc-500 dark:text-zinc-400 mb-3">{exp.org}</h4>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base">{exp.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider experience → contact */}
      <div className="bg-zinc-50 dark:bg-zinc-900/20"><WaveDivider invert /></div>

      {/* ════════════════════════════════════════════════════════════════
          CONTACT
      ════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="scroll-mt-24 bg-zinc-50 dark:bg-zinc-900/20 pt-16 pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <RevealBlock>
            <h2 className="text-4xl md:text-6xl font-bold mb-5 uppercase tracking-tighter">{t.contactTitle}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-base md:text-lg leading-relaxed">
              {t.contactDesc}
            </p>
            <a
              href="https://wa.me/62812818813" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest hover:opacity-80 rounded-2xl shadow-xl transition-all"
            >
              <MessageCircle className="w-5 h-5" /> {t.chatWA}
            </a>
          </RevealBlock>
          <RevealBlock delay={0.15} className="flex justify-center gap-4 mt-14">
            {SOCIAL_ITEMS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                className="p-3.5 border border-black/15 dark:border-white/15 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all hover:shadow-lg bg-white dark:bg-zinc-900">
                <s.icon className="w-5 h-5" />
              </a>
            ))}
          </RevealBlock>

          <div className="mt-14 pt-7 border-t border-black/10 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-400 flex flex-col sm:flex-row items-center justify-center gap-2">
  <span>&copy; {new Date().getFullYear()} Marshall Rasendria.</span>
  <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">·</span>
  <span>
    {t.madeWith}{' '}
    <a href="https://nextjs.org" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white transition-colors">Next.js</a>
    {', '}
    <a href="https://tailwindcss.com" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white transition-colors">Tailwind CSS</a>
    {' & '}
    <a href="https://www.framer.com/motion" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white transition-colors">Framer Motion</a>
  </span>
</div>
        </div>
      </section>

    </main>
  );
}
