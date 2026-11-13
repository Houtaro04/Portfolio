/**
 * Chuyển cảnh khi bấm vào một sản phẩm (kiểu antiantiart.com):
 *  1. Một lưới 5 cột gồm ảnh bìa các mục cùng danh sách phủ kín màn hình, mỗi ô cao bằng cả màn hình,
 *     đang thu nhỏ; lưới phóng dần để ô của mục được bấm choán hết màn hình, kèm tên mục.
 *  2. Chuyển sang trang/cảnh mới (hoặc đổi cảnh ngay nếu cùng trang).
 *  3. Màn che kéo lên (clip-path) để lộ trang mới.
 * Khi chuyển trang thật, thông tin mục được ghi vào sessionStorage để trang mới dựng lại màn che đang phủ kín
 * rồi kéo lên (resumeTransition). Bật "giảm chuyển động" thì bỏ hiệu ứng, chuyển thẳng.
 */
import { PT_KEY, setPageReady } from './preloader';

export interface Cover {
  src?: string;
  hue?: number;
}

export interface TransitionInfo {
  title: string;
  meta?: string;
  /** Ảnh bìa của cả danh sách (để điền các ô xung quanh); `index` là mục được bấm. */
  covers: Cover[];
  index: number;
}

interface Stored {
  title: string;
  meta?: string;
  cover: Cover;
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

const COLS = 5;
const ROWS = 3;
const MAIN = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2); // ô chính nằm giữa lưới
const ZOOM_MS = 1150; // thời gian phóng lưới + hiện tên
const REVEAL_MS = 1050; // thời gian kéo màn che lên

/** Tô nền một ô: ảnh thật hoặc dải màu giữ chỗ theo hue. */
const paint = (el: HTMLElement, cover: Cover): void => {
  if (cover.src) {
    el.style.background = `center / cover no-repeat url("${cover.src.replace(/"/g, '%22')}")`;
  } else {
    const h = cover.hue ?? 30;
    el.style.background = `linear-gradient(135deg,hsl(${h} 35% 24%),hsl(${h + 40} 30% 10%))`;
  }
};

const buildCell = (cover: Cover, main: boolean, label?: { title: string; meta?: string }): HTMLDivElement => {
  const cell = document.createElement('div');
  cell.className = `pt-cell${main ? ' main' : ''}`;
  const img = document.createElement('i');
  paint(img, cover);
  cell.append(img);
  if (main && label) {
    const box = document.createElement('div');
    box.className = 'pt-label';
    if (label.meta) {
      const small = document.createElement('small');
      small.textContent = label.meta;
      box.append(small);
    }
    const line = document.createElement('b');
    const span = document.createElement('span');
    span.textContent = label.title;
    line.append(span);
    box.append(line);
    cell.append(box);
  }
  return cell;
};

const makeOverlay = (): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'pt';
  el.setAttribute('aria-hidden', 'true');
  return el;
};

/** Màn che kéo lên để lộ trang bên dưới. */
const playReveal = async (el: HTMLElement): Promise<void> => {
  await frame();
  setPageReady(true); // cho các hiệu ứng "hiện khi cuộn tới" chạy cùng lúc màn che kéo đi
  el.classList.add('out');
  await wait(REVEAL_MS);
  el.remove();
  root.classList.remove('is-transitioning');
};

/** Dựng lưới ảnh và phóng vào ô được chọn; trả về màn che đang phủ kín màn hình. */
const playOut = async (info: TransitionInfo): Promise<HTMLElement> => {
  const covers = info.covers.length ? info.covers : [{}];
  const n = covers.length;
  const el = makeOverlay();
  const grid = document.createElement('div');
  grid.className = 'pt-grid';
  for (let c = 0; c < COLS * ROWS; c++) {
    const cover = covers[(((c - MAIN + info.index) % n) + n) % n];
    grid.append(buildCell(cover, c === MAIN, c === MAIN ? info : undefined));
  }
  el.append(grid);
  document.body.append(el);
  root.classList.add('is-transitioning');
  await frame();
  el.classList.add('in');
  await wait(ZOOM_MS);
  return el;
};

/** Bấm sang trang khác: phóng lưới rồi chuyển trang; trang mới tự kéo màn che lên (resumeTransition). */
export const transitionNavigate = async (info: TransitionInfo, href: string): Promise<void> => {
  if (reduced) {
    window.location.href = href;
    return;
  }
  const stored: Stored = { title: info.title, meta: info.meta, cover: info.covers[info.index] ?? {} };
  try {
    sessionStorage.setItem(PT_KEY, JSON.stringify(stored));
  } catch {
    /* bỏ qua: không lưu được thì trang mới chỉ hiện bình thường */
  }
  await playOut(info);
  window.location.href = href;
};

/** Đổi cảnh trong cùng trang: phóng lưới, chạy `action` (đổi nội dung), rồi kéo màn che lên. */
export const transitionRoute = async (info: TransitionInfo, action: () => void): Promise<void> => {
  if (reduced) {
    action();
    return;
  }
  setPageReady(false);
  const el = await playOut(info);
  action();
  await wait(160); // chờ nội dung mới dựng xong phía sau màn che
  await playReveal(el);
};

/** Chạy ở trang mới sau khi chuyển cảnh: dựng màn che đang phủ kín (ô được chọn choán màn hình) rồi kéo lên. */
export const resumeTransition = (): void => {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PT_KEY);
    sessionStorage.removeItem(PT_KEY);
  } catch {
    /* bỏ qua */
  }
  if (!raw) return;

  let data: Stored | null = null;
  try {
    data = JSON.parse(raw) as Stored;
  } catch {
    data = null;
  }
  if (!data || reduced) {
    setPageReady(true);
    return;
  }

  const el = makeOverlay();
  el.classList.add('arrive', 'in', 'instant');
  el.append(buildCell(data.cover, true, data));
  document.body.append(el);
  root.classList.add('is-transitioning');

  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    await wait(450); // cho trang mới dựng xong nội dung trước khi kéo màn che lên
    el.classList.remove('instant');
    await playReveal(el);
  };
  if (document.readyState === 'complete') void start();
  else window.addEventListener('load', () => void start(), { once: true });
  window.setTimeout(() => void start(), 2500); // phòng khi sự kiện load không đến
};

/** Quay lại bằng nút Back (bfcache) thì gỡ màn che còn sót. */
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  document.querySelectorAll('.pt').forEach((n) => n.remove());
  root.classList.remove('is-transitioning');
  setPageReady(true);
});

const coverOf = (card: Element): Cover => {
  const img = card.querySelector('img');
  if (img) return { src: img.currentSrc || img.src };
  const ph = card.querySelector<HTMLElement>('.ph');
  const h = ph ? parseFloat(ph.style.getPropertyValue('--h')) : NaN;
  return { hue: Number.isNaN(h) ? undefined : h };
};

/** Lấy ảnh bìa của mọi thẻ cùng danh sách với thẻ được bấm. */
export const infoFromCard = (card: HTMLElement, title: string, meta?: string): TransitionInfo => {
  const siblings = Array.from(card.parentElement?.querySelectorAll(':scope > .item') ?? [card]);
  const index = Math.max(0, siblings.indexOf(card));
  return { title, meta, covers: siblings.map(coverOf), index };
};
