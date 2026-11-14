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
  /** Có = chuyển cảnh "về trang chủ" kiểu màn che (xem FxName), không dùng lưới ảnh. */
  fx?: FxName;
}

/**
 * Hiệu ứng "về trang chủ" (khác lưới ảnh dùng khi đi vào album):
 *  curtain: một màn tối kéo lên, logo ở giữa · columns: 6 cột trượt lên so le · layers: 3 lớp (vàng/nâu/đen) quét lên nối tiếp
 *  iris: màn tối khép lại thành điểm tròn quanh logo rồi mở ra.
 * Thử nhanh: mở portfolio.html?fx=columns (tên được nhớ trong phiên); fx=grid là lưới ảnh cũ.
 */
export type FxName = 'curtain' | 'columns' | 'layers' | 'iris';
const FX_LIST: FxName[] = ['curtain', 'columns', 'layers', 'iris'];
const FX_DEFAULT: FxName = 'iris';
const FX_PANELS: Record<FxName, number> = { curtain: 1, columns: 6, layers: 3, iris: 1 };
const FX_COVER_MS = 1150; // thời gian màn che phủ kín
const FX_REVEAL_MS = 1350; // thời gian kéo màn che đi (cả phần so le)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

const COLS = 5;
const ROWS = 3;
const MAIN = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2); // ô chính nằm giữa lưới
const ZOOM_MS = 1150; // thời gian phóng lưới + hiện tên
const REVEAL_MS = 1050; // thời gian kéo màn che lên
const SIMPLE_MS = 800; // chế độ nhẹ: thời gian quét màn che lên ô được chọn

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
const playReveal = async (el: HTMLElement, ms = REVEAL_MS): Promise<void> => {
  await frame();
  setPageReady(true); // cho các hiệu ứng "hiện khi cuộn tới" chạy cùng lúc màn che kéo đi
  el.classList.add('out');
  await wait(ms);
  el.remove();
  root.classList.remove('is-transitioning');
};

/** Màn che kiểu "về trang chủ": các tấm nền + logo ở giữa. */
const makeFx = (name: FxName): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = `fx fx-${name}`;
  el.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < FX_PANELS[name]; i++) {
    const p = document.createElement('i');
    p.className = 'fx-p';
    p.style.setProperty('--i', String(i));
    el.append(p);
  }
  const logo = document.createElement('img');
  logo.className = 'fx-logo';
  logo.src = `${import.meta.env.BASE_URL}images/logo.png`;
  logo.alt = '';
  el.append(logo);
  return el;
};

/** Dựng lưới ảnh và phóng vào ô được chọn; trả về màn che đang phủ kín màn hình. */
const playOut = async (info: TransitionInfo): Promise<HTMLElement> => {
  const covers = info.covers.length ? info.covers : [{}];
  const n = covers.length;
  const el = makeOverlay();

  // Chế độ nhẹ (điện thoại): không dựng lưới 15 ô toàn màn hình (rất nặng), chỉ quét lên ô được chọn
  if (root.classList.contains('lite')) {
    el.classList.add('simple');
    el.append(buildCell(covers[info.index] ?? covers[0], true, info));
    document.body.append(el);
    root.classList.add('is-transitioning');
    await frame();
    el.classList.add('in');
    await wait(SIMPLE_MS);
    return el;
  }

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

/** Tên hiệu ứng "về trang chủ" đang dùng (đọc ?fx= một lần rồi nhớ trong phiên). 'grid' = lưới ảnh. */
export const homeFx = (): FxName | 'grid' => {
  let v: string | null = null;
  try {
    v = new URLSearchParams(window.location.search).get('fx');
    if (v) sessionStorage.setItem('fx', v);
    else v = sessionStorage.getItem('fx');
  } catch {
    /* bỏ qua */
  }
  return v === 'grid' || FX_LIST.includes(v as FxName) ? (v as FxName | 'grid') : FX_DEFAULT;
};

/** Về trang chủ (từ trang portfolio): hiệu ứng màn che + logo, rồi chuyển trang; trang chủ tự kéo màn che đi. */
export const transitionHome = async (href: string): Promise<void> => {
  const fx = homeFx();
  if (fx === 'grid') {
    await transitionNavigate(infoFromPage('Trang chủ', 'Kyle Hoang'), href);
    return;
  }
  if (reduced) {
    window.location.href = href;
    return;
  }
  try {
    sessionStorage.setItem(PT_KEY, JSON.stringify({ title: '', cover: {}, fx } satisfies Stored));
  } catch {
    /* bỏ qua */
  }
  const el = makeFx(fx);
  document.body.append(el);
  root.classList.add('is-transitioning');
  await frame();
  el.classList.add('in');
  await wait(FX_COVER_MS);
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

  let el: HTMLElement;
  if (data.fx && FX_LIST.includes(data.fx)) {
    el = makeFx(data.fx);
    el.classList.add('in', 'instant');
  } else {
    el = makeOverlay();
    el.classList.add('arrive', 'in', 'instant');
    el.append(buildCell(data.cover, true, data));
  }
  const fxMode = !!data.fx;
  document.body.append(el);
  root.classList.add('is-transitioning');

  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    await wait(450); // cho trang mới dựng xong nội dung trước khi kéo màn che lên
    el.classList.remove('instant');
    await playReveal(el, fxMode ? FX_REVEAL_MS : REVEAL_MS);
  };
  if (document.readyState === 'complete') void start();
  else window.addEventListener('load', () => void start(), { once: true });
  window.setTimeout(() => void start(), 2500); // phòng khi sự kiện load không đến
};

/** Quay lại bằng nút Back (bfcache) thì gỡ màn che còn sót. */
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  document.querySelectorAll('.pt,.fx').forEach((n) => n.remove());
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

/** Chuyển cảnh khi rời cả trang (vd. nút "Về trang chủ"): lưới ảnh lấy từ các thẻ đang có trên trang, ô chính là thẻ đầu tiên. */
export const infoFromPage = (title: string, meta?: string): TransitionInfo => {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.albums > .item, .gallery > .item'));
  return { title, meta, covers: cards.map(coverOf), index: 0 };
};

/** Lấy ảnh bìa của mọi thẻ cùng danh sách với thẻ được bấm. */
export const infoFromCard = (card: HTMLElement, title: string, meta?: string): TransitionInfo => {
  // Dải trang chủ: các thẻ nằm cùng một track (kể cả khác phần); lưới trang portfolio: các thẻ cùng cha
  const siblings = Array.from(
    card.closest('.hrail-track')?.querySelectorAll(':scope > .item') ?? card.parentElement?.querySelectorAll(':scope > .item') ?? [card]
  );
  const index = Math.max(0, siblings.indexOf(card));
  return { title, meta, covers: siblings.map(coverOf), index };
};
