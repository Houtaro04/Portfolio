import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Trả về [ref, visible]. visible = true khi phần tử cuộn vào màn hình và
 * về false khi nó rời hẳn màn hình, nên animation chạy lại mỗi lần cuộn tới
 * (cả khi cuộn xuống lẫn cuộn ngược lên).
 */
export function useReveal<T extends Element = HTMLElement>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.15) setVisible(true);
        else if (!entry.isIntersecting) setVisible(false);
      },
      { threshold: [0, 0.15], rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, visible];
}

/**
 * Gán tiến độ cuộn trang (0 → 1) vào biến CSS --progress của <html>.
 * Dùng cho thanh tiến độ phía trên và hiệu ứng nền parallax (xem body::before trong styles.css).
 */
export function useScrollProgress(): void {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      document.documentElement.style.setProperty('--progress', String(p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Chiều cao trang đổi (đổi tab, mở album...) thì tính lại
    const ro = 'ResizeObserver' in window ? new ResizeObserver(onScroll) : null;
    ro?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/**
 * Scrollspy: trả về id của mục đang nằm ở khoảng 40% chiều cao màn hình.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.4;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // Chạm đáy trang thì luôn là mục cuối
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = ids[ids.length - 1];
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids]);

  return active;
}

/** Đường dẫn ảnh tương đối theo base của Vite. */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
