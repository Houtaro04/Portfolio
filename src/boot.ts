/**
 * Chạy trước khi React hiển thị gì: gắn class lên <html> để CSS biết kiểu cuộn và có dùng con trỏ riêng không.
 *   mode-smooth | mode-snap : kiểu cuộn trang (xem SCROLL_MODE trong data.ts)
 *   has-cursor              : máy có chuột thật và không bật "giảm chuyển động" → dùng con trỏ riêng
 */
import 'lenis/dist/lenis.css';
import { SCROLL_MODE } from './data';
import { resumeTransition } from './transition';

const root = document.documentElement;
root.classList.add(`mode-${SCROLL_MODE}`);

export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (hasFinePointer && !prefersReducedMotion) root.classList.add('has-cursor');

// Nếu vừa chuyển trang bằng hiệu ứng chuyển cảnh (bấm vào sản phẩm), dựng màn che và kéo lên
resumeTransition();
