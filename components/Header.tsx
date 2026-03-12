'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Header() {
  const navItems = [
    { name: 'About', link: '#about' },
    { name: 'Skills', link: '#skills' },
    { name: 'Experience', link: '#experience' },
    { name: 'Projects', link: '#projects' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-4 px-4"
    >
      <nav className="flex items-center gap-6 px-8 py-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.link}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </motion.header>
  );
}