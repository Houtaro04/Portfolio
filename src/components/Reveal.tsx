import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { useReveal } from '../hooks';

/**
 * up/left/right: cả khối trượt vào từ phía dưới/trái/phải.
 * stagger: các phần tử con hiện lần lượt từ dưới lên.
 * none: khối không tự chuyển động, chỉ thêm class "in" khi cuộn tới (để phần con như <Lines> tự chạy hiệu ứng riêng).
 */
export type RevealVariant = 'up' | 'left' | 'right' | 'stagger' | 'none';

type RevealProps<T extends ElementType> = {
  /** Tag HTML cần render, mặc định "div". */
  as?: T;
  variant?: RevealVariant;
  /** true = giữ nguyên trạng thái ẩn dù đã cuộn tới (dùng để chờ màn hình mở đầu xong). */
  hold?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

const baseClass = (variant: RevealVariant): string => {
  if (variant === 'stagger') return 'stagger';
  if (variant === 'none') return 'rv';
  return `reveal${variant === 'up' ? '' : ` from-${variant}`}`;
};

/** Animation khi cuộn tới; chạy lại mỗi lần cuộn qua. */
export default function Reveal<T extends ElementType = 'div'>({
  as,
  variant = 'up',
  hold = false,
  className = '',
  children,
  ...rest
}: RevealProps<T>) {
  const [ref, visible] = useReveal<HTMLElement>();
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag ref={ref} className={`${baseClass(variant)}${visible && !hold ? ' in' : ''} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
