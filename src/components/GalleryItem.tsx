import type { CSSProperties } from 'react';
import Media from './Media';
import { useReveal } from '../hooks';
import type { PhotoItem } from '../types';

export const COLS = 3;

interface GalleryItemProps {
  item: PhotoItem;
  index: number;
  onOpen: () => void;
}

/** Một thẻ ảnh: tự hiện lên (và hiện lại) khi cuộn tới, so le theo cột. */
export default function GalleryItem({ item, index, onOpen }: GalleryItemProps) {
  const [ref, visible] = useReveal<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      className={`item${visible ? ' in' : ''}`}
      style={{ '--d': `${(index % COLS) * 110}ms` } as CSSProperties}
      aria-label={`Xem ảnh: ${item.title}`}
      data-cursor="Xem"
      onClick={onOpen}
    >
      <Media item={item} fill />
      <span className="cap">{item.title}</span>
    </button>
  );
}
