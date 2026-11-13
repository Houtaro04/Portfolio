import { useEffect, useRef } from 'react';
import { hasFinePointer, prefersReducedMotion } from '../boot';

/**
 * Con trỏ riêng (chỉ máy có chuột thật): chấm bám sát chuột + vòng tròn đuổi theo có độ trễ.
 * - Rê lên link / nút: vòng to ra.
 * - Rê lên phần tử có data-cursor="Xem": vòng to hơn, đổi màu và hiện chữ đó bên trong.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!hasFinePointer || prefersReducedMotion) return;
    const dotEl = dot.current;
    const ringEl = ring.current;
    const labelEl = label.current;
    if (!dotEl || !ringEl || !labelEl) return;

    let x = -200, y = -200, rx = -200, ry = -200;
    let raf = 0;
    let seen = false;

    const show = (on: boolean) => {
      dotEl.classList.toggle('on', on);
      ringEl.classList.toggle('on', on);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
        show(true);
      }
    };

    const onOver = (e: Event) => {
      const t = e.target as Element | null;
      const tagged = t?.closest<HTMLElement>('[data-cursor]');
      const interactive = t?.closest('a, button, [role="button"], input, textarea, select');
      labelEl.textContent = tagged?.dataset.cursor ?? '';
      ringEl.classList.toggle('label', !!tagged);
      ringEl.classList.toggle('hover', !!interactive && !tagged);
    };

    const tick = () => {
      rx += (x - rx) * 0.17;
      ry += (y - ry) * 0.17;
      dotEl.style.transform = `translate3d(${x}px,${y}px,0)`;
      ringEl.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onLeave = () => show(false);
    const onEnter = () => seen && show(true);
    const onDown = () => ringEl.classList.add('down');
    const onUp = () => ringEl.classList.remove('down');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  if (!hasFinePointer || prefersReducedMotion) return null;

  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <i><span ref={label} /></i>
      </div>
    </>
  );
}
