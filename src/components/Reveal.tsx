import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { useReveal } from '../hooks';

/**
 * up/left/right: cả khối trượt vào từ phía dưới/trái/phải.
 * stagger: các phần tử con hiện lần lượt từ dưới lên.
 */
export type RevealVariant = 'up' | 'left' | 'right' | 'stagger';

type RevealProps<T extends ElementType> = {
  /** Tag HTML cần render, mặc định "div". */
  as?: T;
  variant?: RevealVariant;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/** Animation khi cuộn tới; chạy lại mỗi lần cuộn qua. */
export default function Reveal<T extends ElementType = 'div'>({
  as,
  variant = 'up',
  className = '',
  children,
  ...rest
}: RevealProps<T>) {
  const [ref, visible] = useReveal<HTMLElement>();
  const Tag: ElementType = as ?? 'div';
  const base = variant === 'stagger' ? 'stagger' : `reveal${variant === 'up' ? '' : ` from-${variant}`}`;
  return (
    <Tag ref={ref} className={`${base}${visible ? ' in' : ''} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
