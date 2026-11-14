import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject, RefObject } from 'react';
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
 * Cuộn ngang theo cuộn dọc, DỪNG TỪNG MỤC MỘT (section "ghim"): người dùng cuộn chuột bình thường; trong lúc khối này đang
 * ghim trên màn hình, dải chạy sang ngang, lần lượt đưa từng "điểm dừng" vào chính giữa màn hình và giữ yên một đoạn
 * rồi mới sang điểm kế (thẻ mở phần `.chapter`, album `.item`, thẻ cuối `.rail-more`). Chạy hết thì khối nhả ra và trang
 * cuộn xuống tiếp.
 *
 * Cách làm: `outer` là khối cao = chiều cao màn hình + tổng quãng cuộn dọc cần dùng (hàm trả về quãng này để đặt chiều cao),
 * bên trong có khối `position: sticky`. Mỗi điểm dừng chiếm `step` px cuộn dọc; trong mỗi bước, 8% đầu và 8% cuối là
 * quãng dừng (giữ yên), phần giữa là chuyển động làm mượt (smoothstep) sang điểm kế. Đầu và cuối còn có quãng dừng riêng
 * (25% và 15% chiều cao màn hình) để thẻ đầu luôn được thấy trước. `key` đổi thì đo lại.
 *
 * Khi `enhanced` (máy tính, không bật "giảm chuyển động") còn thêm hiệu ứng kiểu antiantiart, tính trực tiếp mỗi khung hình
 * mà không đọc layout:
 *  - mỗi điểm dừng nhận --f (0..1: độ gần tâm màn hình → to hơn, sáng hơn) và --par (px: ảnh bên trong trượt ngược chiều)
 *  - track nhận --skew (độ nghiêng theo tốc độ chạy, tự về 0 khi dừng)
 *  - `onActive(i)` được gọi mỗi khi điểm dừng ở gần tâm nhất đổi (để hiện tên to ở giữa)
 */
export function useHorizontalPin(
  outer: RefObject<HTMLElement>,
  viewport: RefObject<HTMLElement>,
  track: RefObject<HTMLElement>,
  bar: RefObject<HTMLElement>,
  key: unknown,
  enhanced = false,
  onActive?: (index: number) => void,
  controlRef?: MutableRefObject<((index: number) => void) | null>
): number {
  const [span, setSpan] = useState(0);
  const activeCb = useRef(onActive);
  activeCb.current = onActive;

  useEffect(() => {
    const o = outer.current;
    const v = viewport.current;
    const t = track.current;
    const b = bar.current;
    if (!o || !v || !t) return;

    const stops = Array.from(t.querySelectorAll<HTMLElement>(':scope > .item, :scope > .rail-more'));
    let centers: number[] = []; // tâm mỗi điểm dừng khi track chưa dịch (px, theo toạ độ màn hình)
    let shifts: number[] = []; // quãng cần dịch track sang trái để điểm dừng i nằm đúng tâm màn hình
    let step = 0; // quãng cuộn dọc dành cho mỗi điểm dừng
    let holdStart = 0;
    let curX = 0;
    let lastX = 0;
    let skew = 0;
    let lastActive = -1;
    let raf = 0;
    const medias = stops.map((el) => el.querySelector<HTMLElement>(':scope > img, :scope > .ph'));
    const shown = stops.map(() => false);

    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

    const apply = () => {
      raf = 0;
      const n = stops.length;
      const top = o.getBoundingClientRect().top;
      const travel = Math.max(0, n - 1) * step;
      const u = travel > 0 ? clamp01((-top - holdStart) / travel) : 0;

      let x = 0;
      if (n > 1) {
        const f = u * (n - 1);
        const i = Math.min(n - 2, Math.floor(f));
        // Chế độ nhảy từng album: chuyển động tuyến tính, độ mượt do easing của lần cuộn tự động đảm nhiệm.
        // Chế độ cuộn tự do (điện thoại...): 8% đầu/cuối mỗi bước giữ yên + smoothstep.
        const jump = jumpMode();
        const dwell = jump ? 0 : 0.08;
        const k = clamp01((f - i - dwell) / (1 - 2 * dwell));
        x = shifts[i] + (shifts[i + 1] - shifts[i]) * (jump ? k : k * k * (3 - 2 * k));
      }
      curX = -x;
      t.style.transform = `translate3d(${curX}px,0,0)`;
      if (b) b.style.transform = `scaleX(${u})`;

      // Thẻ gần tâm màn hình nhất (mọi chế độ): để hiện tên phần/tên mục đang xem
      if (n > 0) {
        const half = window.innerWidth / 2;
        let bi = 0;
        let bd = Infinity;
        for (let i = 0; i < n; i++) {
          const dd = Math.abs(centers[i] + curX - half);
          if (dd < bd) {
            bd = dd;
            bi = i;
          }
        }
        if (bi !== lastActive) {
          lastActive = bi;
          activeCb.current?.(bi);
        }
      }
      if (!enhanced || n === 0) return;

      // Nghiêng theo tốc độ chạy rồi trả về thẳng khi dừng
      const velocity = lastX - curX;
      lastX = curX;
      const target = Math.max(-6, Math.min(6, velocity * 0.12));
      skew += (target - skew) * 0.25;
      const sk = Math.abs(skew) < 0.02 ? 0 : skew;

      const vw = window.innerWidth;
      stops.forEach((el, i) => {
        const d = (centers[i] + curX - vw / 2) / vw; // -1..1 so với tâm màn hình
        const ad = Math.abs(d);
        // Chỉ cập nhật các thẻ đang (gần) nằm trong màn hình; thẻ vừa ra khỏi màn hình thì trả về mặc định MỘT lần.
        // Ghi thẳng style (không qua biến CSS) để trình duyệt khỏi tính lại style của cả cây con mỗi khung hình.
        if (ad > 1) {
          if (shown[i]) {
            shown[i] = false;
            el.style.transform = '';
            el.style.opacity = '';
            if (medias[i]) medias[i]!.style.transform = '';
          }
          return;
        }
        shown[i] = true;
        const fcs = Math.max(0, 1 - ad * 1.5); // 1 ở tâm, 0 ở xa
        el.style.transform = `skewX(${sk.toFixed(2)}deg) scale(${(0.9 + 0.1 * fcs).toFixed(3)})`;
        el.style.opacity = (0.5 + 0.5 * fcs).toFixed(3);
        if (medias[i]) medias[i]!.style.transform = `translate3d(${(-d * 70).toFixed(1)}px,0,0)`; // ảnh trượt ngược chiều thẻ
      });
      if (Math.abs(skew) > 0.03 || Math.abs(target) > 0.03) schedule();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const measure = () => {
      const maxShift = Math.max(0, Math.round(t.scrollWidth - v.clientWidth));
      centers = stops.map((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2 - curX;
      });
      const half = window.innerWidth / 2;
      shifts = centers.map((c) => Math.min(maxShift, Math.max(0, c - half)));
      const n = stops.length;
      step = n > 1 ? Math.round(window.innerHeight * 0.36) : 0;
      holdStart = n > 1 ? Math.round(window.innerHeight * 0.18) : 0;
      const holdEnd = n > 1 ? Math.round(window.innerHeight * 0.1) : 0;
      const total = holdStart + Math.max(0, n - 1) * step + holdEnd; // tổng quãng cuộn dọc khối ghim chiếm
      setSpan((prev) => (Math.abs(prev - total) < 1 ? prev : total));
      schedule();
    };

    // ---------- Nhảy từng album một (máy tính, có Lenis) ----------
    // Dù cuộn thế nào (một nấc, lăn mạnh, quán tính trackpad) mỗi lần chỉ chuyển đúng MỘT điểm dừng sang bên cạnh, bằng một
    // lần cuộn tự động có thời gian cố định. Ở hai đầu (thẻ đầu cuộn lên / thẻ cuối cuộn xuống) thì để trang cuộn bình thường
    // để thoát khỏi khối. Trên điện thoại / khi bật "giảm chuyển động" không có Lenis nên vẫn cuộn tự do như trước.
    let animating = false;
    let consumed = false; // một "lần cuộn" (chuỗi sự kiện liên tục) đã được dùng cho một bước
    let lastWheelAt = 0;
    let settleTimer = 0;
    let animTimer = 0;

    const jumpMode = () => enhanced && !!getLenis();
    const pinTopY = () => o.getBoundingClientRect().top + window.scrollY;
    const stopY = (i: number) => pinTopY() + holdStart + i * step;
    const isPinned = () => {
      const r = o.getBoundingClientRect();
      return r.top <= 1 && r.bottom >= window.innerHeight - 1;
    };
    const nearestStop = () => {
      const f = (window.scrollY - pinTopY() - holdStart) / step;
      return Math.min(stops.length - 1, Math.max(0, Math.round(f)));
    };
    const easeInOutQuart = (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
    const goTo = (i: number) => {
      const lenis = getLenis();
      if (!lenis) return;
      animating = true;
      window.clearTimeout(animTimer);
      const done = () => {
        animating = false;
        window.clearTimeout(animTimer);
      };
      animTimer = window.setTimeout(done, 1500); // phòng khi onComplete không được gọi
      lenis.scrollTo(stopY(i), { duration: 0.85, easing: easeInOutQuart, lock: true, force: true, onComplete: done });
    };
    const modalOpen = () => !!document.querySelector('.lightbox');

    const onWheel = (e: WheelEvent) => {
      if (!jumpMode() || e.ctrlKey || stops.length < 2 || modalOpen() || !isPinned()) return;
      const dir = Math.sign(e.deltaY);
      if (dir === 0) return;
      const target = nearestStop() + dir;
      if (target < 0 || target > stops.length - 1) return; // ở hai đầu: để trang cuộn tiếp
      e.preventDefault();
      e.stopImmediatePropagation(); // không cho Lenis xử lý cuộn tự do
      const now = performance.now();
      if (now - lastWheelAt > 160) consumed = false; // ngưng cuộn một lát thì tính là lần cuộn mới
      lastWheelAt = now;
      if (animating || consumed) return;
      consumed = true;
      goTo(target);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!jumpMode() || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || stops.length < 2 || modalOpen() || !isPinned()) return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      let dir = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') dir = 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') dir = -1;
      else if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') dir = e.shiftKey ? -1 : 1;
      if (dir === 0) return;
      const target = nearestStop() + dir;
      if (target < 0 || target > stops.length - 1) return;
      e.preventDefault();
      if (!animating) goTo(target);
    };
    // Cuộn bằng cách khác (kéo thanh cuộn, quán tính còn dư khi vào khối): ngừng cuộn một lát thì tự về điểm dừng gần nhất
    const onScrollIdle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (!jumpMode() || animating || !isPinned()) return;
        const f = (window.scrollY - pinTopY() - holdStart) / step;
        if (f < 0 || f > stops.length - 1) return; // quãng dừng ở hai đầu: không kéo lại để còn thoát khỏi khối
        const i = Math.round(f);
        if (Math.abs(window.scrollY - stopY(i)) > 3) goTo(i);
      }, 200);
    };
    // Lệnh cho bên ngoài (bấm tên phần): nhảy tới điểm dừng i. Có Lenis thì trượt mượt, không thì cuộn mượt của trình duyệt.
    if (controlRef) {
      controlRef.current = (i: number) => {
        const target = Math.min(stops.length - 1, Math.max(0, i));
        if (jumpMode()) goTo(target);
        else window.scrollTo({ top: stopY(target), behavior: 'smooth' });
      };
    }

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('scroll', onScrollIdle, { passive: true });
    window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', measure);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    ro?.observe(t);
    ro?.observe(v);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('scroll', onScrollIdle);
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(animTimer);
      if (controlRef) controlRef.current = null;
    };
  }, [outer, viewport, track, bar, key, enhanced, controlRef]);

  return span;
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
/** Thể hiện Lenis đang chạy (nếu có), để các hook khác ra lệnh cuộn tự động. */
let lenisInstance: Lenis | null = null;
export const getLenis = (): Lenis | null => lenisInstance;

export function useSmoothScroll(locked = false): void {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Cảm ứng / màn hẹp: dùng cuộn gốc của trình duyệt (mượt và nhẹ hơn nhiều so với tự mô phỏng quán tính)
    if (SCROLL_MODE !== 'smooth' || prefersReducedMotion || isLite) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    lenisInstance = lenis;

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
      if (lenisInstance === lenis) lenisInstance = null;
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
