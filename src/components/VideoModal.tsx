import { useEffect, useRef } from 'react';
import { asset } from '../hooks';
import type { VideoItem } from '../types';

interface VideoModalProps {
  video: VideoItem;
  onClose: () => void;
}

/** Khung phát video (YouTube hoặc file mp4) hiện trên nền tối; Esc hoặc bấm nền để đóng. */
export default function VideoModal({ video, onClose }: VideoModalProps) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  let player;
  if (video.youtubeId) {
    player = (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
        title={video.title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  } else if (video.src) {
    player = <video src={asset(video.src)} controls autoPlay playsInline />;
  } else {
    player = (
      <div className="vid-empty">
        <p>Video giữ chỗ</p>
        <small>Thêm <code>youtubeId</code> hoặc <code>src</code> cho video này trong src/data.ts</small>
      </div>
    );
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button ref={closeBtn} className="lb-close" aria-label="Đóng" onClick={onClose}>✕</button>
      <figure className="lb-fig">
        <div className="vid-frame">{player}</div>
        <figcaption>{video.title}{video.desc ? `  ·  ${video.desc}` : ''}</figcaption>
      </figure>
    </div>
  );
}
