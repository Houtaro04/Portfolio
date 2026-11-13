import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import Lenis from 'lenis';
import { SCROLL_MODE } from './data';
import { isLite, prefersReducedMotion } from './boot';
import { usePreloaderDone } from './preloader';

/**
 * Trả về [ref, visible]. visible = true khi phần tử cuộn vào màn hình và
 * về false khi nó rời hẳn màn hình, nên animation chạy lại mỗi lần cuộn tới
 * (cả khi cuộn xuống lẫn cuộn ngược lên).
 */
export function useReveal<T extends Element = HTMLElement>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const ready = usePreloaderDone(); // giữ hiệu ứng lại cho tới khi màn hình mở đầu / chuyển cảnh kéo đi

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

  return [ref, visible && ready];
}

/**
 * Gán tiến độ cuộn trang (0 → 1) vào biến CSS --progress.
 * Dùng cho thanh tiến độ phía trên và hiệu ứng nền parallax (xem body::before / .page::before trong styles.css).
 *
 * Tối ưu: biến được gán lên ĐÚNG các phần tử cần dùng (thanh tiến độ, khối .page, <body>) và khai báo
 * `@property --progress { inherits: false }` trong CSS. Nếu gán lên <html> thì biến kế thừa xuống mọi phần tử và
 * mỗi khung hình cuộn trình duyệt phải tính lại style của cả trang (rất giật trên điện thoại).
 * Ở chế độ nhẹ (điện thoại) không có nền parallax nên chỉ cập nhật thanh tiến độ.
 */
export function useScrollProgress(): void {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const value = String(p);
      document
        .querySelectorAll<HTMLElement>(isLite ? '.progress' : '.progress,.page')
        .forEach((el) => el.style.setProperty('--progress', value));
      if (!isLite) document.body.style.setProperty('--progress', value);
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
    if (isLite) return; // chế độ nhẹ (điện thoại): menu bên trái bị ẩn nên không cần theo dõi, đỡ đọc layout mỗi khung hình
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

/**
 * Cuộn ngang theo cuộn dọc (section "ghim"): người dùng cuộn chuột bình thường, trong lúc phần này đang ghim
 * thì dải thẻ chạy sang ngang; chạy hết thì phần này nhả ra và trang cuộn xuống tiếp.
 *
 * Cách làm: `outer` là khối cao = chiều cao màn hình + quãng đường ngang cần chạy (hàm trả về quãng đường này để
 * đặt chiều cao), bên trong có khối `position: sticky` giữ nguyên trên màn hình. Mỗi lần cuộn, tính tiến độ từ vị trí
 * của `outer` rồi dịch `track` sang trái tương ứng và co giãn thanh tiến độ `bar`. `key` đổi (vd đổi tab) thì đo lại.
 */
export function useHorizontalPin(
  outer: RefObject<HTMLElement>,
  viewport: RefObject<HTMLElement>,
  track: RefObject<HTMLElement>,
  bar: RefObject<HTMLElement>,
  key: unknown
): number {
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const o = outer.current;
    const v = viewport.current;
    const t = track.current;
    const b = bar.current;
    if (!o || !v || !t) return;

    let dist = 0;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const top = o.getBoundingClientRect().top;
      const p = dist > 0 ? Math.min(1, Math.max(0, -top / dist)) : 0;
      t.style.transform = `translate3d(${-p * dist}px,0,0)`;
      if (b) b.style.transform = `scaleX(${p})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const measure = () => {
      dist = Math.max(0, Math.round(t.scrollWidth - v.clientWidth));
      setDistance((prev) => (Math.abs(prev - dist) < 1 ? prev : dist));
      schedule();
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    ro?.observe(t);
    ro?.observe(v);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [outer, viewport, track, bar, key]);

  return distance;
}

/**
 * Chân trang "kéo rèm" (kiểu yhao.art): `panel` nằm cố định phía sau, phần nội dung cuộn đi để lộ nó ra.
 * `spacer` là khối trống cuối trang có cùng chiều cao với `panel`. Hook gán biến CSS --reveal (0 → 1)
 * cho `panel` theo mức đã lộ ra, và ẩn hẳn `panel` (visibility) khi chưa lộ để phím Tab không nhảy vào phần đang bị che.
 */
export function useCurtainReveal(spacerRef: RefObject<HTMLElement>, panelRef: RefObject<HTMLElement>): void {
  useEffect(() => {
    const spacer = spacerRef.current;
    const panel = panelRef.current;
    if (!spacer || !panel) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = spacer.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / Math.max(1, r.height)));
      panel.style.setProperty('--reveal', String(p));
      panel.style.visibility = p > 0 ? 'visible' : 'hidden';
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(onScroll) : null;
    ro?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [spacerRef, panelRef]);
}

/**
 * Cuộn mượt có quán tính bằng Lenis (chỉ khi SCROLL_MODE = "smooth" và người dùng không bật "giảm chuyển động").
 * - Bấm link neo (#about, #top...) thì cuộn mượt tới đúng mục.
 * - `locked` = true thì tạm dừng cuộn (lúc màn hình mở đầu đang hiện).
 * - Khung có thuộc tính data-lenis-prevent (lightbox, video) vẫn nhận cuộn chuột bình thường.
 */
export function useSmoothScroll(locked = false): void {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Cảm ứng / màn hẹp: dùng cuộn gốc của trình duyệt (mượt và nhẹ hơn nhiều so với tự mô phỏng quán tính)
    if (SCROLL_MODE !== 'smooth' || prefersReducedMotion || isLite) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }, [locked]);
}

/** Đường dẫn ảnh tương đối theo base của Vite. */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
