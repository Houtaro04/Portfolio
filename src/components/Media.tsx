import type { CSSProperties } from 'react';
import { asset } from '../hooks';
import type { PhotoItem } from '../types';

interface MediaProps {
  item: PhotoItem;
  /** Ảnh lấp đầy khung cha (hero/about); mặc định giữ tỉ lệ theo item.ratio. */
  fill?: boolean;
  /** Chữ hiện trên khung giữ chỗ. */
  label?: string;
  lazy?: boolean;
}

/** Hiển thị ảnh thật nếu có src, ngược lại hiện khung giữ chỗ. */
export default function Media({ item, fill = false, label = 'Ảnh giữ chỗ', lazy = true }: MediaProps) {
  const ratio = fill ? undefined : item.ratio;

  if (item.src) {
    return (
      <img
        src={asset(item.src)}
        alt={item.title}
        loading={lazy ? 'lazy' : undefined}
        style={ratio ? { aspectRatio: ratio } : undefined}
      />
    );
  }

  const style = { '--h': item.hue ?? 30, aspectRatio: ratio } as CSSProperties;
  return (
    <div className="ph" style={style}>
      {label}
    </div>
  );
}
