import type { CSSProperties } from 'react';
import Media from './Media';
import { useReveal } from '../hooks';
import type { VideoItem } from '../types';

interface VideoCardProps {
  video: VideoItem;
  index: number;
  onOpen: () => void;
}

/** Thẻ video: thumbnail + nút play + tiêu đề. */
export default function VideoCard({ video, index, onOpen }: VideoCardProps) {
  const [ref, visible] = useReveal<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      className={`item album video${visible ? ' in' : ''}`}
      style={{ '--d': `${index * 120}ms` } as CSSProperties}
      aria-label={`Xem video: ${video.title}`}
      data-cursor="Play"
      onClick={onOpen}
    >
      <Media item={{ src: video.thumb ?? '', title: video.title, hue: video.hue }} fill label="Video" />
      <span className="play" aria-hidden="true"><i /></span>
      <span className="cap">
        <strong>{video.title}</strong>
        <small>{video.duration ? `Video · ${video.duration}` : 'Video'}</small>
      </span>
    </button>
  );
}
