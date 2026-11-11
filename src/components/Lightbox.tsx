import { useEffect, useRef } from 'react';
import type { TouchEvent } from 'react';
import Media from './Media';
import type { PhotoItem } from '../types';

interface LightboxProps {
  items: PhotoItem[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}

export default function Lightbox({ items, index, onClose, onChange }: LightboxProps) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const item = items[index];
  const go = (d: number) => onChange((index + d + items.length) % items.length);

  // Khoá cuộn trang, focus nút đóng, trả focus khi đóng
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  // Phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button ref={closeBtn} className="lb-close" aria-label="Đóng" onClick={onClose}>✕</button>
      <button className="lb-nav lb-prev" aria-label="Ảnh trước" onClick={() => go(-1)}>‹</button>
      <figure className="lb-fig">
        <div className="lb-img">
          <Media item={item} label="" lazy={false} />
        </div>
        <figcaption>{item.title}  ·  {index + 1}/{items.length}</figcaption>
      </figure>
      <button className="lb-nav lb-next" aria-label="Ảnh sau" onClick={() => go(1)}>›</button>
    </div>
  );
}
