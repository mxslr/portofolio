# 🚀 Portfolio Performance Optimizations

## Ringkasan Masalah & Solusi

| Komponen | Masalah | Dampak | Fix |
|---|---|---|---|
| GeminiWave | 420 Math.sin/frame | 🔴 Sangat Berat | Steps 60→30, LINES di luar, Float32Array |
| PixelBlastBg | Canvas jalan terus meski tak terlihat | 🔴 Berat | IntersectionObserver pause/resume |
| LogoLoop | querySelectorAll(*) tiap velocity change | 🟡 Medium | Cache elemen, debounce |
| Images | Tidak pakai Next/Image | 🟡 Medium | Ganti ke next/image |
| GeminiWave makePath | Array.from baru tiap call | 🟡 Medium | Pre-allocate Float32Array |

---

## PATCH 1 — GeminiWave (Paling Kritis)

```tsx
// SEBELUM — LINES di dalam komponen, dibuat ulang tiap render
function GeminiWave({ scrollVelocity }) {
  // ...
  const LINES = [ /* array dengan 7 objek */ ];
  const makePath = useCallback((baseY, phase, amp, speed) => {
    const steps = 60; // ← 60 steps × 7 lines = 420 kalkulasi/frame!
    return Array.from({ length: steps + 1 }, (_, i) => { /* ... */ }).join(' ');
  }, [vw]);
```

```tsx
// SESUDAH — Pindahkan LINES ke luar komponen, kurangi steps, pre-allocate array
const WAVE_LINES = [
  { color: '#FFB7C5', baseYRatio: 0.72, speed: 0.7,  width: 2,   opacity: 0.9 },
  { color: '#FFDDB7', baseYRatio: 0.64, speed: 1.0,  width: 1.5, opacity: 0.8 },
  { color: '#B1C5FF', baseYRatio: 0.56, speed: 1.3,  width: 2,   opacity: 0.9 },
  { color: '#4FABFF', baseYRatio: 0.48, speed: 0.85, width: 1.5, opacity: 0.8 },
  { color: '#076EFF', baseYRatio: 0.40, speed: 1.15, width: 2,   opacity: 0.9 },
  { color: '#a78bfa', baseYRatio: 0.32, speed: 0.95, width: 1.5, opacity: 0.7 },
  { color: '#34d399', baseYRatio: 0.24, speed: 1.1,  width: 1,   opacity: 0.6 },
];
const WAVE_STEPS = 30; // ← turun dari 60 ke 30, visual hampir sama
const pathParts = new Array(WAVE_STEPS + 1); // ← pre-allocate, jangan pakai Array.from

function GeminiWave({ scrollVelocity }) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const phaseRef = useRef(0);
  const ampRef   = useRef(0);
  const rafRef   = useRef<number>(0);
  const [vw, setVw] = useState(1440);
  const vh = 280;
  const isVisibleRef = useRef(false); // ← baru: visibility tracking

  // Pause RAF saat tidak terlihat
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const makePath = useCallback((baseY: number, phase: number, amp: number, speed: number) => {
    const W = vw;
    for (let i = 0; i <= WAVE_STEPS; i++) {
      const x = (i / WAVE_STEPS) * W;
      const y =
        baseY +
        Math.sin((i / WAVE_STEPS) * Math.PI * 6 + phase * speed) * amp +
        Math.sin((i / WAVE_STEPS) * Math.PI * 3 + phase * speed * 0.5) * amp * 0.4;
      pathParts[i] = `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return pathParts.join(' ');
  }, [vw]);

  useEffect(() => {
    const loop = () => {
      if (!isVisibleRef.current) { // ← skip kalkulasi jika tidak terlihat
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const vel      = Math.abs(scrollVelocity.get());
      const minAmp   = vw < 768 ? 12 : 8;
      const maxAmp   = vw < 768 ? 55 : 45;
      const targetAmp = Math.min(vel / 6, maxAmp);
      ampRef.current += (Math.max(targetAmp, minAmp) - ampRef.current) * 0.08;
      ampRef.current = Math.round(ampRef.current * 10) / 10; // ← kurangi floating point noise

      const baseSpeed   = 0.018;
      const scrollBoost = Math.min(vel / 800, 0.05);
      phaseRef.current += baseSpeed + scrollBoost;

      if (svgRef.current) {
        const wavePaths = svgRef.current.querySelectorAll<SVGPathElement>('[data-wave]');
        const blurPaths = svgRef.current.querySelectorAll<SVGPathElement>('[data-blur]');
        WAVE_LINES.forEach((line, i) => {
          const baseY = line.baseYRatio * vh;
          const d = makePath(baseY, phaseRef.current, ampRef.current, line.speed);
          wavePaths[i]?.setAttribute('d', d);
          blurPaths[i]?.setAttribute('d', d);
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scrollVelocity, vw, makePath]);
  
  // ... sisa JSX sama
}
```

---

## PATCH 2 — PixelBlastBg (Pause saat tidak terlihat)

```tsx
// Bungkus PixelBlastBg dengan visibility container
// Di section hero, tambahkan ref:
const heroVisibleRef = useRef(false);

// Ganti div wrapper PixelBlastBg:
// SEBELUM:
<div className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none">
  <PixelBlastBg ... />
</div>

// SESUDAH:
<PixelBlastVisibilityWrapper>
  <PixelBlastBg ... />
</PixelBlastVisibilityWrapper>

// Buat wrapper component baru:
function PixelBlastVisibilityWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0, rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none">
      {visible && children}
    </div>
  );
}
```

---

## PATCH 3 — LogoLoop (Cache DOM query)

```tsx
// SEBELUM — querySelectorAll(*) dijalankan tiap logoPlaying berubah
useEffect(() => {
  const toggle = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    ref.current.querySelectorAll<HTMLElement>('*').forEach(el => { // ← mahal!
      el.style.animationPlayState = logoPlaying ? 'running' : 'paused';
    });
  };
  toggle(logoRef1);
  toggle(logoRef2);
}, [logoPlaying]);

// SESUDAH — Cache elements, gunakan CSS class
// Tambahkan di globals.css:
// .logo-paused * { animation-play-state: paused !important; }
// .logo-running * { animation-play-state: running !important; }

useEffect(() => {
  logoRef1.current?.classList.toggle('logo-paused', !logoPlaying);
  logoRef1.current?.classList.toggle('logo-running', logoPlaying);
  logoRef2.current?.classList.toggle('logo-paused', !logoPlaying);
  logoRef2.current?.classList.toggle('logo-running', logoPlaying);
}, [logoPlaying]);
```

---

## PATCH 4 — Ganti `<img>` dengan `next/image`

```tsx
// Tambah import di atas file:
import Image from 'next/image';

// SEBELUM:
<img src="/foto-profil.jpg" alt="Marshall"
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

// SESUDAH:
<Image
  src="/foto-profil.jpg" alt="Marshall"
  fill sizes="(max-width: 768px) 100vw, 40vw"
  className="object-cover group-hover:scale-105 transition-transform duration-700"
  priority // ← karena above-the-fold
/>

// Untuk project cards (NOT above the fold, jadi tanpa priority):
<Image
  src={fullProj.images[0]} alt={proj.title}
  fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="object-cover group-hover:scale-105 transition-transform duration-500"
  loading="lazy"
/>
// Pastikan parent element punya: className="relative" + position non-static
```

---

## PATCH 5 — Memoize HeroVisual

```tsx
// SEBELUM:
function HeroVisual({ isDark, lang }) { ... }

// SESUDAH — tambah React.memo agar tidak re-render saat parent scroll:
import { memo } from 'react';

const HeroVisual = memo(function HeroVisual({ isDark, lang }: { isDark: boolean; lang: Lang }) {
  // ... isi sama
});
```

---

## PATCH 6 — Reduce Framer Motion Overhead (Hero)

```tsx
// SEBELUM — 2 spring di atas transform, stacked
const sTextY = useSpring(textY, { stiffness: 60, damping: 22 });
const sImgY  = useSpring(imgY,  { stiffness: 60, damping: 22 });

// SESUDAH — hapus spring, pakai raw transform langsung
// Spring menambah 1 layer kalkulasi physics per frame
// Efek visual hampir tidak berbeda karena scrollY sudah smooth
const sTextY = textY; // ← langsung tanpa spring
const sImgY  = imgY;

// Alternatif: naikkan damping agar spring lebih ringan
const sTextY = useSpring(textY, { stiffness: 80, damping: 35, mass: 0.5 });
```

---

## PATCH 7 — Tambahkan `will-change` & GPU Hints

```tsx
// Di tailwind, tambahkan ke elemen yang di-animate:
// GeminiWave SVG container:
<svg ... className="absolute inset-0 w-full h-full [will-change:contents]" />

// Hero visual card:
<div className="... [will-change:transform]"> {/* terminal card */}

// Rotating rings:
<motion.div className="... [will-change:transform]" animate={{ rotate: 360 }} ... />
```

---

## PATCH 8 — next.config.js Image Domains

```js
// next.config.js — pastikan external images dioptimasi
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.jsdelivr.net'], // untuk devicon icons di tech stack
    formats: ['image/avif', 'image/webp'],
  },
};
module.exports = nextConfig;
```

---

## Urutan Implementasi yang Disarankan

1. **Patch 1** (GeminiWave) → Dampak terbesar, langsung terasa
2. **Patch 2** (PixelBlastBg visibility) → Sangat membantu saat scroll ke bawah
3. **Patch 5** (HeroVisual memo) → Mudah, 1 baris
4. **Patch 6** (Hapus springs) → Mudah, langsung terasa
5. **Patch 4** (next/image) → Perlu refactor sedikit, tapi worth it
6. **Patch 3** (LogoLoop) → Butuh CSS di globals.css
7. **Patch 7 & 8** → Finishing touches

---

## Estimasi Improvement

| Sebelum | Sesudah (estimasi) |
|---|---|
| ~420 Math.sin/frame | ~210 Math.sin/frame (-50%) |
| PixelBlast jalan terus | PixelBlast pause saat di-scroll |
| DOM query tiap velocity | CSS class toggle (O(1)) |
| Unoptimized images | Lazy load + WebP/AVIF + resize otomatis |
| HeroVisual re-render tiap scroll | Tidak re-render (memo) |

Target: dari **heavy/janky** → **60fps smooth** bahkan di laptop mid-range.
