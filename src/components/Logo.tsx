import { asset } from '../hooks';
import { PROFILE } from '../data';

interface LogoProps {
  /** Có href = logo là link; bỏ trống = chỉ hiển thị, không bấm được. */
  href?: string;
  className?: string;
}

/** Logo ảnh (public/images/logo.png, nền trong suốt, chữ trắng). */
export default function Logo({ href, className = '' }: LogoProps) {
  const cls = `logo-img ${className}`.trim();
  const img = <img src={asset('images/logo.png')} alt={`${PROFILE.fullName} Photographer`} width={800} height={216} />;

  if (!href) return <div className={cls}>{img}</div>;
  return (
    <a className={cls} href={href} aria-label={`${PROFILE.fullName} — về đầu trang`}>
      {img}
    </a>
  );
}
