import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { isPreloaderDone, markPreloaderDone } from '../preloader';

const DURATION = 1700; // ms: thời gian đếm từ 0 đến 100

/** Màn hình mở đầu: logo + số đếm 0 → 100 + thanh tiến độ, rồi kéo lên để lộ trang. Chỉ hiện lần đầu trong phiên. */
export default function Preloader() {
  const [active, setActive] = useState(() => !isPreloaderDone());
  const [leaving, setLeaving] = useState(false);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  // Khoá cuộn trong lúc hiện màn hình mở đầu
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add('is-loading');
    return () => root.classList.remove('is-loading');
  }, [active]);

  // Đếm số
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let timer = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      if (counter.current) counter.current.textContent = String(Math.round(eased * 100)).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${eased})`;
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        timer = window.setTimeout(() => {
          setLeaving(true);
          markPreloaderDone(); // báo cho hero bắt đầu hiệu ứng ngay khi màn hình kéo lên
        }, 260);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={`preloader${leaving ? ' leaving' : ''}`}
      onTransitionEnd={(e) => {
        if (leaving && e.target === e.currentTarget) setActive(false);
      }}
      aria-hidden="true"
    >
      <div className="preloader-inner">
        <Logo />
        <div className="preloader-meta">
          <span className="preloader-count" ref={counter}>000</span>
          <span className="preloader-bar"><span ref={bar} /></span>
        </div>
      </div>
    </div>
  );
}
