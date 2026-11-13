import type { CSSProperties, MouseEvent } from 'react';
import Media from './Media';
import { useReveal } from '../hooks';
import { infoFromCard, transitionNavigate, transitionRoute } from '../transition';
import type { PhotoItem } from '../types';

interface CoverCardProps {
  cover: PhotoItem;
  title: string;
  /** Dòng phụ dưới tiêu đề, vd "3 bộ ảnh · 18 ảnh". */
  meta: string;
  /** Đích của thẻ (là link thật nên bấm giữa/mở tab mới đều được). */
  href: string;
  index: number;
  /** Nếu có: đổi cảnh trong cùng trang (không tải lại) thay vì chuyển trang theo href. */
  onNavigate?: () => void;
}

/** Thẻ ảnh bìa dùng cho project và bộ ảnh. Bấm vào thì chạy hiệu ứng chuyển cảnh lưới ảnh (xem transition.ts). */
export default function CoverCard({ cover, title, meta, href, index, onNavigate }: CoverCardProps) {
  const [ref, visible] = useReveal<HTMLAnchorElement>();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Giữ nguyên hành vi mặc định khi mở tab mới (Ctrl/Cmd/Shift/chuột giữa)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const info = infoFromCard(e.currentTarget, title, meta);
    if (onNavigate) void transitionRoute(info, onNavigate);
    else void transitionNavigate(info, href);
  };

  return (
    <a
      ref={ref}
      href={href}
      className={`item album${visible ? ' in' : ''}`}
      style={{ '--d': `${index * 120}ms` } as CSSProperties}
      aria-label={`${title} — ${meta}`}
      data-cursor="Xem"
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
