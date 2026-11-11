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
      style={{ transitionDelay: `${(index % COLS) * 110}ms` }}
      aria-label={`Xem ảnh: ${item.title}`}
      onClick={onOpen}
    >
      <Media item={item} fill />
      <span className="cap">{item.title}</span>
    </button>
  );
}
