import { useSyncExternalStore } from 'react';

/**
 * Kho trạng thái "trang đã sẵn sàng hiện hiệu ứng vào" dùng chung cho:
 *  - màn hình mở đầu (chỉ lần đầu trong phiên, bỏ qua nếu bật "giảm chuyển động")
 *  - màn hình chuyển cảnh khi bấm vào sản phẩm (xem transition.ts)
 * Trong lúc chưa sẵn sàng, mọi hiệu ứng "hiện khi cuộn tới" (useReveal) được giữ lại, để chúng chạy
 * đúng lúc màn che kéo đi chứ không chạy ngầm phía sau.
 */
const SEEN_KEY = 'preloader-seen';
/** Khoá sessionStorage mà transition.ts ghi trước khi chuyển trang. */
export const PT_KEY = 'pt-info';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const alreadySeen = (): boolean => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const transitionPending = (): boolean => {
  try {
    return sessionStorage.getItem(PT_KEY) !== null;
  } catch {
    return false;
  }
};

let ready = !transitionPending() && (reduced || alreadySeen());
const listeners = new Set<() => void>();

/** Đặt trạng thái sẵn sàng; báo cho mọi nơi đang theo dõi. */
export const setPageReady = (value: boolean): void => {
  if (ready === value) return;
  ready = value;
  listeners.forEach((l) => l());
};

/** Gọi khi màn hình mở đầu bắt đầu kéo lên. */
export const markPreloaderDone = (): void => {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* bỏ qua: chế độ riêng tư có thể chặn sessionStorage */
  }
  setPageReady(true);
};

export const isPreloaderDone = (): boolean => ready;

/** true khi trang sẵn sàng hiện hiệu ứng vào (không còn màn che mở đầu / chuyển cảnh). */
export const usePreloaderDone = (): boolean =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => ready
  );
