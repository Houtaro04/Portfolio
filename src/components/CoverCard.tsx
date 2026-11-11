import type { MouseEvent } from 'react';
import Media from './Media';
import { useReveal } from '../hooks';
import type { PhotoItem } from '../types';

interface CoverCardProps {
  cover: PhotoItem;
  title: string;
  /** Dòng phụ dưới tiêu đề, vd "3 bộ ảnh · 18 ảnh". */
  meta: string;
  /** Đích của thẻ (là link thật nên bấm giữa/mở tab mới đều được). */
  href: string;
  index: number;
  /** Nếu có: chuyển trang trong cùng trang (không tải lại) thay vì theo href. */
  onNavigate?: () => void;
}

/** Thẻ ảnh bìa dùng cho project và bộ ảnh. */
export default function CoverCard({ cover, title, meta, href, index, onNavigate }: CoverCardProps) {
  const [ref, visible] = useReveal<HTMLAnchorElement>();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Giữ nguyên hành vi mặc định khi mở tab mới (Ctrl/Cmd/chuột giữa)
    if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate();
  };

  return (
    <a
      ref={ref}
      href={href}
      className={`item album${visible ? ' in' : ''}`}
      style={{ transitionDelay: `${index * 120}ms` }}
      aria-label={`${title} — ${meta}`}
      onClick={onClick}
    >
      <Media item={cover} fill />
      <span className="cap">
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
    </a>
  );
}
